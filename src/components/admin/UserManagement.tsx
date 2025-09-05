import React, { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { userService, UserFilters } from '../../services/userService'
import { AuthUser } from '../../services/authService'
import { useAuth } from '../../contexts/AuthContext'
import CreateUserModal from './CreateUserModal'
import EditUserModal from './EditUserModal'

interface UserManagementProps {
  onUserChange: () => void
}

const UserManagement: React.FC<UserManagementProps> = ({ onUserChange }) => {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<AuthUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null)
  const [filters, setFilters] = useState<UserFilters>({})

  useEffect(() => {
    loadUsers()
  }, [filters])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError('')
      const fetchedUsers = await userService.getAllUsers(filters)
      setUsers(fetchedUsers)
    } catch (error) {
      console.error('Error loading users:', error)
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = () => {
    setShowCreateModal(true)
  }

  const handleEditUser = (user: AuthUser) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleDeleteUser = async (user: AuthUser) => {
    if (user.user_id === currentUser?.user_id) {
      alert('You cannot delete your own account')
      return
    }

    if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      try {
        const result = await userService.deleteUser(user.user_id)
        if (result.success) {
          await loadUsers()
          onUserChange()
        } else {
          alert(`Failed to delete user: ${result.error}`)
        }
      } catch (error) {
        console.error('Error deleting user:', error)
        alert('Failed to delete user')
      }
    }
  }

  const handleToggleUserStatus = async (user: AuthUser) => {
    if (user.user_id === currentUser?.user_id) {
      alert('You cannot deactivate your own account')
      return
    }

    try {
      const result = await userService.toggleUserStatus(user.user_id)
      if (result.success) {
        await loadUsers()
        onUserChange()
      } else {
        alert(`Failed to update user status: ${result.error}`)
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
      alert('Failed to update user status')
    }
  }

  const handleResetPassword = async (user: AuthUser) => {
    if (window.confirm(`Reset password for ${user.name}?`)) {
      try {
        const result = await userService.resetUserPassword(user.user_id)
        if (result.success && result.tempPassword) {
          alert(`Password reset successfully!\n\nNew password: ${result.tempPassword}\n\nUser will be required to change this password on next login.`)
          await loadUsers()
          onUserChange()
        } else {
          alert(`Failed to reset password: ${result.error}`)
        }
      } catch (error) {
        console.error('Error resetting password:', error)
        alert('Failed to reset password')
      }
    }
  }

  const handleFilterChange = (key: keyof UserFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'teacher':
        return 'bg-blue-100 text-blue-800'
      case 'student':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading users...</span>
      </div>
    )
  }

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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Users
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                id="search"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Search by name, email, or ID"
              />
            </div>
          </div>

          <div>
            <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Role
            </label>
            <select
              id="roleFilter"
              value={filters.role || ''}
              onChange={(e) => handleFilterChange('role', e.target.value || undefined)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>

          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              id="statusFilter"
              value={filters.is_active === undefined ? '' : filters.is_active.toString()}
              onChange={(e) => handleFilterChange('is_active', e.target.value === '' ? undefined : e.target.value === 'true')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({})}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-600">
            Showing {users.length} users
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.user_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      <div className="text-xs text-gray-400">ID: {user.user_id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.role === 'student' ? (
                      <div>
                        <div>Year: {user.academic_year}</div>
                        <div>Semester: {user.current_semester}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {user.force_password_change && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Must Change Password
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
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
                      className={`p-1 ${user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                      title={user.is_active ? 'Deactivate User' : 'Activate User'}
                      disabled={user.user_id === currentUser?.user_id}
                    >
                      {user.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {user.user_id !== currentUser?.user_id && (
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

        {users.length === 0 && !loading && (
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
            loadUsers()
            onUserChange()
          }}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          isOpen={showEditModal}
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false)
            setSelectedUser(null)
          }}
          onUserUpdated={() => {
            loadUsers()
            onUserChange()
          }}
        />
      )}
    </div>
  )
}

export default UserManagement