/**
 * Page de connexion optimisée avec validation et UX améliorée
 * @module LoginPage
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { validate, sanitizers } from '@/lib/validation';
import { notify } from '@/lib/notifications';
import { logger } from '@/lib/logger';
import { performanceMonitor } from '@/lib/performance';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2, LogIn, AlertCircle } from 'lucide-react';

// Schéma de validation
const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPageOptimized() {
  const navigate = useNavigate();
  const signIn = useAuthStore((state) => state.signIn);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const error = useAuthStore((state) => state.error);
  const setError = useAuthStore((state) => state.setError);

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirection si déjà authentifié
  useEffect(() => {
    if (isAuthenticated && user) {
      logger.info('User already authenticated, redirecting', { role: user.role });
      
      // Redirection selon le rôle
      if (user.role === 'super_admin' || user.role === 'admin_groupe') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/user', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Nettoyer l'erreur au démontage
  useEffect(() => {
    return () => {
      setError(null);
    };
  }, [setError]);

  /**
   * Gérer le changement des champs
   */
  const handleChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Nettoyer l'erreur de validation pour ce champ
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Nettoyer l'erreur globale
    if (error) {
      setError(null);
    }
  };

  /**
   * Gérer la soumission du formulaire
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Nettoyer les données
    const cleanData = {
      email: sanitizers.email(formData.email),
      password: formData.password,
    };

    // 2. Valider
    const { success, errors } = validate(loginSchema, cleanData);

    if (!success && errors) {
      const formattedErrors: Record<string, string> = {};
      errors.errors.forEach((error) => {
        const field = error.path[0] as string;
        formattedErrors[field] = error.message;
      });
      setValidationErrors(formattedErrors);
      return;
    }

    // 3. Connexion
    setIsLoading(true);
    setValidationErrors({});

    try {
      // Mesurer la performance
      await performanceMonitor.measure('login', async () => {
        await signIn(cleanData.email, cleanData.password);
      });

      // Notification de succès
      notify.success(
        'Connexion réussie',
        `Bienvenue ${user?.first_name || 'sur E-Pilot'} !`,
        ['toast']
      );

      logger.info('Login successful', {
        email: cleanData.email,
        role: user?.role,
      });
    } catch (error: any) {
      logger.error('Login failed', error);
      
      // Message d'erreur personnalisé
      let errorMessage = 'Email ou mot de passe incorrect';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Email ou mot de passe incorrect';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Veuillez confirmer votre email avant de vous connecter';
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'Trop de tentatives. Veuillez réessayer dans quelques minutes';
      }

      setError(errorMessage);
      
      notify.error('Erreur de connexion', errorMessage, ['toast']);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Gérer "Mot de passe oublié"
   */
  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1D3557] via-[#2A4A6F] to-[#1D3557] p-4">
      <div className="w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-4">
            <span className="text-4xl font-bold text-[#2A9D8F]">E</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">E-Pilot</h1>
          <p className="text-gray-300">Plateforme de gestion scolaire</p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Connexion</h2>

          {/* Erreur globale */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre.email@exemple.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={isLoading}
                className={validationErrors.email ? 'border-red-500' : ''}
                autoComplete="email"
                autoFocus
              />
              {validationErrors.email && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  disabled={isLoading}
                  className={validationErrors.password ? 'border-red-500' : ''}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.password}</p>
              )}
            </div>

            {/* Mot de passe oublié */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="w-4 h-4 text-[#2A9D8F] border-gray-300 rounded focus:ring-[#2A9D8F]"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                  Se souvenir de moi
                </label>
              </div>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-[#2A9D8F] hover:text-[#238276] font-medium"
              >
                Mot de passe oublié ?
              </button>
            </div>

            {/* Bouton de connexion */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#2A9D8F] hover:bg-[#238276] text-white h-12 text-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Se connecter
                </>
              )}
            </Button>
          </form>

          {/* Informations de développement */}
          {import.meta.env.DEV && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 font-semibold mb-2">
                🔧 Mode Développement
              </p>
              <p className="text-xs text-gray-500">
                Utilisez vos identifiants de test pour vous connecter
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-300">
            © 2025 E-Pilot. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
}
