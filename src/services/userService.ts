import { db } from '../lib/supabase'
import { authService, CreateUserData, AuthUser } from './authService'

export interface UserFilters {
  role?: 'admin' | 'teacher' | 'student'
  is_active?: boolean
  search?: string
}

class UserService {
  async getAllUsers(filters?: UserFilters): Promise<AuthUser[]> {
    try {
      let users = await db.getAllUsers()

      // Apply filters
      if (filters?.role) {
        users = users.filter(user => user.role === filters.role)
      }

      if (filters?.is_active !== undefined) {
        users = users.filter(user => user.is_active === filters.is_active)
      }

      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase()
        users = users.filter(user => 
          user.name.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm) ||
          user.user_id.toLowerCase().includes(searchTerm)
        )
      }

      return users.map(user => ({
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        whatsapp_number: user.whatsapp_number,
        academic_year: user.academic_year,
        current_semester: user.current_semester,
        is_active: user.is_active,
        force_password_change: user.force_password_change,
        last_login: user.last_login,
        created_at: user.created_at
      }))
    } catch (error) {
      console.error('Error fetching users:', error)
      throw new Error('Failed to fetch users')
    }
  }

  async createUser(userData: {
    name: string
    email: string
    role: 'teacher' | 'student'
    whatsapp_number?: string
    academic_year?: number
    current_semester?: number
  }): Promise<{ success: boolean; user?: AuthUser; tempPassword?: string; error?: string }> {
    try {
      const userId = authService.generateUserId(userData.role)
      
      const createData: CreateUserData = {
        user_id: userId,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        password: '', // Will be generated in authService
        whatsapp_number: userData.whatsapp_number,
        academic_year: userData.academic_year,
        current_semester: userData.current_semester
      }

      return await authService.createUser(createData)
    } catch (error) {
      console.error('Error creating user:', error)
      return { success: false, error: 'Failed to create user' }
    }
  }

  async updateUser(userId: string, updates: {
    name?: string
    email?: string
    whatsapp_number?: string
    academic_year?: number
    current_semester?: number
    is_active?: boolean
  }): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      const updatedUser = await db.updateUser(userId, updates)
      
      const authUser: AuthUser = {
        user_id: updatedUser.user_id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        whatsapp_number: updatedUser.whatsapp_number,
        academic_year: updatedUser.academic_year,
        current_semester: updatedUser.current_semester,
        is_active: updatedUser.is_active,
        force_password_change: updatedUser.force_password_change,
        last_login: updatedUser.last_login,
        created_at: updatedUser.created_at
      }

      return { success: true, user: authUser }
    } catch (error: any) {
      console.error('Error updating user:', error)
      
      if (error.code === '23505' && error.message.includes('email')) {
        return { success: false, error: 'Email address already exists' }
      }
      
      return { success: false, error: 'Failed to update user' }
    }
  }

  async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await db.deleteUser(userId)
      return { success: true }
    } catch (error) {
      console.error('Error deleting user:', error)
      return { success: false, error: 'Failed to delete user' }
    }
  }

  async resetUserPassword(userId: string): Promise<{ success: boolean; tempPassword?: string; error?: string }> {
    return await authService.resetUserPassword(userId)
  }

  async toggleUserStatus(userId: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      const user = await db.getUserById(userId)
      if (!user) {
        return { success: false, error: 'User not found' }
      }

      return await this.updateUser(userId, { is_active: !user.is_active })
    } catch (error) {
      console.error('Error toggling user status:', error)
      return { success: false, error: 'Failed to toggle user status' }
    }
  }
}

export const userService = new UserService()
export default userService