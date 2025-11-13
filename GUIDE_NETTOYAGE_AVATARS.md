# 🧹 GUIDE NETTOYAGE AVATARS - ÉTAPE PAR ÉTAPE

**Date** : 1er novembre 2025  
**Fichier SQL** : `database/CLEANUP_INVALID_AVATARS.sql`

---

## 🎯 Objectif

Nettoyer les URLs d'avatars invalides dans la base de données et convertir les URLs complètes en chemins relatifs.

---

## 📋 Étapes à Suivre

### Étape 1 : Identifier les Avatars Invalides

**Requête** :
```sql
SELECT 
  id,
  name,
  full_name,
  email,
  avatar_url,
  CASE 
    WHEN avatar_url IS NULL THEN 'Pas d''avatar'
    WHEN avatar_url LIKE 'http%' THEN 'URL complète'
    ELSE 'Chemin relatif'
  END as type_avatar
FROM profiles
WHERE avatar_url IS NOT NULL
ORDER BY created_at DESC;
```

**Résultat attendu** :
- Liste de tous les utilisateurs avec un avatar
- Colonne `type_avatar` indique le format

**Action** :
- ✅ Notez combien d'utilisateurs ont des "URL complète"
- ✅ Ce sont ceux qui doivent être convertis

---

### Étape 2 : Convertir URLs Complètes → Chemins Relatifs

**Requête** :
```sql
UPDATE profiles
SET avatar_url = SUBSTRING(avatar_url FROM 'avatars/(.+)$')
WHERE avatar_url LIKE '%/storage/v1/object/public/avatars/%'
  AND avatar_url LIKE 'http%';
```

**Ce que ça fait** :
- Transforme : `https://xxx.supabase.co/storage/v1/object/public/avatars/user-123/avatar.webp`
- En : `user-123/avatar.webp`

**Action** :
- ✅ Exécutez cette requête
- ✅ Notez le nombre de lignes mises à jour

---

### Étape 3 : Vérifier le Résultat

**Requête** :
```sql
SELECT 
  id,
  name,
  avatar_url,
  CASE 
    WHEN avatar_url LIKE 'http%' THEN '❌ Encore une URL complète'
    WHEN avatar_url LIKE '%/%' THEN '✅ Chemin relatif valide'
    ELSE '⚠️ Format inconnu'
  END as statut
FROM profiles
WHERE avatar_url IS NOT NULL;
```

**Résultat attendu** :
- Tous les avatars doivent être "✅ Chemin relatif valide"
- Si vous voyez "❌ Encore une URL complète", relancez l'Étape 2

**Action** :
- ✅ Vérifiez que tous les avatars sont au bon format

---

### Étape 4 : Nettoyer les Avatars Orphelins (Optionnel)

**⚠️ ATTENTION** : Cette étape est optionnelle et nécessite une vérification manuelle.

**Cas d'usage** : Vous savez qu'un utilisateur a un `avatar_url` dans la BDD mais le fichier n'existe pas dans le bucket Supabase.

**Comment vérifier** :
1. Aller dans Supabase → Storage → avatars
2. Chercher le dossier de l'utilisateur (ex: `user-123`)
3. Si le fichier n'existe pas, notez l'UUID de l'utilisateur

**Requête (à adapter)** :
```sql
-- ⚠️ Remplacer par l'UUID réel de l'utilisateur
UPDATE profiles
SET avatar_url = NULL
WHERE id = '00000000-0000-0000-0000-000000000000';
```

**Exemple réel** :
```sql
-- Si l'utilisateur avec l'UUID ci-dessous n'a pas de fichier dans le bucket
UPDATE profiles
SET avatar_url = NULL
WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
```

**Action** :
- ⚠️ Seulement si nécessaire
- ✅ Remplacez l'UUID fictif par un UUID réel
- ✅ Exécutez la requête

---

### Étape 5 : Standardiser le Format

**Requête** :
```sql
UPDATE profiles
SET avatar_url = TRIM(avatar_url)
WHERE avatar_url IS NOT NULL
  AND avatar_url != TRIM(avatar_url);
```

**Ce que ça fait** :
- Supprime les espaces avant/après le chemin
- Ex: `" user-123/avatar.webp "` → `"user-123/avatar.webp"`

**Action** :
- ✅ Exécutez cette requête

---

### Étape 6 : Rapport Final

**Requête 1 : Statistiques**
```sql
SELECT 
  COUNT(*) as total_utilisateurs,
  COUNT(avatar_url) as avec_avatar,
  COUNT(*) - COUNT(avatar_url) as sans_avatar,
  ROUND(COUNT(avatar_url)::numeric / COUNT(*)::numeric * 100, 2) as pourcentage_avec_avatar
FROM profiles;
```

**Résultat attendu** :
```
total_utilisateurs | avec_avatar | sans_avatar | pourcentage_avec_avatar
------------------+-------------+-------------+------------------------
        100       |      45     |      55     |         45.00
```

