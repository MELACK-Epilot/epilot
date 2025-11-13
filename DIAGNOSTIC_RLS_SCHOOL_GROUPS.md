# 🔍 DIAGNOSTIC RLS - SCHOOL_GROUPS

**Date** : 2 Novembre 2025  
**Problème** : `dataLength: 0` malgré les données dans la table  
**Cause probable** : **Row Level Security (RLS)**

---

## 🎯 DIAGNOSTIC

### Symptômes
```
📊 useSchoolGroups: Résultat requête: {
  error: undefined,
  dataLength: 0,
  data: [],
  firstItem: undefined
}
```

### Données confirmées dans Supabase
```sql
SELECT id, name, code, status FROM school_groups;

-- Résultat : 2 groupes
1. INTELLIGENCE CELESTE (E-PILOT-002) - active
2. LAMARELLE (E-PILOT-003) - active
```

### Conclusion
✅ Table existe  
✅ Données présentes  
❌ **RLS bloque l'accès depuis l'application**

---

## 🔐 PROBLÈME RLS

### Qu'est-ce que RLS ?
**Row Level Security** = Politiques de sécurité au niveau des lignes.

Supabase utilise RLS pour contrôler qui peut lire/écrire quelles données.

### Pourquoi ça bloque ?
1. RLS est **activé** sur `school_groups`
2. Aucune politique ne permet la lecture
3. L'utilisateur connecté n'a pas les permissions

---

## ✅ SOLUTION RAPIDE (DÉVELOPPEMENT)

### Option 1 : Désactiver RLS temporairement

```sql
-- Dans Supabase SQL Editor
ALTER TABLE school_groups DISABLE ROW LEVEL SECURITY;
```

⚠️ **ATTENTION** : À utiliser UNIQUEMENT en développement !

---

### Option 2 : Créer une politique permissive (DEV)

```sql
-- Politique temporaire pour le développement
CREATE POLICY "dev_allow_all_school_groups" ON school_groups
FOR ALL 
USING (true)
WITH CHECK (true);
```

⚠️ **ATTENTION** : Permet tout à tout le monde (DEV uniquement) !

---

### Option 3 : Créer des politiques appropriées (PRODUCTION)

```sql
-- 1. Super Admin peut tout voir
CREATE POLICY "super_admin_all_school_groups" ON school_groups
FOR ALL 
USING (
  auth.jwt() ->> 'role' = 'super_admin'
);

-- 2. Admin Groupe peut voir son groupe
CREATE POLICY "admin_groupe_own_school_group" ON school_groups
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role = 'admin_groupe' 
    AND school_group_id = school_groups.id
  )
);

-- 3. Lecture publique pour utilisateurs authentifiés (optionnel)
CREATE POLICY "authenticated_read_school_groups" ON school_groups
FOR SELECT
USING (auth.role() = 'authenticated');
```

---

## 🔍 VÉRIFICATION RLS

### 1. Vérifier si RLS est activé
```sql
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'school_groups';

-- Si rls_enabled = true → RLS est activé
```

### 2. Lister les politiques existantes
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'school_groups';

-- Si aucune ligne → Aucune politique (accès bloqué)
```

### 3. Tester sans RLS
```sql
-- Désactiver temporairement
ALTER TABLE school_groups DISABLE ROW LEVEL SECURITY;

-- Tester dans l'app
-- Rafraîchir la page

-- Réactiver
ALTER TABLE school_groups ENABLE ROW LEVEL SECURITY;
```

---

## 📊 SCRIPT DIAGNOSTIC COMPLET

```sql
-- ========================================
-- DIAGNOSTIC RLS SCHOOL_GROUPS
-- ========================================

-- 1. Vérifier RLS activé
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'school_groups';

-- 2. Lister politiques
SELECT 
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies 
WHERE tablename = 'school_groups';

-- 3. Compter les groupes (admin)
SELECT COUNT(*) as total FROM school_groups;

-- 4. Tester lecture simple
SELECT id, name, code, status FROM school_groups LIMIT 5;

-- 5. Vérifier utilisateur connecté
SELECT 
  auth.uid() as user_id,
  auth.role() as user_role,
  auth.jwt() ->> 'email' as user_email;
```

---

## ✅ SOLUTION RECOMMANDÉE

### Pour DÉVELOPPEMENT (maintenant)

```sql
-- Désactiver RLS temporairement
ALTER TABLE school_groups DISABLE ROW LEVEL SECURITY;
```

**Avantages** :
- ✅ Rapide
- ✅ Permet de continuer le développement
- ✅ Facile à réactiver

**Inconvénients** :
- ⚠️ Aucune sécurité
- ⚠️ À ne PAS utiliser en production

---

### Pour PRODUCTION (plus tard)

```sql
-- 1. Réactiver RLS
ALTER TABLE school_groups ENABLE ROW LEVEL SECURITY;

-- 2. Créer politiques appropriées
-- Super Admin : accès total
CREATE POLICY "super_admin_all" ON school_groups
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Admin Groupe : lecture de son groupe
CREATE POLICY "admin_groupe_read_own" ON school_groups
FOR SELECT
USING (
  id IN (
    SELECT school_group_id FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin_groupe'
  )
);

-- Admin Groupe : modification de son groupe
CREATE POLICY "admin_groupe_update_own" ON school_groups
FOR UPDATE
USING (
  id IN (
    SELECT school_group_id FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin_groupe'
  )
);
```

---

## 🔄 ÉTAPES À SUIVRE

### 1. Vérifier RLS
```sql
-- Exécuter dans Supabase SQL Editor
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'school_groups';
```

### 2. Désactiver RLS (DEV)
```sql
ALTER TABLE school_groups DISABLE ROW LEVEL SECURITY;
```

### 3. Rafraîchir l'app
`Ctrl + Shift + R` sur `/dashboard/school-groups`

### 4. Vérifier les logs
Console devrait afficher :
```
🔍 Test résultat: {
  testData: [{...}, {...}],
  testError: null,
  count: 2
}
```

### 5. Confirmer l'affichage
- ✅ 2 groupes visibles
- ✅ Stats mises à jour
- ✅ Tableau fonctionnel

---

## 📝 NOTES

### Pourquoi RLS bloque ?
1. **Sécurité par défaut** : Supabase active RLS automatiquement
2. **Pas de politique** : Sans politique, personne ne peut lire
3. **Protection** : Empêche les accès non autorisés

### Quand réactiver RLS ?
- ✅ Avant la mise en production
- ✅ Après avoir créé les politiques appropriées
- ✅ Après avoir testé les permissions

### Comment tester les politiques ?
```sql
-- Tester en tant que super_admin
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"role": "super_admin"}';
SELECT * FROM school_groups;

-- Tester en tant que admin_groupe
SET LOCAL request.jwt.claims TO '{"role": "admin_groupe", "sub": "user-id"}';
SELECT * FROM school_groups;
```

---

## ✅ CHECKLIST

- [ ] Exécuter script diagnostic
- [ ] Vérifier que RLS est activé
- [ ] Désactiver RLS temporairement
- [ ] Rafraîchir l'application
- [ ] Vérifier que les groupes s'affichent
- [ ] (Plus tard) Créer politiques RLS appropriées
- [ ] (Plus tard) Réactiver RLS en production

---

**Diagnostic RLS complet fourni !** 🔍

🇨🇬 **E-Pilot Congo - Sécurité RLS** 🔐

**Désactivez RLS temporairement pour continuer le développement !** ✅
