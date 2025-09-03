// Database schema types matching the SQL structure
export interface DatabaseUser {
  user_id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  password_hash: string;
  whatsapp_number?: string;
  academic_year?: number;
  current_semester?: number;
  is_active: boolean;
  force_password_change: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseMaterial {
  material_id: number;
  title: string;
  subject: string;
  semester: number;
  academic_year: number;
  file_url: string;
  file_size?: number;
  file_type?: string;
  uploaded_by: string;
  tags?: string;
  description?: string;
  created_at: string;
}

export interface MaterialAccess {
  access_id: number;
  user_id: string;
  material_id: number;
  assigned_by: string;
  assigned_at: string;
}

export interface DeliveryLog {
  log_id: number;
  user_id: string;
  material_id: number;
  delivery_channel: 'email' | 'whatsapp' | 'both';
  recipient_email?: string;
  recipient_whatsapp?: string;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
  delivered_at: string;
}

export interface AuditTrail {
  audit_id: number;
  user_id?: string;
  action: string;
  target_type?: string;
  target_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// API Request/Response types
export interface LoginRequest {
  user_id: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refresh_token: string;
  user_info: DatabaseUser;
  force_password_change: boolean;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  token: string;
  refresh_token: string;
}