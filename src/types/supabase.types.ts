/**
 * Types TypeScript pour Supabase - E-Pilot Congo
 * Générés automatiquement via Supabase MCP
 * @generated
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      absences: {
        Row: {
          class_id: string
          comments: string | null
          created_at: string | null
          date: string
          id: string
          is_justified: boolean | null
          is_sandbox: boolean | null
          justification_document: string | null
          justification_type: string | null
          period: string | null
          recorded_by: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          class_id: string
          comments?: string | null
          created_at?: string | null
          date: string
          id?: string
          is_justified?: boolean | null
          is_sandbox?: boolean | null
          justification_document?: string | null
          justification_type?: string | null
          period?: string | null
          recorded_by?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          class_id?: string
          comments?: string | null
          created_at?: string | null
          date?: string
          id?: string
          is_justified?: boolean | null
          is_sandbox?: boolean | null
          justification_document?: string | null
          justification_type?: string | null
          period?: string | null
          recorded_by?: string | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      access_profiles: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name_en: string | null
          name_fr: string
          permissions: Json
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_en?: string | null
          name_fr: string
          permissions: Json
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_en?: string | null
          name_fr?: string
          permissions?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          phone: string | null
          role: Database['public']['Enums']['user_role']
          school_group_id: string | null
          school_id: string | null
          status: Database['public']['Enums']['user_status']
          avatar: string | null
          access_profile_code: string | null
          last_login: string | null
          created_at: string | null
          updated_at: string | null
          date_of_birth: string | null
          gender: Database['public']['Enums']['user_gender'] | null
          is_sandbox: boolean | null
        }
        Insert: {
          id?: string
          email: string
          first_name: string
          last_name: string
          phone?: string | null
          role?: Database['public']['Enums']['user_role']
          school_group_id?: string | null
          school_id?: string | null
          status?: Database['public']['Enums']['user_status']
          avatar?: string | null
          access_profile_code?: string | null
          last_login?: string | null
          created_at?: string | null
          updated_at?: string | null
          date_of_birth?: string | null
          gender?: Database['public']['Enums']['user_gender'] | null
          is_sandbox?: boolean | null
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          phone?: string | null
          role?: Database['public']['Enums']['user_role']
          school_group_id?: string | null
          school_id?: string | null
          status?: Database['public']['Enums']['user_status']
          avatar?: string | null
          access_profile_code?: string | null
          last_login?: string | null
          created_at?: string | null
          updated_at?: string | null
          date_of_birth?: string | null
          gender?: Database['public']['Enums']['user_gender'] | null
          is_sandbox?: boolean | null
        }
        Relationships: []
      }
      school_groups: {
        Row: {
          id: string
          name: string
          code: string
          region: string
          city: string
          address: string | null
          phone: string | null
          email: string | null
          website: string | null
          logo: string | null
          description: string | null
          founded_year: number | null
          admin_id: string | null
          status: Database['public']['Enums']['status']
          is_sandbox: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          code: string
          region: string
          city: string
          address?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          logo?: string | null
          description?: string | null
          founded_year?: number | null
          admin_id?: string | null
          status?: Database['public']['Enums']['status']
          is_sandbox?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          code?: string
          region?: string
          city?: string
          address?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          logo?: string | null
          description?: string | null
          founded_year?: number | null
          admin_id?: string | null
          status?: Database['public']['Enums']['status']
          is_sandbox?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      schools: {
        Row: {
          id: string
          name: string
          code: string
          school_group_id: string
          address: string | null
          phone: string | null
          email: string | null
          logo: string | null
          status: Database['public']['Enums']['status']
          is_sandbox: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          code: string
          school_group_id: string
          address?: string | null
          phone?: string | null
          email?: string | null
          logo?: string | null
          status?: Database['public']['Enums']['status']
          is_sandbox?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          code?: string
          school_group_id?: string
          address?: string | null
          phone?: string | null
          email?: string | null
          logo?: string | null
          status?: Database['public']['Enums']['status']
          is_sandbox?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          school_group_id: string
          plan_id: string
          status: Database['public']['Enums']['subscription_status']
          start_date: string
          end_date: string | null
          auto_renew: boolean | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          school_group_id: string
          plan_id: string
          status?: Database['public']['Enums']['subscription_status']
          start_date: string
          end_date?: string | null
          auto_renew?: boolean | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          school_group_id?: string
          plan_id?: string
          status?: Database['public']['Enums']['subscription_status']
          start_date?: string
          end_date?: string | null
          auto_renew?: boolean | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          price_monthly: number
          price_yearly: number | null
          max_schools: number
          max_students: number
          max_staff: number
          max_storage: number | null
          features: Json | null
          is_active: boolean | null
          is_popular: boolean | null
          trial_days: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          price_monthly: number
          price_yearly?: number | null
          max_schools: number
          max_students: number
          max_staff: number
          max_storage?: number | null
          features?: Json | null
          is_active?: boolean | null
          is_popular?: boolean | null
          trial_days?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          price_monthly?: number
          price_yearly?: number | null
          max_schools?: number
          max_students?: number
          max_staff?: number
          max_storage?: number | null
          features?: Json | null
          is_active?: boolean | null
          is_popular?: boolean | null
          trial_days?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          subscription_id: string | null
          school_group_id: string
          amount: number
          currency: string
          payment_method: string | null
          status: string
          reference: string | null
          notes: string | null
          paid_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          subscription_id?: string | null
          school_group_id: string
          amount: number
          currency?: string
          payment_method?: string | null
          status?: string
          reference?: string | null
          notes?: string | null
          paid_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          subscription_id?: string | null
          school_group_id?: string
          amount?: number
          currency?: string
          payment_method?: string | null
          status?: string
          reference?: string | null
          notes?: string | null
          paid_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      modules: {
        Row: {
          id: string
          name: string
          code: string
          description: string | null
          category_id: string | null
          icon: string | null
          is_core: boolean | null
          is_active: boolean | null
          order_index: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          code: string
          description?: string | null
          category_id?: string | null
          icon?: string | null
          is_core?: boolean | null
          is_active?: boolean | null
          order_index?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          code?: string
          description?: string | null
          category_id?: string | null
          icon?: string | null
          is_core?: boolean | null
          is_active?: boolean | null
          order_index?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      business_categories: {
        Row: {
          id: string
          name: string
          code: string
          description: string | null
          icon: string | null
          color: string | null
          order_index: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          code: string
          description?: string | null
          icon?: string | null
          color?: string | null
          order_index?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          code?: string
          description?: string | null
          icon?: string | null
          color?: string | null
          order_index?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          id: string
          first_name: string
          last_name: string
          date_of_birth: string | null
          gender: Database['public']['Enums']['user_gender'] | null
          school_id: string
          class_id: string | null
          status: string | null
          is_sandbox: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          date_of_birth?: string | null
          gender?: Database['public']['Enums']['user_gender'] | null
          school_id: string
          class_id?: string | null
          status?: string | null
          is_sandbox?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          date_of_birth?: string | null
          gender?: Database['public']['Enums']['user_gender'] | null
          school_id?: string
          class_id?: string | null
          status?: string | null
          is_sandbox?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      classes: {
        Row: {
          id: string
          name: string
          code: string
          school_id: string
          level: string | null
          capacity: number | null
          main_teacher_id: string | null
          is_sandbox: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          code: string
          school_id: string
          level?: string | null
          capacity?: number | null
          main_teacher_id?: string | null
          is_sandbox?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          code?: string
          school_id?: string
          level?: string | null
          capacity?: number | null
          main_teacher_id?: string | null
          is_sandbox?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          recipient_id: string
          title: string
          message: string
          type: string | null
          is_read: boolean | null
          link: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          recipient_id: string
          title: string
          message: string
          type?: string | null
          is_read?: boolean | null
          link?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          recipient_id?: string
          title?: string
          message?: string
          type?: string | null
          is_read?: boolean | null
          link?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          name: string | null
          avatar_url: string | null
          role: string | null
          is_active: boolean | null
          phone: string | null
          address: string | null
          birth_date: string | null
          created_at: string | null
          updated_at: string | null
          school_group_id: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          name?: string | null
          avatar_url?: string | null
          role?: string | null
          is_active?: boolean | null
          phone?: string | null
          address?: string | null
          birth_date?: string | null
          created_at?: string | null
          updated_at?: string | null
          school_group_id?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          name?: string | null
          avatar_url?: string | null
          role?: string | null
          is_active?: boolean | null
          phone?: string | null
          address?: string | null
          birth_date?: string | null
          created_at?: string | null
          updated_at?: string | null
          school_group_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      message_status: 'draft' | 'sent' | 'delivered' | 'read' | 'archived' | 'deleted'
      message_type: 'direct' | 'group' | 'broadcast'
      status: 'active' | 'inactive' | 'suspended'
      subscription_plan: 'gratuit' | 'premium' | 'pro' | 'institutionnel'
      subscription_status: 'active' | 'expired' | 'cancelled' | 'pending'
      ticket_category: 'technique' | 'pedagogique' | 'financier' | 'administratif' | 'autre'
      ticket_priority: 'low' | 'medium' | 'high' | 'urgent'
      ticket_status: 'open' | 'in_progress' | 'resolved' | 'closed'
      user_gender: 'M' | 'F'
      user_role: 
        | 'super_admin'
        | 'admin_groupe'
        | 'proviseur'
        | 'directeur'
        | 'directeur_etudes'
        | 'secretaire'
        | 'bibliothecaire'
        | 'eleve'
        | 'parent'
        | 'gestionnaire_cantine'
        | 'autre'
        | 'comptable'
        | 'enseignant'
        | 'surveillant'
        | 'cpe'
        | 'conseiller_orientation'
        | 'infirmier'
        | 'student'
        | 'teacher'
      user_status: 'active' | 'inactive' | 'suspended'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ============================================
// HELPER TYPES
// ============================================

type DefaultSchema = Database['public']

/** Type helper pour extraire le Row d'une table */
export type Tables<T extends keyof DefaultSchema['Tables']> = 
  DefaultSchema['Tables'][T]['Row']

