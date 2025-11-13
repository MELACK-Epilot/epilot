-- ============================================================================
-- VÉRIFICATION CONFIGURATION AVATARS
-- ============================================================================
-- Ce script vérifie que tout est correctement configuré pour les avatars
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : VÉRIFIER LE BUCKET AVATARS
-- ============================================================================

-- Vérifier si le bucket 'avatars' existe
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'avatars';

-- Résultat attendu :
-- id: avatars
-- public: true
-- file_size_limit: 2097152 (2 MB)
-- allowed_mime_types: {image/jpeg, image/jpg, image/png, image/webp, image/gif}

-- ============================================================================
-- ÉTAPE 2 : VÉRIFIER LES POLITIQUES RLS DU BUCKET
-- ============================================================================

-- Vérifier les politiques sur storage.objects
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (policyname LIKE '%avatar%' OR qual LIKE '%avatars%')
ORDER BY cmd;

-- Résultat attendu :
-- Au moins 2 politiques :
-- 1. SELECT (lecture publique) : bucket_id = 'avatars'
-- 2. INSERT (upload authentifié) : bucket_id = 'avatars'

-- ============================================================================
-- ÉTAPE 3 : VÉRIFIER LES FICHIERS DANS LE BUCKET
-- ============================================================================

-- Lister tous les fichiers dans le bucket avatars
SELECT 
  name,
  id,
  bucket_id,
  owner,
  created_at,
  updated_at,
  last_accessed_at,
  metadata
FROM storage.objects 
WHERE bucket_id = 'avatars'
ORDER BY created_at DESC;

-- Si vide : Aucun avatar uploadé pour le moment (normal)
-- Si des fichiers : Liste des avatars existants

-- ============================================================================
-- ÉTAPE 4 : VÉRIFIER LES UTILISATEURS
-- ============================================================================

-- Voir tous les utilisateurs et leur statut avatar
SELECT 
  id,
  name,
  full_name,
  email,
  role,
  avatar_url,
  CASE 
    WHEN avatar_url IS NULL THEN '❌ Pas d''avatar'
    WHEN avatar_url LIKE 'http%' THEN '⚠️ URL complète (à convertir)'
    WHEN avatar_url LIKE '%/%' THEN '✅ Chemin relatif (correct)'
    ELSE '⚠️ Format inconnu'
  END as statut_avatar,
  created_at
FROM profiles
ORDER BY created_at DESC;

-- ============================================================================
-- ÉTAPE 5 : STATISTIQUES
-- ============================================================================

-- Statistiques des avatars
SELECT 
  COUNT(*) as total_utilisateurs,
  COUNT(avatar_url) as avec_avatar,
  COUNT(*) - COUNT(avatar_url) as sans_avatar,
  ROUND(
    CASE 
      WHEN COUNT(*) > 0 THEN COUNT(avatar_url)::numeric / COUNT(*)::numeric * 100
      ELSE 0
    END, 
    2
  ) as pourcentage_avec_avatar
FROM profiles;

-- ============================================================================
-- DIAGNOSTIC COMPLET
-- ============================================================================

-- Résumé de la configuration
SELECT 
  'Bucket avatars' as element,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') 
    THEN '✅ Existe'
    ELSE '❌ N''existe pas - Exécuter SETUP_AVATARS_BUCKET.sql'
  END as statut
UNION ALL
SELECT 
  'Bucket public',
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars' AND public = true) 
    THEN '✅ Oui'
    ELSE '❌ Non - Le bucket doit être public'
  END
UNION ALL
SELECT 
  'Politique SELECT',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND cmd = 'SELECT'
        AND qual LIKE '%avatars%'
    ) 
    THEN '✅ Existe'
    ELSE '❌ Manquante - Exécuter SETUP_AVATARS_BUCKET.sql'
  END
UNION ALL
SELECT 
  'Politique INSERT',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND cmd = 'INSERT'
        AND with_check LIKE '%avatars%'
    ) 
    THEN '✅ Existe'
    ELSE '❌ Manquante - Exécuter SETUP_AVATARS_BUCKET.sql'
  END
UNION ALL
SELECT 
  'Utilisateurs avec avatar',
  CONCAT(
    COUNT(avatar_url)::text, 
    ' / ', 
    COUNT(*)::text,
    ' (',
    ROUND(
      CASE 
        WHEN COUNT(*) > 0 THEN COUNT(avatar_url)::numeric / COUNT(*) * 100
        ELSE 0
      END,
      0
    )::text,
    '%)'
  )
FROM profiles;

-- ============================================================================
-- NOTES
-- ============================================================================

/*
✅ TOUT EST OK SI :
- Bucket avatars existe
- Bucket est public (public = true)
- Politique SELECT existe (lecture publique)
- Politique INSERT existe (upload authentifié)

❌ ACTIONS NÉCESSAIRES SI :
- Bucket n'existe pas → Exécuter SETUP_AVATARS_BUCKET.sql
- Politiques manquantes → Exécuter SETUP_AVATARS_BUCKET.sql
- Bucket non public → Modifier avec : 
  UPDATE storage.buckets SET public = true WHERE id = 'avatars';

📝 APRÈS VÉRIFICATION :
1. Si tout est OK → Tester l'upload dans l'application
2. Si des éléments manquent → Exécuter SETUP_AVATARS_BUCKET.sql
3. Revenir sur cette vérification après correction
*/
