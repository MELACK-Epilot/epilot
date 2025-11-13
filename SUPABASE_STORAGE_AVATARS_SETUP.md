# 📸 Supabase Storage - Configuration Avatars

**Date**: 29 Octobre 2025  
**Bucket**: `avatars`  
**Statut**: ⏳ **À CONFIGURER**

---

## 🎯 Objectif

Configurer Supabase Storage pour permettre l'upload et le stockage des photos de profil des utilisateurs.

---

## 📋 Étapes de Configuration

### 1. Créer le Bucket `avatars`

#### Via SQL Editor
```sql
-- Créer le bucket public pour les avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);
```

#### Via Dashboard Supabase
1. Aller dans **Storage** (menu gauche)
2. Cliquer sur **New bucket**
3. Nom : `avatars`
4. Public : ✅ **Coché** (les avatars doivent être accessibles publiquement)
5. Cliquer sur **Create bucket**

---

### 2. Configurer les Politiques RLS (Row Level Security)

#### Politique 1 : Upload (Authenticated Users)
```sql
-- Permettre aux utilisateurs authentifiés d'uploader des avatars
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Explication** :
- Seuls les utilisateurs **authentifiés** peuvent uploader
- Ils peuvent uploader uniquement dans leur propre dossier (userId)
- Format du chemin : `avatars/{userId}/avatar.webp`

#### Politique 2 : Lecture Publique
```sql
-- Permettre à tout le monde de voir les avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

**Explication** :
- Les avatars sont **publics** (accessibles sans authentification)
- Nécessaire pour afficher les avatars dans l'interface

#### Politique 3 : Mise à Jour (Owner Only)
```sql
-- Permettre aux utilisateurs de mettre à jour leur propre avatar
CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Politique 4 : Suppression (Owner Only)
```sql
-- Permettre aux utilisateurs de supprimer leur propre avatar
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

### 3. Configuration des Limites

#### Taille Maximale des Fichiers
```sql
-- Définir la taille max à 5MB (5242880 bytes)
UPDATE storage.buckets
SET file_size_limit = 5242880
WHERE id = 'avatars';
```

#### Types MIME Autorisés
```sql
-- Autoriser uniquement les images
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
]
WHERE id = 'avatars';
```

---

## 💻 Implémentation dans le Code

### 1. Fonction d'Upload

**Fichier** : `src/lib/uploadAvatar.ts`

```typescript
import { supabase } from './supabase';

export interface UploadAvatarResult {
  url: string | null;
  error: Error | null;
}

export const uploadAvatar = async (
  userId: string,
  file: File
): Promise<UploadAvatarResult> => {
  try {
    // Nom unique du fichier
    const fileExt = 'webp'; // Toujours WebP après compression
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Remplacer si existe déjà
      });

    if (error) {
      throw error;
    }

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

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
```

### 2. Fonction de Suppression

```typescript
export const deleteAvatar = async (
  avatarUrl: string
): Promise<{ error: Error | null }> => {
  try {
    // Extraire le chemin du fichier depuis l'URL
    const urlParts = avatarUrl.split('/avatars/');
    if (urlParts.length < 2) {
      throw new Error('Invalid avatar URL');
    }
    const filePath = urlParts[1];

    // Supprimer de Supabase Storage
    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath]);

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('Delete avatar error:', error);
    return { error: error as Error };
  }
};
```

### 3. Intégration dans UserFormDialog

**Fichier** : `src/features/dashboard/components/UserFormDialog.tsx`

```typescript
import { uploadAvatar } from '@/lib/uploadAvatar';

const onSubmit = async (values: CreateUserFormValues | UpdateUserFormValues) => {
  startTransition(async () => {
    try {
      let avatarUrl = values.avatar;

      // Upload avatar si un fichier a été sélectionné
      if (avatarFile) {
        const userId = user?.id || crypto.randomUUID(); // Générer ID si création
        const { url, error } = await uploadAvatar(userId, avatarFile);

        if (error) {
          toast.error('Erreur lors de l\'upload de l\'avatar', {
            description: error.message,
          });
          return;
        }

        avatarUrl = url;
      }

      const dataToSubmit = {
        ...values,
        avatar: avatarUrl,
      };

      if (mode === 'create') {
        await createUser.mutateAsync(dataToSubmit as CreateUserFormValues);
        toast.success('✅ Administrateur créé avec succès');
      } else if (user) {
        await updateUser.mutateAsync({
          id: user.id,
          ...(dataToSubmit as UpdateUserFormValues),
        });
        toast.success('✅ Modifications enregistrées');
      }

      onOpenChange(false);
      form.reset();
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Une erreur est survenue';
      
      toast.error('❌ Erreur', {
        description: errorMessage,
      });
    }
  });
};
```

