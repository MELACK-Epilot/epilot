/**
 * Types TypeScript pour Supabase - E-Pilot Congo
 * Générés automatiquement
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          phone: string | null
          role: 'super_admin' | 'admin_groupe' | 'proviseur' | 'directeur' | 'directeur_etudes' | 'secretaire' | 'comptable' | 'enseignant' | 'cpe' | 'surveillant' | 'bibliothecaire' | 'gestionnaire_cantine' | 'conseiller_orientation' | 'infirmier' | 'eleve' | 'parent' | 'autre'
          school_group_id: string | null
          school_id: string | null
          status: 'active' | 'inactive' | 'suspended'
          avatar: string | null
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name: string
          last_name: string
          phone?: string | null
          role: 'super_admin' | 'admin_groupe' | 'proviseur' | 'directeur' | 'directeur_etudes' | 'secretaire' | 'comptable' | 'enseignant' | 'cpe' | 'surveillant' | 'bibliothecaire' | 'gestionnaire_cantine' | 'conseiller_orientation' | 'infirmier' | 'eleve' | 'parent' | 'autre'
          school_group_id?: string | null
          school_id?: string | null
          status?: 'active' | 'inactive' | 'suspended'
          avatar?: string | null
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          phone?: string | null
          role?: 'super_admin' | 'admin_groupe' | 'admin_ecole'
          school_group_id?: string | null
          school_id?: string | null
          status?: 'active' | 'inactive' | 'suspended'
          avatar?: string | null
          last_login?: string | null
          created_at?: string
          updated_at?: string
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
          website: string | null
          founded_year: number | null
          description: string | null
          logo: string | null
          school_count: number
          student_count: number
          staff_count: number
          plan: 'gratuit' | 'premium' | 'pro' | 'institutionnel'
          status: 'active' | 'inactive' | 'suspended'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          region: string
          city: string
          address?: string | null
          phone?: string | null
          website?: string | null
          founded_year?: number | null
          description?: string | null
          logo?: string | null
          school_count?: number
          student_count?: number
          staff_count?: number
          plan: 'gratuit' | 'premium' | 'pro' | 'institutionnel'
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          region?: string
          city?: string
          address?: string | null
          phone?: string | null
          website?: string | null
          founded_year?: number | null
          description?: string | null
          logo?: string | null
          school_count?: number
          student_count?: number
          staff_count?: number
          plan?: 'gratuit' | 'premium' | 'pro' | 'institutionnel'
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
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
          principal_name: string | null
          student_count: number
          staff_count: number
          status: 'active' | 'inactive' | 'suspended'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          school_group_id: string
          address?: string | null
          phone?: string | null
          email?: string | null
          principal_name?: string | null
          student_count?: number
          staff_count?: number
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          school_group_id?: string
          address?: string | null
          phone?: string | null
          email?: string | null
          principal_name?: string | null
          student_count?: number
          staff_count?: number
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          id: string
          name: string
          code: 'gratuit' | 'premium' | 'pro' | 'institutionnel'
          description: string | null
          price: number
          max_schools: number
          max_students: number
          features: Json
          status: 'active' | 'inactive' | 'suspended'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: 'gratuit' | 'premium' | 'pro' | 'institutionnel'
          description?: string | null
          price: number
          max_schools: number
          max_students: number
          features?: Json
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: 'gratuit' | 'premium' | 'pro' | 'institutionnel'
          description?: string | null
          price?: number
          max_schools?: number
          max_students?: number
          features?: Json
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          school_group_id: string
          plan_id: string
          start_date: string
          end_date: string | null
          status: 'active' | 'expired' | 'cancelled' | 'pending'
          auto_renew: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_group_id: string
          plan_id: string
          start_date: string
          end_date?: string | null
          status?: 'active' | 'expired' | 'cancelled' | 'pending'
          auto_renew?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_group_id?: string
          plan_id?: string
          start_date?: string
          end_date?: string | null
          status?: 'active' | 'expired' | 'cancelled' | 'pending'
          auto_renew?: boolean
          created_at?: string
          updated_at?: string
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
          status: 'active' | 'inactive' | 'suspended'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          description?: string | null
          icon?: string | null
          color?: string | null
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          description?: string | null
          icon?: string | null
          color?: string | null
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      modules: {
        Row: {
          id: string
          name: string
          code: string
          category_id: string
          description: string | null
          icon: string | null
          route: string | null
          status: 'active' | 'inactive' | 'suspended'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          category_id: string
          description?: string | null
          icon?: string | null
          route?: string | null
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          category_id?: string
          description?: string | null
          icon?: string | null
          route?: string | null
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      inscriptions: {
        Row: {
          id: string
          school_id: string
          academic_year: string
          inscription_number: string
          student_first_name: string
          student_last_name: string
          student_date_of_birth: string
          student_place_of_birth: string | null
          student_gender: 'M' | 'F'
          student_photo: string | null
          requested_class_id: string | null
          requested_level: string
          serie: string | null
          type_inscription: 'nouvelle' | 'reinscription' | 'transfert' | null
          filiere: string | null
          option_specialite: string | null
          ancienne_ecole: string | null
          student_phone: string | null
          student_email: string | null
          student_nationality: string | null
          student_postnom: string | null
          montant_paye: number | null
          mode_paiement: string | null
          a_aide_sociale: boolean
          est_pensionnaire: boolean
          a_bourse: boolean
          frais_inscription: number
          frais_scolarite: number
          frais_cantine: number | null
          frais_transport: number | null
          parent1_first_name: string
          parent1_last_name: string
          parent1_phone: string
          parent1_email: string | null
          parent1_profession: string | null
          parent2_first_name: string | null
          parent2_last_name: string | null
          parent2_phone: string | null
          parent2_email: string | null
          parent2_profession: string | null
          address: string | null
          city: string | null
          region: string | null
          est_redoublant: boolean
          est_affecte: boolean
          numero_affectation: string | null
          etablissement_origine: string | null
          documents: Json
          status: 'pending' | 'validated' | 'rejected' | 'enrolled'
          validated_at: string | null
          validated_by: string | null
          rejection_reason: string | null
          assigned_class_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          academic_year: string
          inscription_number?: string
          student_first_name: string
          student_last_name: string
          student_date_of_birth: string
          student_place_of_birth?: string | null
          student_gender: 'M' | 'F'
          student_photo?: string | null
          requested_class_id?: string | null
          requested_level: string
          serie?: string | null
          type_inscription?: 'nouvelle' | 'reinscription' | 'transfert' | null
          parent1_first_name: string
          parent1_last_name: string
          parent1_phone: string
          parent1_email?: string | null
          parent1_profession?: string | null
          parent2_first_name?: string | null
          parent2_last_name?: string | null
          parent2_phone?: string | null
          parent2_email?: string | null
          parent2_profession?: string | null
          address?: string | null
          city?: string | null
          region?: string | null
          est_redoublant?: boolean
          est_affecte?: boolean
          numero_affectation?: string | null
          etablissement_origine?: string | null
          documents?: Json
          status?: 'pending' | 'validated' | 'rejected' | 'enrolled'
          validated_at?: string | null
          validated_by?: string | null
          rejection_reason?: string | null
          assigned_class_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          academic_year?: string
          inscription_number?: string
          student_first_name?: string
          student_last_name?: string
          student_date_of_birth?: string
          student_place_of_birth?: string | null
          student_gender?: 'M' | 'F'
          student_photo?: string | null
          requested_class_id?: string | null
          requested_level?: string
          serie?: string | null
          type_inscription?: 'nouvelle' | 'reinscription' | 'transfert' | null
          parent1_first_name?: string
          parent1_last_name?: string
          parent1_phone?: string
          parent1_email?: string | null
          parent1_profession?: string | null
          parent2_first_name?: string | null
          parent2_last_name?: string | null
          parent2_phone?: string | null
          parent2_email?: string | null
          parent2_profession?: string | null
          address?: string | null
          city?: string | null
          region?: string | null
          est_redoublant?: boolean
          est_affecte?: boolean
          numero_affectation?: string | null
          etablissement_origine?: string | null
          documents?: Json
          status?: 'pending' | 'validated' | 'rejected' | 'enrolled'
          validated_at?: string | null
          validated_by?: string | null
          rejection_reason?: string | null
          assigned_class_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          entity_type: string | null
          entity_id: string | null
          details: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          entity_type?: string | null
          entity_id?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          read?: boolean
          created_at?: string
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
      user_role: 'super_admin' | 'admin_groupe' | 'admin_ecole'
      subscription_plan: 'gratuit' | 'premium' | 'pro' | 'institutionnel'
      status: 'active' | 'inactive' | 'suspended'
      subscription_status: 'active' | 'expired' | 'cancelled' | 'pending'
    }
  }
}
