# 🔍 ANALYSE - GROUPES SCOLAIRES NE S'AFFICHENT PAS

**Date** : 2 Novembre 2025  
**Problème** : Les groupes scolaires ne s'affichent pas sur la page

---

## 🎯 DIAGNOSTIC

### Architecture actuelle ✅
La page est bien structurée avec :
- ✅ Hook `useSchoolGroups()` pour récupérer les données
- ✅ Composants modulaires (Stats, Filters, Table, Grid)
- ✅ Gestion du loading
- ✅ Filtrage et recherche
- ✅ Temps réel avec Supabase

### Code de récupération ✅
```tsx
// SchoolGroups.tsx ligne 35-36
const schoolGroupsQuery = useSchoolGroups();
const schoolGroups = schoolGroupsQuery.data || [];
const isLoading = schoolGroupsQuery.isLoading;
```

### Logs de débogage présents ✅
Le hook a des `console.log` pour le débogage (lignes 41, 81, 115, 134).

---

## 🔍 CAUSES POSSIBLES

### 1. Table vide dans Supabase ⚠️
**Probabilité** : 🔴 **TRÈS ÉLEVÉE**

La table `school_groups` existe mais ne contient **aucune donnée**.

**Vérification** :
```sql
-- Dans Supabase SQL Editor
SELECT COUNT(*) FROM school_groups;
-- Si retourne 0 → Table vide
```

**Solution** :
Créer des groupes scolaires de test.

---

### 2. Erreur RLS (Row Level Security) ⚠️
**Probabilité** : 🟡 **MOYENNE**

Les politiques RLS empêchent la lecture des données.

**Vérification** :
```sql
-- Vérifier les politiques RLS
SELECT * FROM pg_policies WHERE tablename = 'school_groups';

-- Tester sans RLS (temporaire)
SELECT * FROM school_groups;
```

**Solution** :
Créer ou ajuster les politiques RLS.

---

### 3. Erreur de requête Supabase ⚠️
**Probabilité** : 🟢 **FAIBLE**

La requête échoue silencieusement.

**Vérification** :
Ouvrir la console (`F12`) et chercher :
- `❌ Erreur Supabase school_groups:`
- `⚠️ Aucune donnée retournée`

**Solution** :
Corriger la requête ou les permissions.

---

### 4. Problème de transformation des données ⚠️
**Probabilité** : 🟢 **FAIBLE**

Les données sont récupérées mais mal transformées.

**Vérification** :
```tsx
console.log('schoolGroups:', schoolGroups);
console.log('filteredData:', filteredData);
```

---

## ✅ SOLUTION ÉTAPE PAR ÉTAPE

### Étape 1 : Vérifier la console
1. Ouvrir la page `/dashboard/school-groups`
2. Ouvrir DevTools (`F12`) → Console
3. Chercher les logs :
   - `🚀 useSchoolGroups: Hook appelé`
   - `🔄 useSchoolGroups: Début de la requête`
   - `📊 useSchoolGroups: Résultat requête`

**Analyser** :
- `dataLength: 0` → Table vide
- `error: ...` → Erreur de requête
- Aucun log → Hook non appelé

---

### Étape 2 : Vérifier la table Supabase
```sql
-- 1. Compter les groupes
SELECT COUNT(*) as total FROM school_groups;

-- 2. Voir les données
SELECT id, name, code, status, created_at 
FROM school_groups 
LIMIT 10;

-- 3. Vérifier RLS
SELECT * FROM pg_policies 
WHERE tablename = 'school_groups';
```

---

### Étape 3 : Créer des données de test
Si la table est vide, créer des groupes :

```sql
-- Insérer un groupe de test
INSERT INTO school_groups (
  name,
  code,
  region,
  city,
  address,
  phone,
  plan,
  status,
  founded_year
) VALUES (
  'Groupe Scolaire Test',
  'GST001',
  'Brazzaville',
  'Brazzaville',
  '123 Avenue de la Paix',
  '+242 06 123 4567',
  'gratuit',
  'active',
  2024
);

-- Vérifier l'insertion
SELECT * FROM school_groups;
```

---

### Étape 4 : Vérifier les politiques RLS
Si RLS bloque l'accès :

```sql
-- Désactiver temporairement RLS (DEV UNIQUEMENT)
ALTER TABLE school_groups DISABLE ROW LEVEL SECURITY;

-- OU créer une politique permissive (DEV)
CREATE POLICY "Allow all for development" ON school_groups
FOR ALL USING (true);

-- Réactiver RLS
ALTER TABLE school_groups ENABLE ROW LEVEL SECURITY;
```

