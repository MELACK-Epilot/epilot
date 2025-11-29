/**
 * Service pour la gestion des profils d'accès
 * Gère les opérations CRUD et l'upload d'avatars
 * @module profile.service
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/supabase.types';

// ============================================
// CONSTANTS
// ============================================

/** Extensions de fichiers autorisées pour les avatars */
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'] as const;

/** Taille maximale d'un avatar (2 MB) */
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

/** Pattern UUID v4 pour validation */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Pattern pour le code de profil (alphanumérique + underscore) */
const CODE_PATTERN = /^[a-z][a-z0-9_]{2,49}$/;

// ============================================
// TYPES
// ============================================

type SupabaseClientType = SupabaseClient<Database>;

/** Permissions sous forme de Record (usage frontend) */
/** true = accès complet, 'read_only' = lecture seule, false = pas d'accès */
export type ProfilePermissions = Record<string, boolean | 'read_only'>;

/** Données pour créer/mettre à jour un profil */
export interface ProfileData {
  name_fr: string;
  description: string | null;
  permissions: ProfilePermissions;
  icon: string | null;
  is_active: boolean;
}

export interface CreateProfileData extends ProfileData {
  code: string;
  name_en: string;
  school_group_id: string; // Groupe propriétaire du profil
  created_by?: string; // ID de l'admin qui crée
}

/** Erreur personnalisée pour le service profil */
export class ProfileServiceError extends Error {
  constructor(
    message: string,
    public readonly code: 'VALIDATION_ERROR' | 'DUPLICATE_CODE' | 'NOT_FOUND' | 'UPLOAD_ERROR' | 'DATABASE_ERROR',
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ProfileServiceError';
  }
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Valide un UUID v4
 * @throws ProfileServiceError si invalide
 */
const validateUUID = (id: string, fieldName: string): void => {
  if (!UUID_PATTERN.test(id)) {
    throw new ProfileServiceError(
      `${fieldName} invalide`,
      'VALIDATION_ERROR',
      { field: fieldName, value: id }
    );
  }
};

/**
 * Valide un code de profil
 * @throws ProfileServiceError si invalide
 */
const validateCode = (code: string): string => {
  const normalized = code.trim().toLowerCase();
  
  if (!CODE_PATTERN.test(normalized)) {
    throw new ProfileServiceError(
      'Le code doit commencer par une lettre, contenir uniquement des lettres minuscules, chiffres et underscores (3-50 caractères)',
      'VALIDATION_ERROR',
      { field: 'code', value: code }
    );
  }
  
  return normalized;
};

/**
 * Valide un fichier pour upload avatar
 * @throws ProfileServiceError si invalide
 */
const validateAvatarFile = (file: File): string => {
  // Vérifier la taille
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new ProfileServiceError(
      `Le fichier est trop volumineux (max ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB)`,
      'VALIDATION_ERROR',
      { field: 'file', maxSize: MAX_FILE_SIZE_BYTES, actualSize: file.size }
    );
  }
  
  // Vérifier l'extension
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  if (!fileExt || !ALLOWED_EXTENSIONS.includes(fileExt as typeof ALLOWED_EXTENSIONS[number])) {
    throw new ProfileServiceError(
      `Extension non autorisée. Extensions acceptées: ${ALLOWED_EXTENSIONS.join(', ')}`,
      'VALIDATION_ERROR',
      { field: 'file', allowedExtensions: ALLOWED_EXTENSIONS, actualExtension: fileExt }
    );
  }
  
  return fileExt;
};

/**
 * Convertit les permissions frontend en Json Supabase
 */
const permissionsToJson = (permissions: ProfilePermissions): Json => {
  return permissions as unknown as Json;
};

// ============================================
// AVATAR UPLOAD
// ============================================

/**
 * Upload un avatar de profil vers Supabase Storage
 * @param supabase - Client Supabase injecté
 * @param file - Fichier image à uploader
 * @returns URL publique de l'avatar
 * @throws ProfileServiceError en cas d'erreur
 */
export const uploadProfileAvatar = async (
  supabase: SupabaseClientType,
  file: File
): Promise<string> => {
  const fileExt = validateAvatarFile(file);
  const fileName = `profile_${Date.now()}_${crypto.randomUUID()}.${fileExt}`;
  const filePath = `avatars/profiles/${fileName}`;
  
  const { error: uploadError } = await supabase.storage
    .from('files')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
    
  if (uploadError) {
    throw new ProfileServiceError(
      "Erreur lors de l'upload de l'image",
      'UPLOAD_ERROR',
      uploadError
    );
  }
  
  const { data: urlData } = supabase.storage.from('files').getPublicUrl(filePath);
  return urlData.publicUrl;
};

// ============================================
// PROFILE CRUD
// ============================================

/**
 * Vérifie si un code de profil existe déjà DANS UN GROUPE
 * @param supabase - Client Supabase injecté
 * @param code - Code à vérifier
 * @param schoolGroupId - ID du groupe scolaire
 * @param excludeId - ID à exclure (pour update)
 */
