/**
 * Types TypeScript pour l'authentification E-Pilot
 * @module auth.types
 */

import type { Role } from '@/config/roles';

/**
 * Données de connexion utilisateur
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Réponse de l'API d'authentification
 */
export interface AuthResponse {
  success: boolean;
  token: string;
  refreshToken?: string;
  user: User;
  expiresIn: number; // en secondes
}

/**
 * Utilisateur authentifié (Legacy - à migrer vers Profile)
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role; // Utilise le type Role de roles.ts (source unique de vérité)
  avatar?: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  phone?: string;
  schoolGroupId?: string;
  schoolGroupName?: string; // Nom du groupe scolaire
  schoolGroupLogo?: string; // Logo du groupe scolaire
  schoolId?: string;
  createdAt: string;
  lastLogin?: string;
}

/**
 * Profile utilisateur (Nouvelle structure - Supabase Best Practice)
 * Correspond à la table public.profiles
 */
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  name: string;
  avatar_url?: string;
  role: 'SUPER_ADMIN' | 'admin_groupe' | 'admin_ecole';
  is_active: boolean;
  phone?: string;
  address?: string;
  birth_date?: string;
  created_at: string;
  updated_at: string;
  // Relations
  school_group_id?: string;
  school_group_name?: string;
  school_group_logo?: string;
}

/**
 * Rôles utilisateur selon la hiérarchie E-Pilot
 */
export enum UserRole {
  SUPER_ADMIN = 'super_admin',           // Niveau 1: Plateforme
  GROUP_ADMIN = 'group_admin',           // Niveau 2: Groupe Scolaire
  SCHOOL_ADMIN = 'school_admin',         // Niveau 3: École
  TEACHER = 'teacher',                   // Niveau 4: Enseignant
  CPE = 'cpe',                           // Niveau 4: Conseiller Principal d'Éducation
  ACCOUNTANT = 'accountant',             // Niveau 4: Comptable
  LIBRARIAN = 'librarian',               // Niveau 4: Documentaliste
  SUPERVISOR = 'supervisor',             // Niveau 4: Surveillant
}

/**
 * État d'authentification global
 */
export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Actions du store d'authentification
 */
export interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  setUser: (user: User) => void;
  setToken: (token: string, refreshToken?: string) => void;
  clearError: () => void;
  checkAuth: () => boolean;
}

/**
 * Erreur d'authentification
 */
export interface AuthError {
  code: string;
  message: string;
  field?: string;
}

/**
 * Données persistées localement (Dexie.js)
 */
export interface PersistedAuth {
  id?: number;
  email: string;
  token: string;
  refreshToken?: string;
  user: User;
  rememberMe: boolean;
  expiresAt: number; // timestamp
  createdAt: number; // timestamp
}
