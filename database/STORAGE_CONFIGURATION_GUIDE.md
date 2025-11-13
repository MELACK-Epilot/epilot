# 📦 Guide de configuration Supabase Storage - Module Communication

## 🎯 Vue d'ensemble

Ce guide explique comment configurer les 3 buckets Supabase Storage pour le module Communication :
1. **social-feed** - Fichiers des publications (images, vidéos, documents)
2. **messages** - Pièces jointes de la messagerie
3. **tickets** - Fichiers joints aux tickets de support

---

## 📋 Prérequis

- ✅ Compte Supabase actif
- ✅ Projet E-Pilot créé
- ✅ Schémas SQL Communication installés
- ✅ Tables `users`, `posts`, `messages`, `tickets` existantes

---

## 🗄️ Étape 1 : Créer les buckets

### **1.1 Accéder à Storage**

1. Ouvrir **Supabase Dashboard**
2. Sélectionner votre projet E-Pilot
3. Aller dans **Storage** (menu latéral)

### **1.2 Créer le bucket social-feed**

1. Cliquer sur **New bucket**
2. Remplir les informations :
   - **Name** : `social-feed`
   - **Public bucket** : ✅ Coché (pour permettre l'accès public aux publications)
   - **File size limit** : `10 MB` (10 Mo par fichier)
   - **Allowed MIME types** : 
     - `image/jpeg`
     - `image/png`
     - `image/gif`
     - `image/webp`
     - `video/mp4`
     - `video/webm`
     - `application/pdf`
     - `application/msword`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
3. Cliquer sur **Create bucket**

### **1.3 Créer le bucket messages**

1. Cliquer sur **New bucket**
2. Remplir les informations :
   - **Name** : `messages`
   - **Public bucket** : ❌ Non coché (accès privé, seulement participants)
   - **File size limit** : `10 MB`
   - **Allowed MIME types** : Mêmes que social-feed
3. Cliquer sur **Create bucket**

### **1.4 Créer le bucket tickets**

1. Cliquer sur **New bucket**
2. Remplir les informations :
   - **Name** : `tickets`
   - **Public bucket** : ❌ Non coché (accès privé, seulement participants)
   - **File size limit** : `10 MB`
   - **Allowed MIME types** : Mêmes que social-feed
3. Cliquer sur **Create bucket**

---

## 🔐 Étape 2 : Configurer les politiques RLS

### **2.1 Politiques pour social-feed**

Aller dans **Storage** → **Policies** → Sélectionner `social-feed`

#### **Politique 1 : Lecture publique**
```sql
-- Nom : Public can view social feed files
-- Operation : SELECT
-- Policy definition :
CREATE POLICY "Public can view social feed files"
ON storage.objects FOR SELECT
USING (bucket_id = 'social-feed');
```

#### **Politique 2 : Upload authentifié**
```sql
-- Nom : Authenticated users can upload to social feed
-- Operation : INSERT
-- Policy definition :
CREATE POLICY "Authenticated users can upload to social feed"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'social-feed' 
  AND auth.role() = 'authenticated'
);
```

#### **Politique 3 : Suppression par le propriétaire**
```sql
-- Nom : Users can delete their own social feed files
-- Operation : DELETE
-- Policy definition :
CREATE POLICY "Users can delete their own social feed files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'social-feed' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Structure des chemins** : `{user_id}/{post_id}/{timestamp}_{filename}`

---

### **2.2 Politiques pour messages**

Aller dans **Storage** → **Policies** → Sélectionner `messages`

#### **Politique 1 : Lecture par participants**
```sql
-- Nom : Conversation participants can view message files
-- Operation : SELECT
-- Policy definition :
CREATE POLICY "Conversation participants can view message files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'messages'
  AND EXISTS (
    SELECT 1 
    FROM conversation_participants cp
    WHERE cp.conversation_id::text = (storage.foldername(name))[1]
      AND cp.user_id = auth.uid()
      AND cp.left_at IS NULL
  )
);
```

#### **Politique 2 : Upload par participants**
```sql
-- Nom : Conversation participants can upload message files
-- Operation : INSERT
-- Policy definition :
CREATE POLICY "Conversation participants can upload message files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'messages' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 
    FROM conversation_participants cp
    WHERE cp.conversation_id::text = (storage.foldername(name))[1]
      AND cp.user_id = auth.uid()
      AND cp.left_at IS NULL
  )
);
```

#### **Politique 3 : Suppression par l'uploader**
```sql
-- Nom : Users can delete their own message files
-- Operation : DELETE
-- Policy definition :
CREATE POLICY "Users can delete their own message files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'messages' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);
```

**Structure des chemins** : `{conversation_id}/{user_id}/{timestamp}_{filename}`

---

### **2.3 Politiques pour tickets**

Aller dans **Storage** → **Policies** → Sélectionner `tickets`

#### **Politique 1 : Lecture par participants**
```sql
-- Nom : Ticket participants can view ticket files
-- Operation : SELECT
-- Policy definition :
CREATE POLICY "Ticket participants can view ticket files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'tickets'
  AND (
    -- Créateur du ticket
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id::text = (storage.foldername(name))[1]
        AND t.created_by = auth.uid()
    )
    OR
    -- Assigné au ticket
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id::text = (storage.foldername(name))[1]
        AND t.assigned_to = auth.uid()
    )
    OR
    -- Observateur du ticket
    EXISTS (
      SELECT 1 FROM ticket_watchers tw
      WHERE tw.ticket_id::text = (storage.foldername(name))[1]
        AND tw.user_id = auth.uid()
    )
  )
);
```

#### **Politique 2 : Upload par participants**
```sql
-- Nom : Ticket participants can upload ticket files
-- Operation : INSERT
-- Policy definition :
CREATE POLICY "Ticket participants can upload ticket files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tickets' 
  AND auth.role() = 'authenticated'
  AND (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id::text = (storage.foldername(name))[1]
        AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM ticket_watchers tw
      WHERE tw.ticket_id::text = (storage.foldername(name))[1]
        AND tw.user_id = auth.uid()
    )
  )
);
```

#### **Politique 3 : Suppression par l'uploader**
```sql
-- Nom : Users can delete their own ticket files
-- Operation : DELETE
-- Policy definition :
CREATE POLICY "Users can delete their own ticket files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'tickets' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);
```

**Structure des chemins** : `{ticket_id}/{user_id}/{timestamp}_{filename}`

---

## ✅ Étape 3 : Vérification

### **3.1 Vérifier les buckets**

```sql
-- Lister tous les buckets
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE name IN ('social-feed', 'messages', 'tickets');
```

**Résultat attendu** :
| id | name | public | file_size_limit | allowed_mime_types |
|----|------|--------|-----------------|-------------------|
| ... | social-feed | true | 10485760 | {...} |
| ... | messages | false | 10485760 | {...} |
| ... | tickets | false | 10485760 | {...} |

### **3.2 Vérifier les politiques RLS**

```sql
-- Compter les politiques par bucket
SELECT 
  bucket_id,
  COUNT(*) as policies_count