**Requête 2 : Liste des utilisateurs avec avatar**
```sql
SELECT 
  id,
  name,
  full_name,
  email,
  avatar_url,
  created_at
FROM profiles
WHERE avatar_url IS NOT NULL
ORDER BY created_at DESC;
```

**Action** :
- ✅ Vérifiez les statistiques
- ✅ Notez le pourcentage d'utilisateurs avec avatar

---

## ✅ Checklist Finale

Après avoir exécuté toutes les étapes :

- [ ] Tous les avatars sont au format chemin relatif (ex: `user-id/avatar.webp`)
- [ ] Aucun avatar n'a d'URL complète (ex: `https://...`)
- [ ] Les statistiques sont affichées
- [ ] Les avatars s'affichent correctement dans l'application

---

## 🧪 Test dans l'Application

### Test 1 : Page Utilisateurs
1. Aller sur **Utilisateurs**
2. ✅ Tous les avatars s'affichent (ou initiales)
3. ✅ Aucun avatar cassé (icône cassée)

### Test 2 : Dashboard
1. Aller sur **Dashboard**
2. ✅ Avatar affiché dans WelcomeCard

### Test 3 : Profil
1. Aller sur **Profil**
2. ✅ Avatar affiché
3. Upload un nouvel avatar
4. ✅ Avatar mis à jour
5. Vérifier dans la BDD :
```sql
SELECT avatar_url FROM profiles WHERE id = 'votre-user-id';
-- Attendu: "user-id/avatar.webp" (chemin relatif)
```

---

## 🐛 Résolution de Problèmes

### Erreur : "invalid input syntax for type uuid"

**Cause** : Vous avez essayé d'exécuter une requête avec un UUID fictif (ex: `'user-id-sans-avatar'`)

**Solution** :
1. Les requêtes avec des UUIDs fictifs sont **commentées** (commencent par `--`)
2. Ne les exécutez que si vous avez un UUID réel
3. Remplacez l'UUID fictif par un UUID réel de votre BDD

**Exemple** :
```sql
-- ❌ NE PAS EXÉCUTER TEL QUEL
UPDATE profiles SET avatar_url = NULL WHERE id = 'user-id-sans-avatar';

-- ✅ ADAPTER AVEC UN UUID RÉEL
UPDATE profiles SET avatar_url = NULL WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
```

### Erreur : "relation profiles does not exist"

**Cause** : Vous n'êtes pas connecté à la bonne base de données

**Solution** :
1. Vérifiez que vous êtes dans Supabase SQL Editor
2. Sélectionnez le bon projet
3. Réessayez

### Avatars ne s'affichent toujours pas

**Cause** : Le fichier n'existe pas dans le bucket

**Solution** :
1. Aller dans Supabase → Storage → avatars
2. Vérifier que le fichier existe
3. Si non, mettre `avatar_url` à NULL pour cet utilisateur

---

## 📊 Exemple de Résultat

### Avant le Nettoyage
```sql
id                                   | avatar_url
-------------------------------------+----------------------------------------------------------
a1b2c3d4-e5f6-7890-abcd-ef1234567890 | https://xxx.supabase.co/storage/v1/object/public/avatars/a1b2c3d4-e5f6-7890-abcd-ef1234567890/avatar.webp
b2c3d4e5-f6a7-8901-bcde-f12345678901 | https://xxx.supabase.co/storage/v1/object/public/avatars/b2c3d4e5-f6a7-8901-bcde-f12345678901/avatar.png
c3d4e5f6-a7b8-9012-cdef-123456789012 | c3d4e5f6-a7b8-9012-cdef-123456789012/avatar.webp
```

### Après le Nettoyage
```sql
id                                   | avatar_url
-------------------------------------+----------------------------------------------------------
a1b2c3d4-e5f6-7890-abcd-ef1234567890 | a1b2c3d4-e5f6-7890-abcd-ef1234567890/avatar.webp
b2c3d4e5-f6a7-8901-bcde-f12345678901 | b2c3d4e5-f6a7-8901-bcde-f12345678901/avatar.png
c3d4e5f6-a7b8-9012-cdef-123456789012 | c3d4e5f6-a7b8-9012-cdef-123456789012/avatar.webp
```

✅ **Tous les avatars sont maintenant au format chemin relatif !**

---

## 🎯 Résumé

1. **Identifier** : Voir quels avatars sont au mauvais format
2. **Convertir** : Transformer URLs complètes → chemins relatifs
3. **Vérifier** : S'assurer que tout est au bon format
4. **Nettoyer** (optionnel) : Supprimer les avatars orphelins
5. **Standardiser** : Supprimer les espaces
6. **Rapport** : Voir les statistiques finales

**Temps estimé** : 5-10 minutes

**Difficulté** : Facile (juste copier-coller les requêtes)

**Impact** : ✅ Avatars 100% fonctionnels et optimisés !
