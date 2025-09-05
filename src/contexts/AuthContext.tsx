import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { authService, AuthUser, LoginCredentials } from '../services/authService'

interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: AuthUser; token: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: AuthUser }

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false
      }
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      }
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload
      }
    default:
      return state
  }
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    // Check for existing authentication
    const user = authService.getCurrentUser()
    const token = authService.getAuthToken()

    if (user && token) {
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } })
    } else {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    dispatch({ type: 'SET_LOADING', payload: true })

    const result = await authService.login(credentials)

    if (result.success && result.user && result.token) {
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: result.user, token: result.token } })
      return { success: true }
    } else {
      dispatch({ type: 'LOGIN_FAILURE' })
      return { success: false, error: result.error }
    }
  }

  const logout = async () => {
    await authService.logout()
    dispatch({ type: 'LOGOUT' })
  }

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!state.user) {
      return { success: false, error: 'User not authenticated' }
    }

    const result = await authService.changePassword(state.user.user_id, currentPassword, newPassword)

    if (result.success) {
      const updatedUser = { ...state.user, force_password_change: false }
      dispatch({ type: 'UPDATE_USER', payload: updatedUser })
    }

    return result
  }

  const refreshUser = () => {
    const user = authService.getCurrentUser()
    if (user && state.token) {
      dispatch({ type: 'UPDATE_USER', payload: user })
    }
  }

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    changePassword,
    refreshUser
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}