FROM storage.policies
WHERE bucket_id IN ('social-feed', 'messages', 'tickets')
GROUP BY bucket_id;
```

**Résultat attendu** :
| bucket_id | policies_count |
|-----------|----------------|
| social-feed | 3 |
| messages | 3 |
| tickets | 3 |

### **3.3 Test d'upload (via code)**

```typescript
// Test upload social-feed
const testUploadSocialFeed = async () => {
  const file = new File(['test'], 'test.txt', { type: 'text/plain' });
  const userId = 'user-id';
  const postId = 'post-id';
  const filePath = `${userId}/${postId}/${Date.now()}_test.txt`;
  
  const { data, error } = await supabase.storage
    .from('social-feed')
    .upload(filePath, file);
  
  console.log('Upload result:', { data, error });
};

// Test upload messages
const testUploadMessages = async () => {
  const file = new File(['test'], 'test.txt', { type: 'text/plain' });
  const conversationId = 'conversation-id';
  const userId = 'user-id';
  const filePath = `${conversationId}/${userId}/${Date.now()}_test.txt`;
  
  const { data, error } = await supabase.storage
    .from('messages')
    .upload(filePath, file);
  
  console.log('Upload result:', { data, error });
};

// Test upload tickets
const testUploadTickets = async () => {
  const file = new File(['test'], 'test.txt', { type: 'text/plain' });
  const ticketId = 'ticket-id';
  const userId = 'user-id';
  const filePath = `${ticketId}/${userId}/${Date.now()}_test.txt`;
  
  const { data, error } = await supabase.storage
    .from('tickets')
    .upload(filePath, file);
  
  console.log('Upload result:', { data, error });
};
```

---

## 📊 Structures des chemins

### **Social Feed**
```
social-feed/
├── {user_id}/
│   ├── {post_id}/
│   │   ├── {timestamp}_image1.jpg
│   │   ├── {timestamp}_video.mp4
│   │   └── {timestamp}_document.pdf
```

**Exemple** : `social-feed/abc123/post456/1730304000000_photo.jpg`

### **Messages**
```
messages/
├── {conversation_id}/
│   ├── {user_id}/
│   │   ├── {timestamp}_attachment1.pdf
│   │   ├── {timestamp}_image.png
│   │   └── {timestamp}_document.docx
```

**Exemple** : `messages/conv789/user123/1730304000000_contract.pdf`

### **Tickets**
```
tickets/
├── {ticket_id}/
│   ├── {user_id}/
│   │   ├── {timestamp}_screenshot.png
│   │   ├── {timestamp}_log.txt
│   │   └── {timestamp}_report.pdf
```

**Exemple** : `tickets/ticket999/user456/1730304000000_bug_screenshot.png`

---

## 🔧 Fonctions utiles

### **Obtenir l'URL publique**

```typescript
// Social Feed (public)
const { data } = supabase.storage
  .from('social-feed')
  .getPublicUrl(filePath);

