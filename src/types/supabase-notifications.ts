/**
 * Types Supabase pour la table notifications
 */

export interface Database {
  public: {
    Tables: {
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: 'info' | 'success' | 'warning' | 'error';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          category: 'system' | 'message' | 'grade' | 'payment' | 'schedule';
          action_url: string | null;
          is_read: boolean;
          read_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: 'info' | 'success' | 'warning' | 'error';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          category: 'system' | 'message' | 'grade' | 'payment' | 'schedule';
          action_url?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: 'info' | 'success' | 'warning' | 'error';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          category?: 'system' | 'message' | 'grade' | 'payment' | 'schedule';
          action_url?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