**⚠️ ATTENTION** : En production, créer des politiques appropriées !

---

### Étape 5 : Vérifier les permissions
```sql
-- Vérifier que l'utilisateur peut lire
SELECT 
  has_table_privilege('school_groups', 'SELECT') as can_select,
  has_table_privilege('school_groups', 'INSERT') as can_insert;
```

---

## 🔧 SCRIPT DE DIAGNOSTIC RAPIDE

Exécuter dans Supabase SQL Editor :

```sql
-- ========================================
-- DIAGNOSTIC GROUPES SCOLAIRES
-- ========================================

-- 1. Vérifier existence table
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'school_groups'
) as table_exists;

-- 2. Compter les enregistrements
SELECT COUNT(*) as total_groups FROM school_groups;

-- 3. Voir les 5 premiers
SELECT id, name, code, status, created_at 
FROM school_groups 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Vérifier RLS
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

-- 5. Vérifier statut RLS
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'school_groups';
```

---

## 📊 RÉSULTATS ATTENDUS

### Si table vide
```
total_groups: 0
```
**Action** : Créer des données de test

### Si RLS bloque
```
total_groups: 5 (dans SQL Editor)
total_groups: 0 (dans l'app)
```
**Action** : Ajuster les politiques RLS

### Si erreur de requête
```
Console: ❌ Erreur Supabase school_groups: ...
```
**Action** : Corriger la requête

---

## ✅ SOLUTION RAPIDE (DÉVELOPPEMENT)

### 1. Créer des données de test
```sql
-- Insérer 3 groupes de test
INSERT INTO school_groups (name, code, region, city, plan, status, founded_year) VALUES
('Groupe Scolaire Brazzaville', 'GSB001', 'Brazzaville', 'Brazzaville', 'premium', 'active', 2020),
('Groupe Scolaire Pointe-Noire', 'GSPN001', 'Pointe-Noire', 'Pointe-Noire', 'pro', 'active', 2018),
('Groupe Scolaire Dolisie', 'GSD001', 'Niari', 'Dolisie', 'gratuit', 'active', 2022);
```

### 2. Désactiver RLS temporairement
```sql
ALTER TABLE school_groups DISABLE ROW LEVEL SECURITY;
```

### 3. Rafraîchir la page
`Ctrl + Shift + R`

---

## 🎯 VÉRIFICATION FINALE

Après avoir appliqué les solutions :

1. ✅ Ouvrir `/dashboard/school-groups`
2. ✅ Vérifier la console : `dataLength: 3`
3. ✅ Voir les 3 groupes affichés
4. ✅ Tester les filtres
5. ✅ Tester la recherche

---

## 📝 LOGS À SURVEILLER

### Console navigateur
```
🚀 useSchoolGroups: Hook appelé avec filtres: undefined
🔄 useSchoolGroups: Début de la requête...
📊 useSchoolGroups: Résultat requête: {
  error: null,
  dataLength: 3,
  data: [...],
  firstItem: { id: '...', name: 'Groupe Scolaire Brazzaville', ... }
}
```

### Si succès
- ✅ `dataLength > 0`
- ✅ `error: null`
- ✅ `data` contient les groupes

### Si échec
- ❌ `dataLength: 0`
- ❌ `error: "..."`
- ⚠️ `Aucune donnée retournée`

---

## 🔗 FICHIERS CONCERNÉS

- `src/features/dashboard/pages/SchoolGroups.tsx` - Page principale
- `src/features/dashboard/hooks/useSchoolGroups.ts` - Hook de données
- `src/features/dashboard/components/school-groups/` - Composants
- Table Supabase : `school_groups`

---

## ✅ CHECKLIST

- [ ] Ouvrir console (`F12`)
- [ ] Vérifier les logs `useSchoolGroups`
- [ ] Exécuter script diagnostic SQL
- [ ] Vérifier `COUNT(*) FROM school_groups`
- [ ] Si 0 : Insérer données de test
- [ ] Si RLS : Ajuster politiques
- [ ] Rafraîchir page (`Ctrl + Shift + R`)
- [ ] Vérifier affichage des groupes

---

**Diagnostic complet fourni !** 🔍

🇨🇬 **E-Pilot Congo - Support Technique** 🚀

**Suivez les étapes ci-dessus pour identifier et résoudre le problème !** ✅
