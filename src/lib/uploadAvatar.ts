/**
 * Utilitaires pour l'upload et la gestion des avatars
 * Supabase Storage - Bucket 'avatars'
 * @module uploadAvatar
 */

import { supabase } from './supabase';

export interface UploadAvatarResult {
  url: string | null;
  error: Error | null;
}

export interface DeleteAvatarResult {
  error: Error | null;
}

/**
 * Upload un avatar vers Supabase Storage
 * @param userId - ID de l'utilisateur
 * @param file - Fichier image (déjà compressé en WebP)
 * @returns URL publique de l'avatar ou erreur
 */
export const uploadAvatar = async (
  userId: string,
  file: File
): Promise<UploadAvatarResult> => {
  try {
    // Validation
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!file) {
      throw new Error('File is required');
    }

    // Vérifier le type MIME
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only images are allowed.');
    }

    // Vérifier la taille (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 5MB limit');
    }

    // Nom unique du fichier
    const fileExt = file.name.split('.').pop() || 'webp';
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    console.log('Uploading avatar:', {
      userId,
      fileName,
      filePath,
      fileSize: `${(file.size / 1024).toFixed(2)}KB`,
      fileType: file.type,
    });

    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600', // Cache 1 heure
        upsert: true, // Remplacer si existe déjà
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    console.log('Upload successful:', data);

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    console.log('Public URL:', publicUrl);

    return {
      url: publicUrl,
      error: null,
    };
  } catch (error) {
    console.error('Upload avatar error:', error);
    return {
      url: null,
      error: error as Error,
    };
  }
};

/**
 * Supprime un avatar de Supabase Storage
 * @param avatarUrl - URL complète de l'avatar
 * @returns Erreur si échec
 */
export const deleteAvatar = async (
  avatarUrl: string
): Promise<DeleteAvatarResult> => {
  try {
    if (!avatarUrl) {
      throw new Error('Avatar URL is required');
    }

    // Extraire le chemin du fichier depuis l'URL
    // Format: https://{project}.supabase.co/storage/v1/object/public/avatars/{userId}/{fileName}
    const urlParts = avatarUrl.split('/avatars/');
    if (urlParts.length < 2) {
      throw new Error('Invalid avatar URL format');
    }
    const filePath = urlParts[1];

    console.log('Deleting avatar:', {
      url: avatarUrl,
      filePath,
    });

    // Supprimer de Supabase Storage
    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }

    console.log('Avatar deleted successfully');

    return { error: null };
  } catch (error) {
    console.error('Delete avatar error:', error);
    return { error: error as Error };
  }
};

/**
 * Liste tous les avatars d'un utilisateur
 * @param userId - ID de l'utilisateur
 * @returns Liste des fichiers
 */
export const listUserAvatars = async (userId: string) => {
  try {
    const { data, error } = await supabase.storage
      .from('avatars')
      .list(userId, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('List avatars error:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Nettoie les anciens avatars d'un utilisateur (garde uniquement le plus récent)
 * @param userId - ID de l'utilisateur
 * @param keepLatest - Nombre d'avatars à garder (défaut: 1)
 */
export const cleanupOldAvatars = async (
  userId: string,
  keepLatest: number = 1
): Promise<DeleteAvatarResult> => {
  try {
    const { data: files, error: listError } = await listUserAvatars(userId);

    if (listError || !files) {
      throw listError || new Error('Failed to list avatars');
    }

    // Garder uniquement les N plus récents
    if (files.length <= keepLatest) {
      return { error: null }; // Rien à nettoyer
    }

    const filesToDelete = files.slice(keepLatest).map(file => `${userId}/${file.name}`);

    console.log('Cleaning up old avatars:', {
      userId,
      totalFiles: files.length,
      keepLatest,
      toDelete: filesToDelete.length,
    });

    const { error: deleteError } = await supabase.storage
      .from('avatars')
      .remove(filesToDelete);

    if (deleteError) {
      throw deleteError;
    }

    console.log(`Cleaned up ${filesToDelete.length} old avatar(s)`);

    return { error: null };
  } catch (error) {
    console.error('Cleanup avatars error:', error);
    return { error: error as Error };
  }
};
