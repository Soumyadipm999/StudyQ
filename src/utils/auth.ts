import { User, LoginCredentials, PasswordChangeData } from '../types';

import { notificationService } from '../services/notificationService';

// Simulated database - in production, this would be replaced with actual API calls
const STORAGE_KEYS = {
  USERS: 'study_platform_users',
  MATERIALS: 'study_platform_materials',
  AUDIT_LOGS: 'study_platform_audit_logs',
  DELIVERY_LOGS: 'study_platform_delivery_logs',
  CURRENT_USER: 'study_platform_current_user',
  AUTH_TOKEN: 'study_platform_auth_token'
};

// Initialize default admin user if not exists
export const initializeDefaultUsers = () => {
  const users = getStoredUsers();
  if (users.length === 0) {
    const defaultAdmin: User = {
      id: 'admin-001',
      username: 'admin',
      email: 'admin@studyplatform.edu',
      role: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
      isActive: true,
      createdAt: new Date().toISOString(),
      mustChangePassword: false,
      failedLoginAttempts: 0
    };
    saveUser(defaultAdmin);
    
    // Add some sample users for demo
    const sampleTeacher: User = {
      id: 'teacher-001',
      username: 'prof.smith',
      email: 'smith@studyplatform.edu',
      role: 'teacher',
      firstName: 'John',
      lastName: 'Smith',
      isActive: true,
      createdAt: new Date().toISOString(),
      mustChangePassword: false,
      failedLoginAttempts: 0
    };
    saveUser(sampleTeacher);

    const sampleStudent: User = {
      id: 'student-001',
      username: 'john.doe',
      email: 'john.doe@student.edu',
      role: 'student',
      firstName: 'John',
      lastName: 'Doe',
      isActive: true,
      createdAt: new Date().toISOString(),
      mustChangePassword: false,
      failedLoginAttempts: 0,
      academicYear: 2024,
      currentSemester: 3,
      whatsappNumber: '+1234567890'
    };
    saveUser(sampleStudent);

    // Add another student for testing
    const sampleStudent2: User = {
      id: 'student-002',
      username: 'jane.smith',
      email: 'jane.smith@student.edu',
      role: 'student',
      firstName: 'Jane',
      lastName: 'Smith',
      isActive: true,
      createdAt: new Date().toISOString(),
      mustChangePassword: false,
      failedLoginAttempts: 0,
      academicYear: 2024,
      currentSemester: 5,
      whatsappNumber: '+1234567891'
    };
    saveUser(sampleStudent2);
  }
};

export const getStoredUsers = (): User[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.USERS);
  return stored ? JSON.parse(stored) : [];
};

export const saveUser = (user: User): void => {
  const users = getStoredUsers();
  const existingIndex = users.findIndex(u => u.id === user.id);
  
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const hashPassword = (password: string): string => {
  // In production, use bcrypt or similar
  // This is a simple hash for demo purposes
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
};

export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return { isValid: errors.length === 0, errors };
};

export const authenticateUser = (credentials: LoginCredentials): { success: boolean; user?: User; error?: string; token?: string } => {
  const users = getStoredUsers();
  const user = users.find(u => u.username === credentials.username);
  
  if (!user) {
    return { success: false, error: 'Invalid username or password' };
  }
  
  if (!user.isActive) {
    return { success: false, error: 'Account is inactive. Please contact administrator.' };
  }
  
  // Check if account is locked
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    return { success: false, error: 'Account is temporarily locked due to too many failed attempts' };
  }
  
  // Check password - use stored password or default for demo users
  let expectedPassword = '';
  
  // For demo users, use default passwords
  if (user.username === 'admin') {
    expectedPassword = 'admin123';
  } else if (user.username === 'prof.smith') {
    expectedPassword = 'teacher123';
  } else if (user.username === 'john.doe' || user.username === 'jane.smith') {
    expectedPassword = 'student123';
  } else {
    // For dynamically created users, use the stored temporary password
    // In a real system, this would be properly hashed and stored
    expectedPassword = user.tempPassword || 'temp123';
  }
  
  const hashedPassword = hashPassword(credentials.password);
  const storedPassword = hashPassword(expectedPassword);
  
  if (hashedPassword !== storedPassword) {
    // Increment failed attempts
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    
    if (user.failedLoginAttempts >= 5) {
      user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // Lock for 15 minutes
    }
    
    saveUser(user);
    return { success: false, error: 'Invalid username or password' };
  }
  
  // Reset failed attempts on successful login
  user.failedLoginAttempts = 0;
  user.lockedUntil = undefined;
  user.lastLogin = new Date().toISOString();
  saveUser(user);
  
  // Generate simple JWT-like token for demo
  const token = btoa(JSON.stringify({ userId: user.id, timestamp: Date.now() }));
  
  return { success: true, user, token };
};

export const sendLoginCredentials = (user: User, password: string): Promise<{ success: boolean; message: string }> => {
  return notificationService.sendLoginCredentials(user, password).then(result => ({
    success: result.success,
    message: result.message
  }));
};
export const changePassword = (userId: string, passwordData: PasswordChangeData): { success: boolean; error?: string } => {
  const users = getStoredUsers();
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return { success: false, error: 'User not found' };
  }
  
  if (passwordData.newPassword !== passwordData.confirmPassword) {
    return { success: false, error: 'New passwords do not match' };
  }
  
  const validation = validatePasswordStrength(passwordData.newPassword);
  if (!validation.isValid) {
    return { success: false, error: validation.errors.join(', ') };
  }
  
  // In production, verify current password
  user.mustChangePassword = false;
  saveUser(user);
  
  return { success: true };
};

export const generateUserId = (role: string): string => {
  const prefix = role === 'teacher' ? 'TCH' : 'STD';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

export const generateTemporaryPassword = (): string => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export const logout = (): void => {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return stored ? JSON.parse(stored) : null;
};

export const setCurrentUser = (user: User, token: string): void => {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
};