/** Type helper pour extraire l'Insert d'une table */
export type TablesInsert<T extends keyof DefaultSchema['Tables']> = 
  DefaultSchema['Tables'][T]['Insert']

/** Type helper pour extraire l'Update d'une table */
export type TablesUpdate<T extends keyof DefaultSchema['Tables']> = 
  DefaultSchema['Tables'][T]['Update']

/** Type helper pour les enums */
export type Enums<T extends keyof DefaultSchema['Enums']> = 
  DefaultSchema['Enums'][T]

// ============================================
// COMMONLY USED TYPES
// ============================================

/** Type User complet */
export type User = Tables<'users'>
export type UserInsert = TablesInsert<'users'>
export type UserUpdate = TablesUpdate<'users'>

/** Type AccessProfile complet */
export type AccessProfile = Tables<'access_profiles'>
export type AccessProfileInsert = TablesInsert<'access_profiles'>
export type AccessProfileUpdate = TablesUpdate<'access_profiles'>

/** Type SchoolGroup complet */
export type SchoolGroup = Tables<'school_groups'>
export type SchoolGroupInsert = TablesInsert<'school_groups'>
export type SchoolGroupUpdate = TablesUpdate<'school_groups'>

/** Type School complet */
export type School = Tables<'schools'>
export type SchoolInsert = TablesInsert<'schools'>
export type SchoolUpdate = TablesUpdate<'schools'>