console.log('Public URL:', data.publicUrl);
```

### **Obtenir l'URL signée (privée)**

```typescript
// Messages ou Tickets (privé)
const { data, error } = await supabase.storage
  .from('messages')
  .createSignedUrl(filePath, 3600); // Expire dans 1h

console.log('Signed URL:', data?.signedUrl);
```

### **Lister les fichiers**

```typescript
// Lister les fichiers d'un post
const { data, error } = await supabase.storage
  .from('social-feed')
  .list(`${userId}/${postId}`);

console.log('Files:', data);
```

### **Supprimer un fichier**

```typescript
// Supprimer un fichier
const { error } = await supabase.storage
  .from('social-feed')
  .remove([filePath]);

console.log('Delete result:', error);
```

---

## 🆘 Dépannage

### **Erreur : "new row violates row-level security policy"**

**Cause** : Les politiques RLS ne sont pas correctement configurées.

**Solution** :
1. Vérifier que l'utilisateur est authentifié
2. Vérifier que le chemin du fichier respecte la structure attendue
3. Vérifier que l'utilisateur a les permissions nécessaires (participant, créateur, etc.)

### **Erreur : "Bucket not found"**

**Cause** : Le bucket n'existe pas ou le nom est incorrect.

**Solution** :
1. Vérifier l'orthographe du nom du bucket
2. Créer le bucket s'il n'existe pas

### **Erreur : "File size exceeds limit"**

**Cause** : Le fichier dépasse la limite de 10 MB.

**Solution** :
1. Compresser le fichier
2. Augmenter la limite dans les paramètres du bucket (si nécessaire)

### **Erreur : "Invalid MIME type"**

**Cause** : Le type de fichier n'est pas autorisé.

**Solution** :
1. Vérifier les types MIME autorisés dans les paramètres du bucket
2. Ajouter le type MIME manquant

---

## ✅ Checklist finale

- [ ] Bucket `social-feed` créé (public)
- [ ] Bucket `messages` créé (privé)
- [ ] Bucket `tickets` créé (privé)
- [ ] 3 politiques RLS configurées pour `social-feed`
- [ ] 3 politiques RLS configurées pour `messages`
- [ ] 3 politiques RLS configurées pour `tickets`
- [ ] Limites de taille configurées (10 MB)
- [ ] Types MIME autorisés configurés
- [ ] Tests d'upload réussis pour chaque bucket
- [ ] Tests de lecture réussis
- [ ] Tests de suppression réussis

---

## 📈 Monitoring

### **Surveiller l'utilisation du Storage**

```sql
-- Taille totale par bucket
SELECT 
  bucket_id,
  COUNT(*) as files_count,
  SUM(metadata->>'size')::bigint as total_size_bytes,
  ROUND(SUM(metadata->>'size')::bigint / 1024.0 / 1024.0, 2) as total_size_mb
FROM storage.objects
WHERE bucket_id IN ('social-feed', 'messages', 'tickets')
GROUP BY bucket_id;
```

### **Fichiers les plus volumineux**

```sql
-- Top 10 des fichiers les plus gros
SELECT 
  bucket_id,
  name,
  (metadata->>'size')::bigint as size_bytes,
  ROUND((metadata->>'size')::bigint / 1024.0 / 1024.0, 2) as size_mb,
  created_at
FROM storage.objects
WHERE bucket_id IN ('social-feed', 'messages', 'tickets')
ORDER BY (metadata->>'size')::bigint DESC
LIMIT 10;
```

---

**Date** : 30 octobre 2025  
**Auteur** : E-Pilot Congo 🇨🇬  
**Statut** : ✅ PRÊT POUR CONFIGURATION
