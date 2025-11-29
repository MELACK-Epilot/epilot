/**
 * Types pour le modal UserDetails
 * @module user-details/types
 */

import type { User } from '../../../types/dashboard.types';

export interface UserDetailsDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (user: User) => void;
  onRefresh?: () => void;
}

export interface UserModule {
  id: string;
  module_id: string;
  module_name: string;
  module_slug: string;
  module_icon: string | null;
  category_name: string;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
  can_export: boolean;
  assigned_by_profile: string | null;
}

export interface UserStats {
  totalLogins: number;
  lastLoginDays: number;
  modulesCount: number;
  activityScore: number;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string | null;
  created_at: string;
  user_id: string;
}

export type ConfirmDialogType = 'deactivate' | 'delete' | null;
