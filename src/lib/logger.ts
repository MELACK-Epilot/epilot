/**
 * Système de logging avancé pour le monitoring et le debugging
 * @module Logger
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  stack?: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  /**
   * Log debug (développement uniquement)
   */
  debug(message: string, context?: Record<string, any>): void {
    if (this.isDevelopment) {
      this.log('debug', message, context);
      console.debug(`🔍 ${message}`, context);
    }
  }

  /**
   * Log info
   */
  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
    console.info(`ℹ️ ${message}`, context);
  }

  /**
   * Log warning
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
    console.warn(`⚠️ ${message}`, context);
  }

  /**
   * Log error
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log('error', message, {
      ...context,
      error: error?.message,
      stack: error?.stack,
    });
    console.error(`❌ ${message}`, error, context);
  }

  /**
   * Enregistrer un log
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    this.logs.push(entry);

    // Limiter la taille du buffer
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * Obtenir tous les logs
   */
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter((log) => log.level === level);
    }
    return this.logs;
  }

  /**
   * Vider les logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Exporter les logs en JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Envoyer les logs au serveur (pour monitoring)
   */
  async sendLogsToServer(): Promise<void> {
    if (this.logs.length === 0) return;

    try {
      // TODO: Implémenter l'envoi au serveur de monitoring
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   body: JSON.stringify(this.logs),
      // });
      this.clearLogs();
    } catch (error) {
      console.error('Erreur lors de l\'envoi des logs:', error);
    }
  }
}

// Instance singleton
export const logger = new Logger();

/**
 * Helper pour logger les performances
 */
export function logPerformance(name: string, startTime: number): void {
  const duration = performance.now() - startTime;
  logger.debug(`Performance: ${name}`, { duration: `${duration.toFixed(2)}ms` });
}

/**
 * Decorator pour logger les appels de fonction
 */
export function logFunction(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const startTime = performance.now();
    logger.debug(`Appel de ${propertyKey}`, { args });

    try {
      const result = await originalMethod.apply(this, args);
      logPerformance(propertyKey, startTime);
      return result;
    } catch (error) {
      logger.error(`Erreur dans ${propertyKey}`, error as Error, { args });
      throw error;
    }
  };

  return descriptor;
}

/**
 * Logger les erreurs Supabase
 */
export function logSupabaseError(operation: string, error: any): void {
  logger.error(`Erreur Supabase: ${operation}`, error, {
    code: error?.code,
    message: error?.message,
    details: error?.details,
  });
}

/**
 * Logger les événements utilisateur
 */
export function logUserEvent(event: string, data?: Record<string, any>): void {
  logger.info(`Événement utilisateur: ${event}`, data);
}

/**
 * Logger les changements de route
 */
export function logNavigation(from: string, to: string): void {
  logger.debug(`Navigation: ${from} → ${to}`);
}
