/**
 * Service Rate Limiting côté serveur
 * Utilise la fonction Supabase check_rate_limit
 * @module RateLimiter
 */

import { supabase } from './supabase';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number | null;
  limit: number;
  windowSeconds: number;
}

export interface RateLimitOptions {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Vérifie le rate limit pour une action donnée
 */
export const checkRateLimit = async (
  action: string,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> => {
  try {
    // Construire la clé unique
    const key = options.userId 
      ? `user:${options.userId}:${action}`
      : `ip:${options.ipAddress}:${action}`;

    // Appeler la fonction Supabase
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_key: key,
      p_action: action,
      p_user_id: options.userId || null,
      p_ip_address: options.ipAddress || null,
      p_user_agent: options.userAgent || null,
    });

    if (error) {
      console.error('Rate limit check error:', error);
      // En cas d'erreur, autoriser par défaut (fail-open)
      return {
        allowed: true,
        remaining: 999,
        resetAt: null,
        limit: 999,
        windowSeconds: 60,
      };
    }

    return data as RateLimitResult;
  } catch (error) {
    console.error('Rate limit check exception:', error);
    // En cas d'erreur, autoriser par défaut (fail-open)
    return {
      allowed: true,
      remaining: 999,
      resetAt: null,
      limit: 999,
      windowSeconds: 60,
    };
  }
};

/**
 * Middleware pour vérifier le rate limit avant une action
 * Throw une erreur si la limite est dépassée
 */
export const enforceRateLimit = async (
  action: string,
  options: RateLimitOptions = {}
): Promise<void> => {
  const result = await checkRateLimit(action, options);

  if (!result.allowed) {
    const waitTime = result.resetAt 
      ? Math.ceil((result.resetAt - Date.now() / 1000) / 60)
      : 1;
    
    throw new Error(
      `Rate limit exceeded. Please wait ${waitTime} minute(s) before trying again.`
    );
  }
};

/**
 * Hook pour obtenir les informations de rate limit sans incrémenter
 */
export const getRateLimitInfo = async (
  action: string,
  userId?: string
): Promise<RateLimitResult | null> => {
  try {
    const { data, error } = await supabase
      .from('rate_limit_config')
      .select('*')
      .eq('action', action)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      allowed: true,
      remaining: data.max_requests,
      resetAt: null,
      limit: data.max_requests,
      windowSeconds: data.window_seconds,
    };
  } catch (error) {
    console.error('Get rate limit info error:', error);
    return null;
  }
};

/**
 * Récupère les violations d'un utilisateur
 */
export const getUserViolations = async (
  userId: string,
  hours: number = 24
): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc('get_user_violations_count', {
      p_user_id: userId,
      p_hours: hours,
    });

    if (error) {
      console.error('Get violations error:', error);
      return 0;
    }

    return data as number;
  } catch (error) {
    console.error('Get violations exception:', error);
    return 0;
  }
};

/**
 * Vérifie si un utilisateur doit être suspendu pour abus
 */
export const checkForAbuse = async (userId: string): Promise<boolean> => {
  const violations = await getUserViolations(userId, 24);
  
  // Si plus de 10 violations en 24h, considérer comme abus
  if (violations > 10) {
    console.warn(`User ${userId} has ${violations} violations in 24h - potential abuse`);
    return true;
  }
  
  return false;
};
