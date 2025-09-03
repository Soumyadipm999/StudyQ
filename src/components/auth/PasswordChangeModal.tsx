import React, { useState } from 'react';
import { X, Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PasswordChangeData } from '../../types';
import { validatePasswordStrength } from '../../utils/auth';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isForced?: boolean;
}

const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({ isOpen, onClose, isForced = false }) => {
  const { updatePassword } = useAuth();
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const passwordValidation = validatePasswordStrength(passwordData.newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0]);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const result = await updatePassword(passwordData);
      if (result.success) {
        onClose();
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setError(result.error || 'Failed to update password');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={!isForced ? onClose : undefined}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {isForced ? 'Password Change Required' : 'Change Password'}
            </h3>
            {!isForced && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {isForced && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">
                You must change your password before continuing to use the system.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>

              {/* Password Requirements */}
              {passwordData.newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="text-xs text-gray-600">Password requirements:</div>
                  <div className="space-y-1">
                    {[
                      { test: passwordData.newPassword.length >= 8, text: 'At least 8 characters' },
                      { test: /[a-z]/.test(passwordData.newPassword), text: 'One lowercase letter' },
                      { test: /[A-Z]/.test(passwordData.newPassword), text: 'One uppercase letter' },
                      { test: /\d/.test(passwordData.newPassword), text: 'One number' },
                      { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordData.newPassword), text: 'One special character' }
                    ].map((req, index) => (
                      <div key={index} className={`flex items-center text-xs ${req.test ? 'text-green-600' : 'text-gray-500'}`}>
                        <Check className={`w-3 h-3 mr-1 ${req.test ? 'text-green-600' : 'text-gray-300'}`} />
                        {req.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              {!isForced && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading || !passwordValidation.isValid || passwordData.newPassword !== passwordData.confirmPassword}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin inline" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordChangeModal;