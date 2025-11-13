/**
 * Utilitaires pour la gestion des avatars
 */

import { supabase } from './supabase';

/**
 * Génère l'URL publique d'un avatar depuis Supabase Storage
 * @param avatarPath - Chemin de l'avatar dans le bucket (ex: "user-id/avatar.webp")
 * @returns URL publique de l'avatar ou null si le chemin est invalide
 */
export const getAvatarUrl = (avatarPath: string | null | undefined): string | null => {
  // Cas 1 : Pas d'avatar
  if (!avatarPath || avatarPath.trim() === '') {
    return null;
  }

  // Cas 2 : URL complète (déjà générée ou externe)
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }

  // Cas 3 : Chemin relatif - Générer l'URL publique depuis Supabase Storage
  try {
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(avatarPath);

    // Vérifier que l'URL est valide
    if (!data?.publicUrl) {
      console.warn(`[Avatar] URL publique non générée pour: ${avatarPath}`);
      return null;
    }

    return data.publicUrl;
  } catch (error) {
    console.error(`[Avatar] Erreur lors de la génération de l'URL pour: ${avatarPath}`, error);
    return null;
  }
};

/**
 * Upload un avatar vers Supabase Storage
 * @param userId - ID de l'utilisateur
 * @param file - Fichier image à uploader
 * @returns URL publique de l'avatar uploadé
 */
export const uploadAvatar = async (userId: string, file: File): Promise<string> => {
  // Générer un nom de fichier unique
  const fileExt = file.name.split('.').pop();
  const fileName = `avatar_${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  // Upload vers Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    throw new Error(`Erreur upload: ${uploadError.message}`);
  }

  // Obtenir l'URL publique
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

/**
 * Vérifie si un avatar existe dans le bucket Supabase Storage
 * @param avatarPath - Chemin de l'avatar dans le bucket
 * @returns true si l'avatar existe, false sinon
 */
export const avatarExists = async (avatarPath: string): Promise<boolean> => {
  if (!avatarPath) return false;

  try {
    // Extraire le chemin si c'est une URL complète
    let path = avatarPath;
    if (avatarPath.startsWith('http')) {
      const url = new URL(avatarPath);
      const pathParts = url.pathname.split('/avatars/');
      if (pathParts.length < 2) return false;
      path = pathParts[1];
    }

    // Vérifier l'existence du fichier
    const { data, error } = await supabase.storage
      .from('avatars')
      .list(path.split('/')[0], {
        search: path.split('/')[1],
      });

    if (error) {
      console.error('[Avatar] Erreur vérification existence:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('[Avatar] Erreur vérification existence:', error);
    return false;
  }
};

/**
 * Supprime un avatar de Supabase Storage
 * @param avatarPath - Chemin de l'avatar dans le bucket
 */
export const deleteAvatar = async (avatarPath: string): Promise<void> => {
  if (!avatarPath) return;

  try {
    // Extraire le chemin si c'est une URL complète
    let path = avatarPath;
    if (avatarPath.startsWith('http')) {
      const url = new URL(avatarPath);
      const pathParts = url.pathname.split('/avatars/');
      if (pathParts.length < 2) {
        throw new Error('URL d\'avatar invalide');
      }
      path = pathParts[1];
    }

    const { error } = await supabase.storage
      .from('avatars')
      .remove([path]);

    if (error) {
      throw new Error(`Erreur suppression: ${error.message}`);
    }
  } catch (error) {
    console.error('[Avatar] Erreur suppression:', error);
    throw error;
  }
};

/**
 * Compresse une image en WebP
 * @param file - Fichier image à compresser
 * @param maxWidth - Largeur maximale (défaut: 400px)
 * @param quality - Qualité de compression (défaut: 0.8)
 * @returns Fichier compressé en WebP
 */
export const compressImageToWebP = async (
  file: File,
  maxWidth: number = 400,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculer les nouvelles dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        // Créer un canvas pour la compression
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Impossible de créer le contexte canvas'));
          return;
        }
        
        // Dessiner l'image redimensionnée
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir en WebP
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File(
                [blob],
                `avatar_${Date.now()}.webp`,
                {
                  type: 'image/webp',
                  lastModified: Date.now(),
                }
              );
              resolve(compressedFile);
            } else {
              reject(new Error('Erreur lors de la compression'));
            }
          },
          'image/webp',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
    reader.readAsDataURL(file);
  });
};
