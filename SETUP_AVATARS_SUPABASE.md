# 📸 Configuration Upload Avatars - Supabase Storage

**Date** : 1er novembre 2025  
**Statut** : Guide de configuration

---

## 🎯 Objectif

Permettre l'upload et l'affichage des photos de profil (avatars) des utilisateurs.

---

## 📋 Étapes de Configuration

### 1. Créer le Bucket dans Supabase

1. **Aller dans Supabase Dashboard**
   - URL : https://csltuxbanvweyfzqpfap.supabase.co
   - Section : **Storage**

2. **Créer un nouveau bucket**
   ```
   Nom : avatars
   Public : ✅ OUI (pour afficher les images)
   File size limit : 2MB
   Allowed MIME types : image/jpeg, image/png, image/webp
   ```

3. **Cliquer sur "Create bucket"**

---

### 2. Configurer les Politiques RLS

Exécuter dans **SQL Editor** :

```sql
-- Politique : Tout le monde peut voir les avatars
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Politique : Les utilisateurs authentifiés peuvent uploader leur avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique : Les utilisateurs peuvent mettre à jour leur avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique : Les utilisateurs peuvent supprimer leur avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

### 3. Upload Manuel d'un Avatar (Temporaire)

Pour tester immédiatement :

1. **Aller dans Storage → avatars**
2. **Cliquer "Upload file"**
3. **Créer un dossier** avec l'UUID de l'utilisateur
   ```
   Dossier : e282395e-2bd9-4468-b840-f462753a0bda
   ```
4. **Uploader une photo** dans ce dossier
   ```
   Nom : avatar.jpg
   ```

5. **Copier l'URL publique**
   ```
   https://csltuxbanvweyfzqpfap.supabase.co/storage/v1/object/public/avatars/e282395e-2bd9-4468-b840-f462753a0bda/avatar.jpg
   ```

6. **Mettre à jour la base de données**
   ```sql
   UPDATE users
   SET avatar = 'https://csltuxbanvweyfzqpfap.supabase.co/storage/v1/object/public/avatars/e282395e-2bd9-4468-b840-f462753a0bda/avatar.jpg'
   WHERE id = 'e282395e-2bd9-4468-b840-f462753a0bda';
   ```

---

### 4. Vérifier l'Affichage

1. **Se déconnecter** de l'application
2. **Se reconnecter** avec `int@epilot.com`
3. **Vérifier** :
   - ✅ Photo dans la WelcomeCard (en haut à droite)
   - ✅ Photo dans le header (dropdown utilisateur)
   - ✅ Photo dans le DashboardLayout

---

## 🔧 Composant Upload Avatar (À implémenter)

### Fichier : `src/components/AvatarUpload.tsx`

```typescript
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AvatarUpload = () => {
  const { user, setUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(user?.avatar || null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Mettre à jour la base de données
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar: publicUrl })
        .eq('id', user?.id);

      if (updateError) {
        throw updateError;
      }

      // Mettre à jour le store local
      if (user) {
        setUser({ ...user, avatar: publicUrl });
      }
      
      setPreview(publicUrl);
      alert('Avatar mis à jour avec succès !');
    } catch (error) {
      console.error('Erreur upload avatar:', error);
      alert('Erreur lors de l\'upload de l\'avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setUploading(true);

      // Supprimer de Supabase Storage
      const filePath = `${user?.id}/avatar.jpg`;
      await supabase.storage.from('avatars').remove([filePath]);

      // Mettre à jour la base de données
      await supabase
        .from('users')
        .update({ avatar: null })
        .eq('id', user?.id);

      // Mettre à jour le store local
      if (user) {
        setUser({ ...user, avatar: undefined });
      }
      
      setPreview(null);
      alert('Avatar supprimé avec succès !');
    } catch (error) {
      console.error('Erreur suppression avatar:', error);
      alert('Erreur lors de la suppression de l\'avatar');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Preview */}
      <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200">
        {preview ? (
          <>
            <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              disabled={uploading}
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1D3557] to-[#2A9D8F] flex items-center justify-center text-white text-4xl font-bold">
            {user?.firstName?.[0] || 'U'}
          </div>
        )}
      </div>

      {/* Upload Button */}
      <label htmlFor="avatar-upload">
        <Button disabled={uploading} asChild>
          <span className="cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Upload en cours...' : 'Changer la photo'}
          </span>
        </Button>
      </label>
      <input
        id="avatar-upload"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleUpload}
        className="hidden"
        disabled={uploading}
      />

      <p className="text-xs text-gray-500">
        JPG, PNG ou WebP. Max 2MB.
      </p>
    </div>
  );
};
```

---

## 📝 Utilisation dans la Page Profil

```typescript
import { AvatarUpload } from '@/components/AvatarUpload';

export const ProfilePage = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Mon Profil</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Photo de profil</h2>
        <AvatarUpload />
      </div>
      
      {/* Autres informations du profil */}
    </div>
  );
};
```

---

## ✅ Checklist

### Configuration Supabase
- [ ] Créer le bucket `avatars`
- [ ] Configurer comme public
- [ ] Ajouter les politiques RLS

### Test Manuel
- [ ] Uploader une photo de test
- [ ] Mettre à jour la BDD
- [ ] Vérifier l'affichage

### Composant Upload (Optionnel)
- [ ] Créer `AvatarUpload.tsx`
- [ ] Intégrer dans la page Profil
- [ ] Tester l'upload
- [ ] Tester la suppression

---

## 🎯 Résultat Attendu

**Avant** :
```
┌────┐
│ R  │  Initiale affichée
└────┘
```

**Après** :
```
┌──────────┐
│ [PHOTO]  │  Photo réelle affichée
└──────────┘
```

---

**Configuration rapide : 5 minutes** ⏱️  
**Composant upload complet : 30 minutes** ⏱️
