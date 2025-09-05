import { supabase, db } from '../lib/supabase'
import bcrypt from 'bcryptjs'

export interface LoginCredentials {
  username: string
  password: string
}

export interface CreateUserData {
  user_id: string
  name: string
  email: string
  role: 'admin' | 'teacher' | 'student'
  password: string
  whatsapp_number?: string
  academic_year?: number
  current_semester?: number
}

export interface AuthUser {
  user_id: string
  name: string
  email: string
  role: 'admin' | 'teacher' | 'student'
  whatsapp_number?: string
  academic_year?: number
  current_semester?: number
  is_active: boolean
  force_password_change: boolean
  last_login?: string
  created_at: string
}

class AuthService {
  private currentUser: AuthUser | null = null
  private authToken: string | null = null

  constructor() {
    this.loadStoredAuth()
  }

  private loadStoredAuth() {
    try {
      const storedUser = localStorage.getItem('auth_user')
      const storedToken = localStorage.getItem('auth_token')
      
      if (storedUser && storedToken) {
        this.currentUser = JSON.parse(storedUser)
        this.authToken = storedToken
      }
    } catch (error) {
      console.error('Error loading stored auth:', error)
      this.clearAuth()
    }
  }

  private storeAuth(user: AuthUser, token: string) {
    this.currentUser = user
    this.authToken = token
    localStorage.setItem('auth_user', JSON.stringify(user))
    localStorage.setItem('auth_token', token)
  }

  private clearAuth() {
    this.currentUser = null
    this.authToken = null
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_token')
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash)
  }

  private generateToken(user: AuthUser): string {
    const payload = {
      user_id: user.user_id,
      role: user.role,
      iat: Date.now(),
      exp: Date.now() + (2 * 60 * 60 * 1000) // 2 hours
    }
    return btoa(JSON.stringify(payload))
  }

  async login(credentials: LoginCredentials): Promise<{
    success: boolean
    user?: AuthUser
    token?: string
    error?: string
  }> {
    try {
      // Get user by username (stored as 'name' in database)
      const user = await db.getUserByUsername(credentials.username)
      
      if (!user) {
        await this.logAuditEvent(null, 'LOGIN_FAILED', `Failed login attempt for username: ${credentials.username}`)
        return { success: false, error: 'Invalid username or password' }
      }

      if (!user.is_active) {
        return { success: false, error: 'Account is inactive. Please contact administrator.' }
      }

      // Check if account is locked
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        return { success: false, error: 'Account is temporarily locked due to too many failed attempts' }
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(credentials.password, user.password_hash)
      
      if (!isValidPassword) {
        // Increment failed attempts
        const failedAttempts = (user.failed_login_attempts || 0) + 1
        const updates: any = { failed_login_attempts: failedAttempts }
        
        if (failedAttempts >= 5) {
          updates.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString() // Lock for 15 minutes
        }
        
        await db.updateUser(user.user_id, updates)
        await this.logAuditEvent(user.user_id, 'LOGIN_FAILED', `Failed login attempt for user: ${user.name}`)
        
        return { success: false, error: 'Invalid username or password' }
      }

      // Reset failed attempts and update last login
      await db.updateUser(user.user_id, {
        failed_login_attempts: 0,
        locked_until: null,
        last_login: new Date().toISOString()
      })

      // Create auth user object
      const authUser: AuthUser = {
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
      }

      const token = this.generateToken(authUser)
      this.storeAuth(authUser, token)

      await this.logAuditEvent(user.user_id, 'LOGIN_SUCCESS', `User logged in successfully`)

      return { success: true, user: authUser, token }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Login failed due to system error' }
    }
  }

  async createUser(userData: CreateUserData): Promise<{
    success: boolean
    user?: AuthUser
    tempPassword?: string
    error?: string
  }> {
    try {
      // Generate temporary password
      const tempPassword = this.generateTempPassword()
      const hashedPassword = await this.hashPassword(tempPassword)

      const newUser = {
        user_id: userData.user_id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        password_hash: hashedPassword,
        whatsapp_number: userData.whatsapp_number,
        academic_year: userData.academic_year,
        current_semester: userData.current_semester,
        is_active: true,
        force_password_change: true,
        failed_login_attempts: 0
      }

      const createdUser = await db.createUser(newUser)

      const authUser: AuthUser = {
        user_id: createdUser.user_id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        whatsapp_number: createdUser.whatsapp_number,
        academic_year: createdUser.academic_year,
        current_semester: createdUser.current_semester,
        is_active: createdUser.is_active,
        force_password_change: createdUser.force_password_change,
        created_at: createdUser.created_at
      }

      await this.logAuditEvent(
        this.currentUser?.user_id || null,
        'USER_CREATE',
        `Created new ${userData.role}: ${userData.name}`
      )

      return { success: true, user: authUser, tempPassword }
    } catch (error: any) {
      console.error('Create user error:', error)
      
      if (error.code === '23505') { // Unique constraint violation
        if (error.message.includes('email')) {
          return { success: false, error: 'Email address already exists' }
        }
        if (error.message.includes('user_id')) {
          return { success: false, error: 'User ID already exists' }
        }
      }
      
      return { success: false, error: 'Failed to create user' }
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const user = await db.getUserById(userId)
      if (!user) {
        return { success: false, error: 'User not found' }
      }

      // Verify current password
      const isValidPassword = await this.verifyPassword(currentPassword, user.password_hash)
      if (!isValidPassword) {
        return { success: false, error: 'Current password is incorrect' }
      }

      // Hash new password
      const hashedNewPassword = await this.hashPassword(newPassword)

      // Update password
      await db.updateUser(userId, {
        password_hash: hashedNewPassword,
        force_password_change: false
      })

      await this.logAuditEvent(userId, 'PASSWORD_CHANGE', 'Password changed successfully')

      return { success: true }
    } catch (error) {
      console.error('Change password error:', error)
      return { success: false, error: 'Failed to change password' }
    }
  }

  async resetUserPassword(userId: string): Promise<{
    success: boolean
    tempPassword?: string
    error?: string
  }> {
    try {
      const tempPassword = this.generateTempPassword()
      const hashedPassword = await this.hashPassword(tempPassword)

      await db.updateUser(userId, {
        password_hash: hashedPassword,
        force_password_change: true,
        failed_login_attempts: 0,
        locked_until: null
      })

      await this.logAuditEvent(
        this.currentUser?.user_id || null,
        'PASSWORD_RESET',
        `Reset password for user: ${userId}`
      )

      return { success: true, tempPassword }
    } catch (error) {
      console.error('Reset password error:', error)
      return { success: false, error: 'Failed to reset password' }
    }
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  generateUserId(role: string): string {
    const prefix = role === 'admin' ? 'ADM' : role === 'teacher' ? 'TCH' : 'STD'
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.random().toString(36).substring(2, 5).toUpperCase()
    return `${prefix}-${timestamp}-${random}`
  }

  async logout(): Promise<void> {
    if (this.currentUser) {
      await this.logAuditEvent(this.currentUser.user_id, 'LOGOUT', 'User logged out')
    }
    this.clearAuth()
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser
  }

  getAuthToken(): string | null {
    return this.authToken
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null && this.authToken !== null
  }

  private async logAuditEvent(userId: string | null, action: string, details: string) {
    try {
      await db.createAuditLog({
        user_id: userId,
        action,
        details: JSON.stringify({ message: details }),
        ip_address: '127.0.0.1', // In production, get real IP
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to log audit event:', error)
    }
  }
}

export const authService = new AuthService()
export default authService