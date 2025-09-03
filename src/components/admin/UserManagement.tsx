import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Mail, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { User } from '../../types';
import { getStoredUsers, saveUser, generateUserId, generateTemporaryPassword, sendLoginCredentials } from '../../utils/auth';
import { logAuditEvent } from '../../utils/audit';
import { useAuth } from '../../contexts/AuthContext';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';

import { notificationService } from '../../services/notificationService';

interface UserManagementProps {
  onUserChange: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ onUserChange }) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const loadUsers = () => {
    const allUsers = getStoredUsers();
    setUsers(allUsers);
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleCreateUser = () => {
    setShowCreateModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = (user: User) => {
    if (window.confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) {
      const updatedUsers = users.filter(u => u.id !== user.id);
      localStorage.setItem('study_platform_users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
      
      if (currentUser) {
        logAuditEvent(
          currentUser.id,
          `${currentUser.firstName} ${currentUser.lastName}`,
          'USER_DELETE',
          `Deleted user: ${user.firstName} ${user.lastName} (${user.username})`
        );
      }
      
      onUserChange();
    }
  };

  const handleToggleUserStatus = (user: User) => {
    const updatedUser = { ...user, isActive: !user.isActive };
    saveUser(updatedUser);
    loadUsers();
    
    if (currentUser) {
      logAuditEvent(
        currentUser.id,
        `${currentUser.firstName} ${currentUser.lastName}`,
        'USER_STATUS_CHANGE',
        `${user.isActive ? 'Deactivated' : 'Activated'} user: ${user.firstName} ${user.lastName}`
      );
    }
    
    onUserChange();
  };

  const handleResetPassword = (user: User) => {
    if (window.confirm(`Reset password for ${user.firstName} ${user.lastName}?`)) {
      const newPassword = generateTemporaryPassword();
      const updatedUser = { ...user, mustChangePassword: true, tempPassword: newPassword };
      saveUser(updatedUser);
      loadUsers();
      
      // Send password reset email
      notificationService.sendPasswordReset(user, newPassword).then((result) => {
        if (result.success) {
          alert(`Password reset email sent successfully!\n\nNew password: ${newPassword}\n\nUser will be required to change this password on next login.\n\nCheck the browser console to see the email content.`);
        } else {
          alert(`Failed to send password reset email: ${result.message}\n\nNew password: ${newPassword}\n\nPlease provide this password to the user manually.`);
        }
      });
      
      if (currentUser) {
        logAuditEvent(
          currentUser.id,
          `${currentUser.firstName} ${currentUser.lastName}`,
          'PASSWORD_RESET',
          `Reset password for user: ${user.firstName} ${user.lastName}`
        );
      }
      
      onUserChange();
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const getTemporaryPassword = (user: User): string => {
    // Return stored temporary password or default for demo users
    if (user.username === 'admin') return 'admin123';
    if (user.username === 'prof.smith') return 'teacher123';
    if (user.username === 'john.doe' || user.username === 'jane.smith') return 'student123';
    return user.tempPassword || 'temp123';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <button
          onClick={handleCreateUser}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Users
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Search by name, username, or email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Role
            </label>
            <select
              id="roleFilter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Users ({filteredUsers.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Academic Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credentials
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      <div className="text-xs text-gray-400">ID: {user.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.role === 'student' ? (
                      <div>
                        <div>Year: {user.academicYear}</div>
                        <div>Semester: {user.currentSemester}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {user.mustChangePassword && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Must Change Password
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">Username: {user.username}</div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">Password:</span>
                        <span className="font-mono text-sm">
                          {showPasswords[user.id] ? getTemporaryPassword(user) : '••••••••'}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(user.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords[user.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="Edit User"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleResetPassword(user)}
                      className="text-orange-600 hover:text-orange-900 p-1"
                      title="Reset Password"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleUserStatus(user)}
                      className={`p-1 ${user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                      title={user.isActive ? 'Deactivate User' : 'Activate User'}
                    >
                      {user.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {user.id !== currentUser?.id && (
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">No users found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateUserModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onUserCreated={() => {
            loadUsers();
            onUserChange();
          }}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          isOpen={showEditModal}
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onUserUpdated={() => {
            loadUsers();
            onUserChange();
          }}
        />
      )}
    </div>
  );
};

export default UserManagement;