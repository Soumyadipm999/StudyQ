import React, { useState } from 'react';
import { X, Loader2, Mail, Eye, EyeOff } from 'lucide-react';
import { User } from '../../types';
import { generateUserId, generateTemporaryPassword, saveUser, sendLoginCredentials } from '../../utils/auth';
import { logAuditEvent } from '../../utils/audit';
import { useAuth } from '../../contexts/AuthContext';

import { notificationService } from '../../services/notificationService';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onUserCreated }) => {
  const { user: currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'student' as 'teacher' | 'student',
    academicYear: new Date().getFullYear(),
    currentSemester: 1
  });
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    username: string;
    password: string;
  } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'academicYear' || name === 'currentSemester' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Generate credentials
      const userId = generateUserId(formData.role);
      const username = `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}`;
      const password = generateTemporaryPassword();

      const newUser: User = {
        id: userId,
        username,
        email: formData.email,
        role: formData.role,
        firstName: formData.firstName,
        lastName: formData.lastName,
        isActive: true,
        createdAt: new Date().toISOString(),
        mustChangePassword: true,
        failedLoginAttempts: 0,
        tempPassword: password, // Store temporary password for demo authentication
        ...(formData.role === 'student' && {
          academicYear: formData.academicYear,
          currentSemester: formData.currentSemester,
          whatsappNumber: ''
        })
      };

      saveUser(newUser);
      setGeneratedCredentials({ username, password });

      if (currentUser) {
        logAuditEvent(
          currentUser.id,
          `${currentUser.firstName} ${currentUser.lastName}`,
          'USER_CREATE',
          `Created new ${formData.role}: ${formData.firstName} ${formData.lastName} (${username})`
        );
      }

      onUserCreated();
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCredentials = () => {
    if (generatedCredentials) {
      // Create a user object for the email function
      const userForEmail: User = {
        id: 'temp-id',
        username: generatedCredentials.username,
        email: formData.email,
        role: formData.role,
        firstName: formData.firstName,
        lastName: formData.lastName,
        isActive: true,
        createdAt: new Date().toISOString(),
        mustChangePassword: true,
        failedLoginAttempts: 0,
        ...(formData.role === 'student' && {
          academicYear: formData.academicYear,
          currentSemester: formData.currentSemester
        })
      };
      
      notificationService.sendLoginCredentials(userForEmail, generatedCredentials.password).then((result) => {
        if (result.success) {
          alert(`${result.message}\n\nCheck the browser console to see the detailed email content.`);
          onClose();
        } else {
          alert(`Failed to send email: ${result.message}\n\nPlease provide the credentials manually:\nUsername: ${generatedCredentials.username}\nPassword: ${generatedCredentials.password}`);
        }
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {generatedCredentials ? 'User Created Successfully' : 'Create New User'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {generatedCredentials ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-sm text-green-800 mb-2">User created successfully!</p>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Username:</span> {generatedCredentials.username}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Password:</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                      {showPassword ? generatedCredentials.password : '••••••••••••'}
                    </span>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  The user will be required to change their password on first login for security.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Done
                </button>
                <button
                  onClick={handleSendCredentials}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Credentials via Email
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>

              {formData.role === 'student' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Academic Year *
                    </label>
                    <select
                      name="academicYear"
                      value={formData.academicYear}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {[...Array(5)].map((_, i) => {
                        const year = new Date().getFullYear() - 2 + i;
                        return <option key={year} value={year}>{year}</option>;
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Semester *
                    </label>
                    <select
                      name="currentSemester"
                      value={formData.currentSemester}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {[...Array(8)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin inline" />
                      Creating...
                    </>
                  ) : (
                    'Create User'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateUserModal;