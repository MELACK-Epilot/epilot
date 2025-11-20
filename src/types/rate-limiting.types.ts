/**
 * Types TypeScript pour le système de Rate Limiting
 * Générés manuellement basés sur les tables Supabase
 */

export interface RateLimitCounter {
  id: string;
  key: string;
  count: number;
  reset_at: string;
  created_at: string;
  updated_at: string;
}

export interface RateLimitViolation {
  id: string;
  user_id: string | null;
  action: string;
  ip_address: string | null;
  user_agent: string | null;
  limit_exceeded: number;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface RateLimitConfig {
  id: string;
  action: string;
  max_requests: number;
  window_seconds: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  reset_at: number | null;
  limit: number;
  window_seconds: number;
}

export type RateLimitAction =
  | 'auth:login'
  | 'auth:reset_password'
  | 'auth:register'
  | 'create:school_group'
  | 'create:school'
  | 'create:user'
  | 'read:api'
  | 'read:export'
  | 'update:data'
  | 'delete:data'
  | 'bulk:action';
