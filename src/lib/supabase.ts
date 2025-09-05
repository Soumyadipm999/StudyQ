import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database helper functions
export const db = {
  // Users operations
  async createUser(userData: any) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getUserById(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getUserByUsername(username: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('name', username)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async updateUser(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getAllUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async deleteUser(userId: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('user_id', userId)
    
    if (error) throw error
    return true
  },

  // Materials operations
  async createMaterial(materialData: any) {
    const { data, error } = await supabase
      .from('materials')
      .insert([materialData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getMaterials(filters?: any) {
    let query = supabase
      .from('materials')
      .select(`
        *,
        uploaded_by_user:users!materials_uploaded_by_fkey(name)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (filters?.semester) {
      query = query.eq('semester', filters.semester)
    }
    if (filters?.subject) {
      query = query.eq('subject', filters.subject)
    }
    if (filters?.academic_year) {
      query = query.eq('academic_year', filters.academic_year)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async getMaterialsByTeacher(teacherId: string) {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('uploaded_by', teacherId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async updateMaterial(materialId: number, updates: any) {
    const { data, error } = await supabase
      .from('materials')
      .update(updates)
      .eq('material_id', materialId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteMaterial(materialId: number) {
    const { error } = await supabase
      .from('materials')
      .update({ is_active: false })
      .eq('material_id', materialId)
    
    if (error) throw error
    return true
  },

  // Delivery logs
  async createDeliveryLog(logData: any) {
    const { data, error } = await supabase
      .from('delivery_logs')
      .insert([logData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getDeliveryLogs(filters?: any) {
    let query = supabase
      .from('delivery_logs')
      .select(`
        *,
        user:users!delivery_logs_user_id_fkey(name, email),
        material:materials!delivery_logs_material_id_fkey(title)
      `)
      .order('delivered_at', { ascending: false })

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  // Audit trail
  async createAuditLog(auditData: any) {
    const { data, error } = await supabase
      .from('audit_trail')
      .insert([auditData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getAuditLogs(filters?: any) {
    let query = supabase
      .from('audit_trail')
      .select(`
        *,
        user:users!audit_trail_user_id_fkey(name)
      `)
      .order('created_at', { ascending: false })
      .limit(1000)

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id)
    }
    if (filters?.action) {
      query = query.eq('action', filters.action)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }
}