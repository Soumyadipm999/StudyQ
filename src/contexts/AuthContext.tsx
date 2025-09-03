import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, AuthState, LoginCredentials, PasswordChangeData } from '../types';
import { 
  authenticateUser, 
  getCurrentUser, 
  setCurrentUser, 
  logout as authLogout,
  changePassword,
  initializeDefaultUsers 
} from '../utils/auth';
import { logAuditEvent } from '../utils/audit';
import { initializeSampleMaterials } from '../utils/materials';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updatePassword: (passwordData: PasswordChangeData) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload
      };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Initialize default data
    initializeDefaultUsers();
    initializeSampleMaterials();

    // Check for existing authentication
    const user = getCurrentUser();
    const token = localStorage.getItem('study_platform_auth_token');

    if (user && token) {
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    dispatch({ type: 'SET_LOADING', payload: true });

    const result = authenticateUser(credentials);

    if (result.success && result.user && result.token) {
      setCurrentUser(result.user, result.token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: result.user, token: result.token } });

      // Log successful login
      logAuditEvent(
        result.user.id,
        `${result.user.firstName} ${result.user.lastName}`,
        'LOGIN',
        'User logged in successfully',
        '127.0.0.1', // In production, get real IP
        navigator.userAgent
      );

      return { success: true };
    } else {
      dispatch({ type: 'LOGIN_FAILURE' });

      // Log failed login attempt
      logAuditEvent(
        'anonymous',
        credentials.username,
        'LOGIN_FAILED',
        `Failed login attempt for username: ${credentials.username}`,
        '127.0.0.1',
        navigator.userAgent
      );

      return { success: false, error: result.error };
    }
  };

  const logout = () => {
    if (state.user) {
      logAuditEvent(
        state.user.id,
        `${state.user.firstName} ${state.user.lastName}`,
        'LOGOUT',
        'User logged out',
        '127.0.0.1',
        navigator.userAgent
      );
    }

    authLogout();
    dispatch({ type: 'LOGOUT' });
  };

  const updatePassword = async (passwordData: PasswordChangeData): Promise<{ success: boolean; error?: string }> => {
    if (!state.user) {
      return { success: false, error: 'User not authenticated' };
    }

    const result = changePassword(state.user.id, passwordData);

    if (result.success) {
      logAuditEvent(
        state.user.id,
        `${state.user.firstName} ${state.user.lastName}`,
        'PASSWORD_CHANGE',
        'Password changed successfully',
        '127.0.0.1',
        navigator.userAgent
      );

      const updatedUser = { ...state.user, mustChangePassword: false };
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
      setCurrentUser(updatedUser, state.token!);
    }

    return result;
  };

  const refreshUser = () => {
    const user = getCurrentUser();
    if (user && state.token) {
      dispatch({ type: 'UPDATE_USER', payload: user });
    }
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    updatePassword,
    refreshUser
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};