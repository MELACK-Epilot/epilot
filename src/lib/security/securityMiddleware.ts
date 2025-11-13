/**
 * Middleware de sécurité global
 * Protection contre XSS, CSRF, injection, etc.
 * @module securityMiddleware
 */

import helmet from 'helmet';
import { generalLimiter } from './rateLimiter';
import { auditMiddleware } from './auditTrail';

/**
 * Configuration Helmet pour sécurité headers HTTP
 */
export const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.NEXT_PUBLIC_SUPABASE_URL || ''],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  
  // Protection XSS
  xssFilter: true,
  
  // Empêcher le sniffing MIME
  noSniff: true,
  
  // Forcer HTTPS
  hsts: {
    maxAge: 31536000, // 1 an
    includeSubDomains: true,
    preload: true,
  },
  
  // Empêcher le clickjacking
  frameguard: {
    action: 'deny',
  },
  
  // Cacher les infos serveur
  hidePoweredBy: true,
});

/**
 * Sanitization des inputs
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, ''); // Remove event handlers
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

/**
 * Middleware sanitization
 */
export function sanitizeMiddleware() {
  return (req: any, res: any, next: any) => {
    if (req.body) {
      req.body = sanitizeInput(req.body);
    }
    if (req.query) {
      req.query = sanitizeInput(req.query);
    }
    if (req.params) {
      req.params = sanitizeInput(req.params);
    }
    next();
  };
}

/**
 * Protection CSRF
 */
export function csrfProtection() {
  return (req: any, res: any, next: any) => {
    // Vérifier le token CSRF pour les requêtes modifiant les données
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const csrfToken = req.headers['x-csrf-token'];
      const sessionToken = req.session?.csrfToken;
      
      if (!csrfToken || csrfToken !== sessionToken) {
        return res.status(403).json({
          error: 'CSRF token invalide',
          message: 'Requête non autorisée',
        });
      }
    }
    next();
  };
}

/**
 * Validation origine requête
 */
export function validateOrigin() {
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'http://localhost:5173',
  ].filter(Boolean);

  return (req: any, res: any, next: any) => {
    const origin = req.headers.origin;
    
    if (origin && !allowedOrigins.includes(origin)) {
      return res.status(403).json({
        error: 'Origine non autorisée',
        message: 'Cette requête provient d\'une origine non autorisée',
      });
    }
    
    next();
  };
}

/**
 * Protection injection SQL
 */
export function sqlInjectionProtection() {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(UNION\s+SELECT)/gi,
    /(--|\*\/|\/\*)/g,
    /(\bOR\b.*=.*)/gi,
    /(\bAND\b.*=.*)/gi,
  ];

  return (req: any, res: any, next: any) => {
    const checkValue = (value: any): boolean => {
      if (typeof value === 'string') {
        return sqlPatterns.some(pattern => pattern.test(value));
      }
      if (Array.isArray(value)) {
        return value.some(checkValue);
      }
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(checkValue);
      }
      return false;
    };

    const hasSqlInjection = 
      checkValue(req.body) ||
      checkValue(req.query) ||
      checkValue(req.params);

    if (hasSqlInjection) {
      return res.status(400).json({
        error: 'Requête invalide',
        message: 'La requête contient des caractères non autorisés',
      });
    }

    next();
  };
}

/**
 * Logging des requêtes suspectes
 */
export function suspiciousActivityLogger() {
  return (req: any, res: any, next: any) => {
    const suspicious = 
      req.headers['user-agent']?.includes('bot') ||
      req.path.includes('..') ||
      req.path.includes('admin') ||
      req.query.toString().length > 1000;

    if (suspicious) {
      console.warn('Suspicious activity detected:', {
        ip: req.ip,
        path: req.path,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
}

/**
 * Middleware de sécurité complet
 */
export function securityMiddleware() {
  return [
    helmetConfig,
    generalLimiter.middleware(),
    sanitizeMiddleware(),
    sqlInjectionProtection(),
    validateOrigin(),
    suspiciousActivityLogger(),
    auditMiddleware(),
  ];
}

/**
 * Configuration CORS sécurisée
 */
export const corsConfig = {
  origin: (origin: string, callback: any) => {
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL,
      'http://localhost:3000',
      'http://localhost:5173',
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400, // 24 heures
};

/**
 * Vérification permissions utilisateur
 */
export function requirePermission(permission: string) {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Non authentifié',
        message: 'Vous devez être connecté pour accéder à cette ressource',
      });
    }

    if (!req.user.permissions?.includes(permission)) {
      return res.status(403).json({
        error: 'Permission refusée',
        message: 'Vous n\'avez pas la permission d\'accéder à cette ressource',
      });
    }

    next();
  };
}

/**
 * Vérification rôle utilisateur
 */
export function requireRole(...roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Non authentifié',
        message: 'Vous devez être connecté pour accéder à cette ressource',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Accès refusé',
        message: 'Votre rôle ne permet pas d\'accéder à cette ressource',
      });
    }

    next();
  };
}

/**
 * Exemples d'utilisation
 * 
 * @example
 * // Dans Express app
 * import express from 'express';
 * import cors from 'cors';
 * import { securityMiddleware, corsConfig } from '@/lib/security/securityMiddleware';
 * 
 * const app = express();
 * 
 * // Appliquer CORS
 * app.use(cors(corsConfig));
 * 
 * // Appliquer tous les middlewares de sécurité
 * app.use(securityMiddleware());
 * 
 * @example
 * // Protection route spécifique
 * import { requireRole, requirePermission } from '@/lib/security/securityMiddleware';
 * 
 * app.get('/api/admin/users',
 *   requireRole('admin_group', 'super_admin'),
 *   getUsersHandler
 * );
 * 
 * app.post('/api/payments',
 *   requirePermission('create:payments'),
 *   createPaymentHandler
 * );
 */
