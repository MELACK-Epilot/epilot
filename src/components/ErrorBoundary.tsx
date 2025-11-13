/**
 * ErrorBoundary - Composant pour capturer les erreurs React
 * @module ErrorBoundary
 */

import { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: string;
}

/**
 * ErrorBoundary pour capturer les erreurs React
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('❌ ErrorBoundary caught:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo: errorInfo.componentStack,
    });

    // TODO: Envoyer à Sentry ou service de monitoring
    // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Fallback personnalisé si fourni
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI par défaut
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-white rounded-2xl shadow-2xl border border-red-100 p-8">
              {/* Icône d'erreur */}
              <div className="flex items-center justify-center mb-6">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-red-600" />
                </div>
              </div>

              {/* Titre */}
              <h1 className="text-3xl font-bold text-gray-900 text-center mb-3">
                Une erreur est survenue
              </h1>

              {/* Description */}
              <p className="text-gray-600 text-center mb-6">
                Nous sommes désolés, une erreur inattendue s'est produite. 
                Notre équipe a été notifiée et travaille à résoudre le problème.
              </p>

              {/* Détails de l'erreur (dev mode) */}
              {import.meta.env.DEV && this.state.error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-semibold text-red-800 mb-2">
                    Détails de l'erreur (mode développement) :
                  </p>
                  <pre className="text-xs text-red-700 overflow-auto max-h-40">
                    {this.state.error.toString()}
                    {this.state.errorInfo && `\n\n${this.state.errorInfo}`}
                  </pre>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={this.handleReset}
                  className="bg-[#1D3557] hover:bg-[#2A9D8F] text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recharger la page
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/dashboard'}
                  className="border-gray-300"
                >
                  Retour au tableau de bord
                </Button>
              </div>

              {/* Support */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-500">
                  Besoin d'aide ?{' '}
                  <a
                    href="mailto:support@epilot.cg"
                    className="text-[#1D3557] hover:text-[#2A9D8F] font-medium"
                  >
                    Contactez le support technique
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
