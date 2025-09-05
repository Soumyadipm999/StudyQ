import React, { useState } from 'react'
import { X, Loader2, Mail, Eye, EyeOff } from 'lucide-react'
import { userService } from '../../services/userService'
import { notificationService } from '../../services/notificationService'

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  onUserCreated: () => void
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onUserCreated }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student' as 'teacher' | 'student',
    whatsapp_number: '',
    academic_year: new Date().getFullYear(),
    current_semester: 1
  })
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    username: string
    password: string
  } | null>(null)

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'student',
      whatsapp_number: '',
      academic_year: new Date().getFullYear(),
      current_semester: 1
    })
    setGeneratedCredentials(null)
    setError('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'academic_year' || name === 'current_semester' ? parseInt(value) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        whatsapp_number: formData.whatsapp_number || undefined,
        ...(formData.role === 'student' && {
          academic_year: formData.academic_year,
          current_semester: formData.current_semester
        })
      }

      const result = await userService.createUser(userData)

      if (result.success && result.user && result.tempPassword) {
        setGeneratedCredentials({
          username: result.user.name,
          password: result.tempPassword
        })
        onUserCreated()
      } else {
        setError(result.error || 'Failed to create user')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      setError('Failed to create user. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendCredentials = async () => {
    if (generatedCredentials && formData.email) {
      try {
        const userForEmail = {
          firstName: formData.name.split(' ')[0],
          lastName: formData.name.split(' ').slice(1).join(' ') || '',
          email: formData.email,
          role: formData.role,
          username: generatedCredentials.username,
          ...(formData.role === 'student' && {
            academicYear: formData.academic_year,
            currentSemester: formData.current_semester
          })
        }
        
        const result = await notificationService.sendLoginCredentials(userForEmail as any, generatedCredentials.password)
        
        if (result.success) {
          alert(`${result.message}\n\nCheck the browser console to see the detailed email content.`)
          resetForm()
          onClose()
        } else {
          alert(`Failed to send email: ${result.message}\n\nPlease provide the credentials manually:\nUsername: ${generatedCredentials.username}\nPassword: ${generatedCredentials.password}`)
        }
      } catch (error) {
        console.error('Error sending credentials:', error)
        alert('Failed to send credentials email. Please provide them manually.')
      }
    }
  }

  if (!isOpen) return null

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
            <button onClick={() => { resetForm(); onClose() }} className="text-gray-400 hover:text-gray-600 transition-colors">
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
                  onClick={() => { resetForm(); onClose() }}
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
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="Enter full name"
                />
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
                  placeholder="Enter email address"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  name="whatsapp_number"
                  value={formData.whatsapp_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+1234567890"
                />
              </div>

              {formData.role === 'student' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Academic Year *
                    </label>
                    <select
                      name="academic_year"
                      value={formData.academic_year}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {[...Array(5)].map((_, i) => {
                        const year = new Date().getFullYear() - 2 + i
                        return <option key={year} value={year}>{year}</option>
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Semester *
                    </label>
                    <select
                      name="current_semester"
                      value={formData.current_semester}
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
                  onClick={() => { resetForm(); onClose() }}
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
  )
}

export default CreateUserModal