/** Type Subscription complet */
export type Subscription = Tables<'subscriptions'>
export type SubscriptionInsert = TablesInsert<'subscriptions'>
export type SubscriptionUpdate = TablesUpdate<'subscriptions'>

/** Type SubscriptionPlan complet */
export type SubscriptionPlan = Tables<'subscription_plans'>

/** Type Payment complet */
export type Payment = Tables<'payments'>
export type PaymentInsert = TablesInsert<'payments'>
export type PaymentUpdate = TablesUpdate<'payments'>

/** Type Module complet */
export type Module = Tables<'modules'>

/** Type BusinessCategory complet */
export type BusinessCategory = Tables<'business_categories'>

/** Type Student complet */
export type Student = Tables<'students'>
export type StudentInsert = TablesInsert<'students'>
export type StudentUpdate = TablesUpdate<'students'>

/** Type Class complet */
export type Class = Tables<'classes'>

/** Type Notification complet */
export type Notification = Tables<'notifications'>

/** Enums exportés */
export type UserRole = Enums<'user_role'>
export type UserStatus = Enums<'user_status'>
export type UserGender = Enums<'user_gender'>
export type Status = Enums<'status'>
export type SubscriptionStatus = Enums<'subscription_status'>
export type SubscriptionPlanType = Enums<'subscription_plan'>
