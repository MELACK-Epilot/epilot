# 🔧 GUIDE DE RÉSOLUTION - ERREURS RLS

## 🔴 Erreurs Rencontrées

1. **StorageApiError: new row violates row-level security policy**
   - L'upload du logo est bloqué par les politiques RLS du bucket Storage

2. **Failed to load resource: 400**
   - L'insertion dans la table schools est bloquée par les politiques RLS

---

## 📋 SOLUTION RAPIDE (3 étapes)

### Étape 1 : Diagnostic (30 secondes)

1. Ouvrir **Supabase Dashboard** → **SQL Editor**
2. Copier-coller le contenu de :
   ```
   database/DIAGNOSTIC_RLS.sql
   ```
3. Cliquer **Run**
4. Noter les résultats

### Étape 2 : Correction (1 minute)

1. Dans **Supabase SQL Editor**
2. Copier-coller le contenu de :
   ```
   database/FIX_RLS_POLICIES.sql
   ```
3. Cliquer **Run**
4. Attendre le message de succès

### Étape 3 : Test (30 secondes)

1. Retourner dans votre application
2. Recharger la page (F5)
3. Essayer de créer une école avec un logo
4. ✅ Ça devrait fonctionner !

---

## 🔍 EXPLICATION DES ERREURS

### Erreur 1 : Row-Level Security sur Storage

**Cause** : Les politiques RLS du bucket `school-logos` sont trop restrictives ou mal configurées.

**Symptôme** :
```
StorageApiError: new row violates row-level security policy
```

**Solution** : Le script `FIX_RLS_POLICIES.sql` crée des politiques permissives pour les utilisateurs authentifiés.

### Erreur 2 : Row-Level Security sur Table Schools

**Cause** : La table `schools` a RLS activé mais les politiques n'autorisent pas l'insertion.

**Symptôme** :
```
Failed to load resource: the server responded with a status of 400
```

**Solution** : Le script crée des politiques INSERT/UPDATE/DELETE pour les utilisateurs authentifiés.

---

## 🛠️ SOLUTIONS ALTERNATIVES

### Solution A : Politiques Permissives (RECOMMANDÉ pour développement)

Le script `FIX_RLS_POLICIES.sql` crée des politiques qui autorisent :
- ✅ Lecture publique des logos
- ✅ Upload pour utilisateurs authentifiés
- ✅ CRUD complet sur la table schools pour utilisateurs authentifiés

### Solution B : Désactiver RLS Temporairement (DÉVELOPPEMENT UNIQUEMENT)

Si les politiques ne fonctionnent toujours pas :

```sql
-- Désactiver RLS sur la table schools
ALTER TABLE schools DISABLE ROW LEVEL SECURITY;

-- Rendre le bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'school-logos';
```

⚠️ **ATTENTION** : Ne jamais faire ça en production !

### Solution C : Politiques Basées sur le Rôle (PRODUCTION)

Pour la production, créer des politiques basées sur le rôle de l'utilisateur :

```sql
-- Exemple : Seuls les admin_groupe peuvent créer des écoles
CREATE POLICY "Admin groupe can insert schools"
ON schools FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt() ->> 'role' = 'group_admin'
  AND school_group_id = (auth.jwt() ->> 'school_group_id')::uuid
);
```

---

## 📊 VÉRIFICATION POST-CORRECTION

Après avoir exécuté `FIX_RLS_POLICIES.sql`, vérifier :

### 1. Bucket Storage
```sql
SELECT id, name, public FROM storage.buckets WHERE id = 'school-logos';
```
**Attendu** : `public = true`

### 2. Politiques Storage
```sql
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
AND policyname LIKE '%school%';
```
**Attendu** : 4 politiques (SELECT, INSERT, UPDATE, DELETE)

### 3. Politiques Schools
```sql
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'schools' AND schemaname = 'public';
```
**Attendu** : 4 politiques (SELECT, INSERT, UPDATE, DELETE)

---

## 🧪 TEST FINAL

1. Ouvrir l'application
2. Aller sur la page Écoles
3. Cliquer "+ Nouvelle école"
4. Remplir le formulaire :
   - Nom : "École Test RLS"
   - Code : "TEST-001"
   - Département : "Brazzaville"
   - Ville : "Brazzaville"
   - **Upload un logo** (< 2 MB)
5. Cliquer "Créer l'école"
6. ✅ **Succès attendu** : "École créée avec succès"

---

## ❓ SI ÇA NE FONCTIONNE TOUJOURS PAS

### Vérifier l'authentification

```sql
-- Vérifier que l'utilisateur est bien authentifié
SELECT auth.uid(), auth.jwt();
```

Si `auth.uid()` retourne `NULL`, l'utilisateur n'est pas authentifié.

### Vérifier les logs Supabase

1. Aller dans **Supabase Dashboard**
2. Cliquer sur **Logs** → **API Logs**
3. Chercher les erreurs 400
4. Lire le message d'erreur détaillé

### Désactiver RLS temporairement

En dernier recours, pour débloquer le développement :

```sql
ALTER TABLE schools DISABLE ROW LEVEL SECURITY;
```

Puis réactiver plus tard avec des politiques appropriées.

---

## 📝 NOTES IMPORTANTES

### Pour le Développement
- ✅ Politiques permissives OK
- ✅ RLS peut être désactivé temporairement
- ✅ Bucket peut être public

### Pour la Production
- ⚠️ Politiques strictes basées sur les rôles
- ⚠️ RLS doit être activé
- ⚠️ Bucket peut rester public (logos visibles par tous)
- ⚠️ Mais upload limité aux utilisateurs autorisés

---

## 🎯 RÉSULTAT ATTENDU

Après correction, vous devriez pouvoir :
- ✅ Upload des logos sans erreur
- ✅ Créer des écoles avec tous les champs
- ✅ Voir les logos uploadés
- ✅ Modifier et supprimer des écoles

**Le formulaire sera 100% fonctionnel !** 🚀
