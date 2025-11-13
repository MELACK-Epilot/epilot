/**
 * Types pour la base de données Supabase
 * Inclut la table profiles (Supabase best practice)
 */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          name: string;
          avatar_url: string | null;
          role: 'SUPER_ADMIN' | 'admin_groupe' | 'admin_ecole';
          is_active: boolean;
          phone: string | null;
          address: string | null;
          birth_date: string | null;
          school_group_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          name: string;
          avatar_url?: string | null;
          role: 'SUPER_ADMIN' | 'admin_groupe' | 'admin_ecole';
          is_active?: boolean;
          phone?: string | null;
          address?: string | null;
          birth_date?: string | null;
          school_group_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          name?: string;
          avatar_url?: string | null;
          role?: 'SUPER_ADMIN' | 'admin_groupe' | 'admin_ecole';
          is_active?: boolean;
          phone?: string | null;
          address?: string | null;
          birth_date?: string | null;
          school_group_id?: string | null;
          updated_at?: string;
        };
      };
      school_groups: {
        Row: {
          id: string;
          name: string;
          code: string;
          logo: string | null;
          region: string;
          city: string;
          address: string | null;
          phone: string | null;
          website: string | null;
          founded_year: number | null;
          description: string | null;
          school_count: number;
          student_count: number;
          staff_count: number;
          plan: string;
          status: 'active' | 'inactive' | 'suspended';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          logo?: string | null;
          region: string;
          city: string;
          address?: string | null;
          phone?: string | null;
          website?: string | null;
          founded_year?: number | null;
          description?: string | null;
          school_count?: number;
          student_count?: number;
          staff_count?: number;
          plan?: string;
          status?: 'active' | 'inactive' | 'suspended';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          code?: string;
          logo?: string | null;
          region?: string;
          city?: string;
          address?: string | null;
          phone?: string | null;
          website?: string | null;
          founded_year?: number | null;
          description?: string | null;
          school_count?: number;
          student_count?: number;
          staff_count?: number;
          plan?: string;
          status?: 'active' | 'inactive' | 'suspended';
          updated_at?: string;
        };
      };
      schools: {
        Row: {
          id: string;
          name: string;
          code: string;
          school_group_id: string;
          admin_id: string | null;
          student_count: number;
          staff_count: number;
          address: string | null;
          phone: string | null;
          email: string | null;
          status: 'active' | 'inactive' | 'suspended';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          school_group_id: string;
          admin_id?: string | null;
          student_count?: number;
          staff_count?: number;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          status?: 'active' | 'inactive' | 'suspended';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          code?: string;
          school_group_id?: string;
          admin_id?: string | null;
          student_count?: number;
          staff_count?: number;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          status?: 'active' | 'inactive' | 'suspended';
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
