/**
 * Error Boundary avancé avec logging et recovery
 * @module ErrorBoundaryAdvanced
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

/**
 * Error Boundary avancé avec retry et logging
 */
export class ErrorBoundaryAdvanced extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Logger l'erreur
    logger.error('Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack,
      errorCount: this.state.errorCount + 1,
    });

    // Callback personnalisé
    this.props.onError?.(error, errorInfo);

    // Mettre à jour l'état
    this.setState((prevState) => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Envoyer au serveur de monitoring (Sentry, etc.)
    this.sendErrorToMonitoring(error, errorInfo);
  }

  componentDidUpdate(prevProps: Props): void {
    // Reset si les resetKeys changent
    if (this.state.hasError && this.props.resetKeys) {
      const hasResetKeyChanged = this.props.resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );

      if (hasResetKeyChanged) {
        this.resetError();
      }
    }
  }

  sendErrorToMonitoring(error: Error, errorInfo: ErrorInfo): void {
    // TODO: Intégrer avec Sentry ou autre service de monitoring
    if (import.meta.env.PROD) {
      // Exemple avec Sentry:
      // Sentry.captureException(error, {
      //   contexts: {
      //     react: {
      //       componentStack: errorInfo.componentStack,
      //     },
      //   },
      // });
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Fallback personnalisé
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI d'erreur par défaut
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <div className="flex flex-col items-center text-center">
              {/* Icône */}
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>

              {/* Titre */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Une erreur est survenue
              </h1>

              {/* Description */}
              <p className="text-gray-600 mb-6">
                Nous sommes désolés, une erreur inattendue s'est produite. Notre équipe a été
                notifiée et travaille à résoudre le problème.
              </p>

              {/* Détails de l'erreur (dev uniquement) */}
              {import.meta.env.DEV && this.state.error && (
                <div className="w-full mb-6 p-4 bg-gray-100 rounded-lg text-left">
                  <p className="text-sm font-mono text-red-600 mb-2">
                    {this.state.error.message}
                  </p>
                  {this.state.errorInfo && (
                    <details className="text-xs text-gray-600">
                      <summary className="cursor-pointer font-semibold mb-2">
                        Stack trace
                      </summary>
                      <pre className="whitespace-pre-wrap overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button
                  onClick={this.resetError}
                  className="flex-1 bg-[#2A9D8F] hover:bg-[#238276]"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Réessayer
                </Button>

                <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                  <Home className="w-4 h-4 mr-2" />
                  Accueil
                </Button>
              </div>

              {/* Compteur d'erreurs (dev uniquement) */}
              {import.meta.env.DEV && this.state.errorCount > 1 && (
                <p className="text-xs text-gray-500 mt-4">
                  Erreurs consécutives: {this.state.errorCount}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook pour utiliser Error Boundary avec reset
 */
export function useErrorBoundary() {
  const [resetKey, setResetKey] = React.useState(0);

  const reset = React.useCallback(() => {
    setResetKey((prev) => prev + 1);
  }, []);

  return { resetKey, reset };
}
