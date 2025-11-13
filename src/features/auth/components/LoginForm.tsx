/**
 * Composant formulaire de connexion avec validation
 * @module LoginForm
 */

import { useState, useCallback, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Mail, Lock, LogIn } from 'lucide-react';
import { useLogin } from '../hooks/useLogin';
import { toast } from 'sonner';
import type { LoginCredentials } from '../types/auth.types';
import {
  alertLoginSuccess,
  alertLoginFailed,
  alertInvalidEmail,
} from '@/lib/alerts';

// Composants shadcn/ui (à créer avec CLI shadcn)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

/**
 * Schéma de validation Zod renforcé
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email requis')
    .email('Format email invalide')
    .toLowerCase()
    .trim()
    .refine((email) => email.endsWith('.cg') || email.endsWith('.com'), {
      message: 'Email doit se terminer par .cg ou .com',
    }),
  password: z
    .string()
    .min(1, 'Mot de passe requis')
    .min(6, 'Minimum 6 caractères')
    .max(100, 'Maximum 100 caractères'),
  rememberMe: z.boolean().optional().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Composant formulaire de connexion
 */
export const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { login, isLoading, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const rememberMe = watch('rememberMe');

  /**
   * Soumission du formulaire avec useCallback et useTransition
   */
  const onSubmit = useCallback(
    async (data: LoginFormData) => {
      startTransition(async () => {
        try {
          const credentials: LoginCredentials = {
            email: data.email,
            password: data.password,
            rememberMe: data.rememberMe,
          };

          const result = await login(credentials);

          if (result.success) {
            // ✅ Alerte moderne de succès
            const userName = result.user?.user_metadata?.first_name || 'Utilisateur';
            alertLoginSuccess(userName);
          } else {
            // ❌ Alerte moderne d'erreur
            alertLoginFailed(result.error || 'Email ou mot de passe incorrect');
          }
        } catch (error) {
          const errorMessage = error instanceof Error
            ? error.message
            : 'Une erreur est survenue lors de la connexion';

          // ❌ Alerte moderne d'erreur
          alertLoginFailed(errorMessage);

          console.error('LoginForm error:', error);
        }
      });
    },
    [login]
  );

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      aria-label="Formulaire de connexion"
    >
      {/* Champ Email */}
      <div className="space-y-1">
        <Label htmlFor="email" className="text-xs font-medium text-[#1D3557]">
          Adresse email
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
          <Input
            id="email"
            type="email"
            placeholder="nom.prenom@exemple.com"
            className="pl-9 h-10 text-sm border-gray-200 focus:border-[#1D3557] focus:ring-2 focus:ring-[#1D3557]/20 transition-all"
            {...register('email')}
            disabled={isLoading}
            autoComplete="email"
            autoFocus
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
        </div>
        {errors.email && (
          <p id="email-error" className="text-xs text-red-600 flex items-center gap-1" role="alert">
            <span className="text-xs" aria-hidden="true">⚠️</span>
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Champ Mot de passe */}
      <div className="space-y-1">
        <Label htmlFor="password" className="text-xs font-medium text-[#1D3557]">
          Mot de passe
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className="pl-9 pr-10 h-10 text-sm border-gray-200 focus:border-[#1D3557] focus:ring-2 focus:ring-[#1D3557]/20 transition-all"
            {...register('password')}
            disabled={isLoading}
            autoComplete="current-password"
            aria-invalid={errors.password ? 'true' : 'false'}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1D3557] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1D3557] rounded"
            disabled={isLoading}
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className="text-xs text-red-600 flex items-center gap-1" role="alert">
            <span className="text-xs" aria-hidden="true">⚠️</span>
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Options */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="rememberMe"
            checked={rememberMe}
            onCheckedChange={(checked) => setValue('rememberMe', checked === true)}
            disabled={isLoading}
            aria-label="Se souvenir de moi"
          />
          <Label
            htmlFor="rememberMe"
            className="text-xs text-[#1D3557] cursor-pointer select-none"
          >
            Se souvenir de moi
          </Label>
        </div>

        <a
          href="/forgot-password"
          className="text-xs text-[#1D3557] hover:text-[#2A9D8F] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#1D3557] rounded px-1"
        >
          Mot de passe oublié ?
        </a>
      </div>

      {/* Erreur globale */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 bg-red-50 border border-red-200 rounded-lg"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-xs text-red-700 flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">⚠️</span>
            {error}
          </p>
        </motion.div>
      )}

      {/* Bouton de connexion */}
      <Button
        type="submit"
        disabled={isLoading || isPending}
        className="w-full h-10 text-sm bg-[#1D3557] hover:bg-[#2A9D8F] text-white transition-colors disabled:opacity-50"
        aria-label="Se connecter au système"
      >
        {(isLoading || isPending) ? (
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>Connexion en cours...</span>
          </motion.div>
        ) : (
          <span className="flex items-center gap-2">
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Accéder au système
          </span>
        )}
      </Button>

    </motion.form>
  );
};