---

## 🧪 Tests

### 1. Test Upload
```typescript
// Test dans la console du navigateur
import { uploadAvatar } from '@/lib/uploadAvatar';

const testUpload = async () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const result = await uploadAvatar('test-user-id', file);
      console.log('Upload result:', result);
    }
  };
  
  input.click();
};

testUpload();
```

### 2. Vérifier l'URL Publique
```typescript
// L'URL doit ressembler à :
// https://csltuxbanvweyfzqpfap.supabase.co/storage/v1/object/public/avatars/{userId}/{fileName}.webp

const avatarUrl = 'https://csltuxbanvweyfzqpfap.supabase.co/storage/v1/object/public/avatars/123e4567-e89b-12d3-a456-426614174000/123e4567-e89b-12d3-a456-426614174000_1730208900000.webp';

// Tester l'accès
fetch(avatarUrl)
  .then(response => console.log('Avatar accessible:', response.ok))
  .catch(error => console.error('Erreur:', error));
```

---

## 📊 Structure des Fichiers

```
avatars/
├── {userId}/
│   ├── {userId}_{timestamp}.webp
│   ├── {userId}_{timestamp}.webp
│   └── ...
├── {userId}/
│   └── {userId}_{timestamp}.webp
└── ...
```

**Exemple** :
```
avatars/
├── 123e4567-e89b-12d3-a456-426614174000/
│   ├── 123e4567-e89b-12d3-a456-426614174000_1730208900000.webp
│   └── 123e4567-e89b-12d3-a456-426614174000_1730209800000.webp
└── 789e0123-e45b-67c8-d901-234567890abc/
    └── 789e0123-e45b-67c8-d901-234567890abc_1730210000000.webp
```

---

## 🔒 Sécurité

### Bonnes Pratiques

1. **Validation côté serveur** :
   - Vérifier le type MIME
   - Vérifier la taille du fichier
   - Scanner les virus (optionnel)

2. **Nommage sécurisé** :
   - Utiliser l'UUID de l'utilisateur
   - Ajouter un timestamp
   - Éviter les caractères spéciaux

3. **Permissions strictes** :
   - Upload : Authenticated uniquement
   - Lecture : Public (avatars)
   - Mise à jour/Suppression : Owner uniquement

4. **Quotas** :
   - Limiter le nombre d'uploads par utilisateur
   - Limiter la taille totale par utilisateur
   - Nettoyer les anciens avatars

---

## 🚀 Déploiement

### Checklist Avant Production

- [ ] Bucket `avatars` créé
- [ ] Politiques RLS configurées
- [ ] Limites de taille définies (5MB)
- [ ] Types MIME autorisés configurés
- [ ] Fonction `uploadAvatar` testée
- [ ] Fonction `deleteAvatar` testée
- [ ] Intégration dans UserFormDialog testée
- [ ] URLs publiques accessibles
- [ ] Compression WebP fonctionnelle
- [ ] Gestion des erreurs implémentée

---

## 📝 Variables d'Environnement

**Fichier** : `.env.local`

```bash
# Supabase
VITE_SUPABASE_URL=https://csltuxbanvweyfzqpfap.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Storage
VITE_SUPABASE_STORAGE_URL=https://csltuxbanvweyfzqpfap.supabase.co/storage/v1
VITE_AVATARS_BUCKET=avatars
```

---

## 🐛 Dépannage

### Erreur : "new row violates row-level security policy"
**Solution** : Vérifier que les politiques RLS sont bien créées et que l'utilisateur est authentifié.

### Erreur : "File size exceeds limit"
**Solution** : Vérifier que la compression WebP fonctionne (max 400x400px, 85%).

### Erreur : "Invalid MIME type"
**Solution** : Vérifier que le fichier est bien une image (JPG, PNG, WebP, GIF).

### Avatar ne s'affiche pas
**Solution** : Vérifier que l'URL publique est correcte et que le bucket est public.

---

## 📚 Ressources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [WebP Compression](https://developers.google.com/speed/webp)

---

**Créé par**: Cascade AI  
**Date**: 29 Octobre 2025  
**Statut**: ⏳ **À CONFIGURER**
