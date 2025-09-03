import { 
  LoginRequest, 
  LoginResponse, 
  ChangePasswordRequest, 
  ApiResponse, 
  RefreshTokenRequest,
  RefreshTokenResponse,
  DatabaseUser,
  DatabaseMaterial,
  MaterialAccess,
  DeliveryLog,
  AuditTrail
} from '../types/database';

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  private token: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token && !endpoint.includes('/auth/login')) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401 && this.refreshToken && !endpoint.includes('/auth/refresh')) {
        // Token expired, try to refresh
        const refreshResult = await this.refreshAuthToken();
        if (refreshResult.success) {
          // Retry original request with new token
          headers['Authorization'] = `Bearer ${this.token}`;
          const retryResponse = await fetch(url, { ...options, headers });
          return retryResponse.json();
        }
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        message: 'Network error occurred',
      };
    }
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      this.token = response.data.token;
      this.refreshToken = response.data.refresh_token;
      localStorage.setItem('auth_token', this.token);
      localStorage.setItem('refresh_token', this.refreshToken);
    }

    return response;
  }

  async changePassword(passwordData: ChangePasswordRequest): Promise<ApiResponse> {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    });

    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');

    return response;
  }

  async refreshAuthToken(): Promise<ApiResponse<RefreshTokenResponse>> {
    if (!this.refreshToken) {
      return { success: false, message: 'No refresh token available' };
    }

    const response = await this.request<RefreshTokenResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: this.refreshToken }),
    });

    if (response.success && response.data) {
      this.token = response.data.token;
      this.refreshToken = response.data.refresh_token;
      localStorage.setItem('auth_token', this.token);
      localStorage.setItem('refresh_token', this.refreshToken);
    }

    return response;
  }

  // User management endpoints
  async getUsers(): Promise<ApiResponse<DatabaseUser[]>> {
    return this.request('/users');
  }

  async createUser(userData: Partial<DatabaseUser>): Promise<ApiResponse<DatabaseUser>> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: string, userData: Partial<DatabaseUser>): Promise<ApiResponse<DatabaseUser>> {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: string): Promise<ApiResponse> {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async resetUserPassword(userId: string): Promise<ApiResponse<{ temporary_password: string }>> {
    return this.request(`/users/${userId}/reset-password`, {
      method: 'POST',
    });
  }

  // Materials management endpoints
  async getMaterials(filters?: {
    semester?: number;
    subject?: string;
    academic_year?: number;
  }): Promise<ApiResponse<DatabaseMaterial[]>> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/materials${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.request(endpoint);
  }

  async uploadMaterial(materialData: FormData): Promise<ApiResponse<DatabaseMaterial>> {
    return this.request('/materials', {
      method: 'POST',
      body: materialData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  async updateMaterial(materialId: number, materialData: Partial<DatabaseMaterial>): Promise<ApiResponse<DatabaseMaterial>> {
    return this.request(`/materials/${materialId}`, {
      method: 'PUT',
      body: JSON.stringify(materialData),
    });
  }

  async deleteMaterial(materialId: number): Promise<ApiResponse> {
    return this.request(`/materials/${materialId}`, {
      method: 'DELETE',
    });
  }

  // Material access management
  async assignMaterial(userId: string, materialId: number): Promise<ApiResponse<MaterialAccess>> {
    return this.request('/material-access', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, material_id: materialId }),
    });
  }

  async revokeMaterialAccess(accessId: number): Promise<ApiResponse> {
    return this.request(`/material-access/${accessId}`, {
      method: 'DELETE',
    });
  }

  async getUserMaterials(userId: string): Promise<ApiResponse<DatabaseMaterial[]>> {
    return this.request(`/users/${userId}/materials`);
  }

  // Delivery endpoints
  async deliverMaterial(
    userId: string, 
    materialId: number, 
    channel: 'email' | 'whatsapp' | 'both'
  ): Promise<ApiResponse<DeliveryLog>> {
    return this.request('/delivery/send', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        material_id: materialId,
        delivery_channel: channel,
      }),
    });
  }

  async getDeliveryLogs(filters?: {
    user_id?: string;
    material_id?: number;
    status?: 'pending' | 'sent' | 'failed';
  }): Promise<ApiResponse<DeliveryLog[]>> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/delivery/logs${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.request(endpoint);
  }

  // Audit trail endpoints
  async getAuditTrail(filters?: {
    user_id?: string;
    action?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<AuditTrail[]>> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/audit${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.request(endpoint);
  }

  // Analytics endpoints
  async getSystemStats(): Promise<ApiResponse<{
    total_users: number;
    active_users: number;
    total_materials: number;
    total_deliveries: number;
    recent_activities: AuditTrail[];
  }>> {
    return this.request('/analytics/stats');
  }

  async getUserAnalytics(userId: string): Promise<ApiResponse<{
    materials_accessed: number;
    last_login: string;
    delivery_history: DeliveryLog[];
  }>> {
    return this.request(`/analytics/users/${userId}`);
  }
}

export const apiService = new ApiService();
export default apiService;