export const checkProfileCodeExists = async (
  supabase: SupabaseClientType,
  code: string,
  schoolGroupId: string,
  excludeId?: string
): Promise<boolean> => {
  const normalizedCode = code.trim().toLowerCase();
  
  let query = supabase
    .from('access_profiles')
    .select('id')
    .eq('code', normalizedCode)
    .eq('school_group_id', schoolGroupId); // Filtrer par groupe
  
  if (excludeId) {
    query = query.neq('id', excludeId);
  }
  
  const { data, error } = await query.maybeSingle();
  
  if (error) {
    throw new ProfileServiceError(
      'Erreur lors de la vérification du code',
      'DATABASE_ERROR',
      error
    );
  }
  
  return !!data;
};

/**
 * Crée un nouveau profil d'accès
 * @param supabase - Client Supabase injecté
 * @param data - Données du profil
 * @throws ProfileServiceError en cas d'erreur
 */
export const createProfile = async (
  supabase: SupabaseClientType,
  data: CreateProfileData
): Promise<void> => {
  const code = validateCode(data.code);
  
  // Vérifier l'unicité du code DANS LE GROUPE
  const exists = await checkProfileCodeExists(supabase, code, data.school_group_id);
  if (exists) {
    throw new ProfileServiceError(
      `Le code "${code}" existe déjà dans ce groupe`,
      'DUPLICATE_CODE',
      { code }
    );
  }
  
  const { error } = await supabase
    .from('access_profiles')
    .insert({
      name_fr: data.name_fr.trim(),
      name_en: data.name_en.trim(),
      code,
      description: data.description?.trim() || null,
      permissions: permissionsToJson(data.permissions),
      icon: data.icon,
      is_active: data.is_active,
      school_group_id: data.school_group_id, // Groupe propriétaire
      created_by: data.created_by || null,
      is_template: false, // Pas un template
    });
  
  if (error) {
    throw new ProfileServiceError(
      'Erreur lors de la création du profil',
      'DATABASE_ERROR',
      error
    );
  }
};

/**
 * Met à jour un profil d'accès existant
 * @param supabase - Client Supabase injecté
 * @param profileId - ID du profil à mettre à jour
 * @param data - Nouvelles données
 * @throws ProfileServiceError en cas d'erreur
 */
export const updateProfile = async (
  supabase: SupabaseClientType,
  profileId: string, 
  data: ProfileData
): Promise<void> => {
  validateUUID(profileId, 'profileId');
  
  const { error } = await supabase
    .from('access_profiles')
    .update({
      name_fr: data.name_fr.trim(),
      description: data.description?.trim() || null,
      permissions: permissionsToJson(data.permissions),
      icon: data.icon,
      is_active: data.is_active,
    })
    .eq('id', profileId);
  
  if (error) {
    throw new ProfileServiceError(
      'Erreur lors de la mise à jour du profil',
      'DATABASE_ERROR',
      error
    );
  }
};

/**
 * Supprime un profil d'accès
 * @param supabase - Client Supabase injecté
 * @param profileId - ID du profil à supprimer
 * @throws ProfileServiceError en cas d'erreur
 */
export const deleteProfile = async (
  supabase: SupabaseClientType,
  profileId: string
): Promise<void> => {
  validateUUID(profileId, 'profileId');
  
  const { error } = await supabase
    .from('access_profiles')
    .delete()
    .eq('id', profileId);
  
  if (error) {
    throw new ProfileServiceError(
      'Erreur lors de la suppression du profil',
      'DATABASE_ERROR',
      error
    );
  }
};

// ============================================
// ASSIGNMENT
// ============================================

/**
 * Assigne un profil à une liste d'utilisateurs
 * @param supabase - Client Supabase injecté
 * @param profileCode - Code du profil à assigner
 * @param userIds - Liste des IDs utilisateurs
 */
export const assignProfileToUsers = async (
  supabase: SupabaseClientType,
  profileCode: string,
  userIds: string[]
): Promise<void> => {
  if (userIds.length === 0) return;

  // Validation
  userIds.forEach(id => validateUUID(id, 'userId'));
  // On valide le format du code, mais on suppose qu'il existe (intégrité référentielle)
  if (!CODE_PATTERN.test(profileCode)) {
     throw new ProfileServiceError(
      'Code profil invalide',
      'VALIDATION_ERROR',
      { code: profileCode }
    );
  }

  const { error } = await supabase
    .from('users')
    .update({ access_profile_code: profileCode })
    .in('id', userIds);

  if (error) {
    throw new ProfileServiceError(
      "Erreur lors de l'assignation du profil",
      'DATABASE_ERROR',
      error
    );
  }
};

/**
 * Retire le profil d'une liste d'utilisateurs
 * @param supabase - Client Supabase injecté
 * @param userIds - Liste des IDs utilisateurs
 */
export const removeProfileFromUsers = async (
  supabase: SupabaseClientType,
  userIds: string[]
): Promise<void> => {
  if (userIds.length === 0) return;

  userIds.forEach(id => validateUUID(id, 'userId'));

  const { error } = await supabase
    .from('users')
    .update({ access_profile_code: null })
    .in('id', userIds);

  if (error) {
    throw new ProfileServiceError(
      "Erreur lors du retrait du profil",
      'DATABASE_ERROR',
      error
    );
  }
};
