export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  mustChangePassword: boolean;
  failedLoginAttempts: number;
  lockedUntil?: string;
  tempPassword?: string; // For storing temporary passwords in demo
  // Student-specific fields
  academicYear?: number;
  currentSemester?: number;
  whatsappNumber?: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadDate: string;
  semester: number;
  academicYear: number;
  subject: string;
  tags: string[];
  isActive: boolean;
  downloadCount: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface DeliveryLog {
  id: string;
  materialId: string;
  materialTitle: string;
  studentId: string;
  studentName: string;
  deliveryMethod: 'email' | 'whatsapp' | 'both';
  status: 'pending' | 'sent' | 'failed';
  timestamp: string;
  email?: string;
  whatsappNumber?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}