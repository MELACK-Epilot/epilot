# 🚀 GUIDE D'INSTALLATION DU SANDBOX

## ❌ **ERREUR ACTUELLE**

```
Failed to load resource: the server responded with a status of 404
Could not find the function public.count_sandbox_data
```

**Cause** : La migration SQL n'a pas été exécutée dans Supabase.

---

## ✅ **SOLUTION : EXÉCUTER LA MIGRATION SQL**

### **Étape 1 : Ouvrir Supabase Dashboard**

```
1. Aller sur https://supabase.com
2. Se connecter
3. Sélectionner votre projet E-Pilot
```

### **Étape 2 : Ouvrir SQL Editor**

```
1. Dans le menu de gauche, cliquer sur "SQL Editor"
2. Cliquer sur "New Query"
```

### **Étape 3 : Copier-Coller le SQL**

Ouvrir le fichier : `supabase/migrations/20250114_sandbox_environment.sql`

**OU** copier directement ce SQL :

```sql
-- ============================================
-- ENVIRONNEMENT SANDBOX POUR SUPER ADMIN
-- ============================================

-- 1. AJOUTER LA COLONNE is_sandbox
-- ============================================

ALTER TABLE school_groups ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN DEFAULT FALSE;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN DEFAULT FALSE;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN DEFAULT FALSE;
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN DEFAULT FALSE;

-- Notes (si existe)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'grades') THEN
    ALTER TABLE grades ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Absences (si existe)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'absences') THEN
    ALTER TABLE absences ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Paiements (si existe)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- ============================================
-- 2. CRÉER DES INDEX POUR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_school_groups_sandbox ON school_groups(is_sandbox);
CREATE INDEX IF NOT EXISTS idx_schools_sandbox ON schools(is_sandbox);
CREATE INDEX IF NOT EXISTS idx_users_sandbox ON users(is_sandbox);
CREATE INDEX IF NOT EXISTS idx_students_sandbox ON students(is_sandbox);
CREATE INDEX IF NOT EXISTS idx_classes_sandbox ON classes(is_sandbox);
CREATE INDEX IF NOT EXISTS idx_inscriptions_sandbox ON inscriptions(is_sandbox);

-- ============================================
-- 3. CRÉER LES POLICIES RLS
-- ============================================

-- Policy pour school_groups
DROP POLICY IF EXISTS "Sandbox visible only to super_admin" ON school_groups;
CREATE POLICY "Sandbox visible only to super_admin"
ON school_groups FOR SELECT
USING (
  is_sandbox = false 
  OR 
  (is_sandbox = true AND auth.jwt() ->> 'role' = 'super_admin')
);

-- Policy pour schools
DROP POLICY IF EXISTS "Sandbox visible only to super_admin" ON schools;
CREATE POLICY "Sandbox visible only to super_admin"
ON schools FOR SELECT
USING (
  is_sandbox = false 
  OR 
  (is_sandbox = true AND auth.jwt() ->> 'role' = 'super_admin')
);

-- Policy pour users
DROP POLICY IF EXISTS "Sandbox visible only to super_admin" ON users;
CREATE POLICY "Sandbox visible only to super_admin"
ON users FOR SELECT
USING (
  is_sandbox = false 
  OR 
  (is_sandbox = true AND auth.jwt() ->> 'role' = 'super_admin')
);

-- Policy pour students
DROP POLICY IF EXISTS "Sandbox visible only to super_admin" ON students;
CREATE POLICY "Sandbox visible only to super_admin"
ON students FOR SELECT
USING (
  is_sandbox = false 
  OR 
  (is_sandbox = true AND auth.jwt() ->> 'role' = 'super_admin')
);

-- Policy pour classes
DROP POLICY IF EXISTS "Sandbox visible only to super_admin" ON classes;
CREATE POLICY "Sandbox visible only to super_admin"
ON classes FOR SELECT
USING (
  is_sandbox = false 
  OR 
  (is_sandbox = true AND auth.jwt() ->> 'role' = 'super_admin')
);

-- Policy pour inscriptions
DROP POLICY IF EXISTS "Sandbox visible only to super_admin" ON inscriptions;
CREATE POLICY "Sandbox visible only to super_admin"
ON inscriptions FOR SELECT
USING (
  is_sandbox = false 
  OR 
  (is_sandbox = true AND auth.jwt() ->> 'role' = 'super_admin')
);

-- ============================================
-- 4. FONCTION POUR SUPPRIMER LES DONNÉES SANDBOX
-- ============================================

CREATE OR REPLACE FUNCTION delete_sandbox_data()
RETURNS json AS $$
DECLARE
  deleted_counts json;
BEGIN
  -- Supprimer dans l'ordre (contraintes FK)
  DELETE FROM inscriptions WHERE is_sandbox = true;
  DELETE FROM classes WHERE is_sandbox = true;
  DELETE FROM students WHERE is_sandbox = true;
  DELETE FROM users WHERE is_sandbox = true;
  DELETE FROM schools WHERE is_sandbox = true;
  DELETE FROM school_groups WHERE is_sandbox = true;
  
  -- Supprimer grades si existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'grades') THEN
    EXECUTE 'DELETE FROM grades WHERE is_sandbox = true';
  END IF;
  
  -- Supprimer absences si existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'absences') THEN
    EXECUTE 'DELETE FROM absences WHERE is_sandbox = true';
  END IF;
  
  -- Supprimer payments si existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
    EXECUTE 'DELETE FROM payments WHERE is_sandbox = true';
  END IF;
  
  -- Retourner un résumé
  SELECT json_build_object(
    'success', true,
    'message', 'Toutes les données sandbox ont été supprimées'
  ) INTO deleted_counts;
  
  RETURN deleted_counts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. FONCTION POUR COMPTER LES DONNÉES SANDBOX
-- ============================================

CREATE OR REPLACE FUNCTION count_sandbox_data()
RETURNS json AS $$
DECLARE
  counts json;
  grades_count int := 0;
  absences_count int := 0;
  payments_count int := 0;
BEGIN
  -- Compter grades si existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'grades') THEN
    EXECUTE 'SELECT COUNT(*) FROM grades WHERE is_sandbox = true' INTO grades_count;
  END IF;
  
  -- Compter absences si existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'absences') THEN
    EXECUTE 'SELECT COUNT(*) FROM absences WHERE is_sandbox = true' INTO absences_count;
  END IF;
  
  -- Compter payments si existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
    EXECUTE 'SELECT COUNT(*) FROM payments WHERE is_sandbox = true' INTO payments_count;
  END IF;
  
  -- Construire le résultat
  SELECT json_build_object(
    'school_groups', (SELECT COUNT(*) FROM school_groups WHERE is_sandbox = true),
    'schools', (SELECT COUNT(*) FROM schools WHERE is_sandbox = true),
    'users', (SELECT COUNT(*) FROM users WHERE is_sandbox = true),
    'students', (SELECT COUNT(*) FROM students WHERE is_sandbox = true),
    'classes', (SELECT COUNT(*) FROM classes WHERE is_sandbox = true),
    'inscriptions', (SELECT COUNT(*) FROM inscriptions WHERE is_sandbox = true),
    'grades', grades_count,
    'absences', absences_count,
    'payments', payments_count
  ) INTO counts;
  
  RETURN counts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. DONNER LES PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION delete_sandbox_data() TO authenticated;
GRANT EXECUTE ON FUNCTION count_sandbox_data() TO authenticated;
```

### **Étape 4 : Exécuter**

```
1. Cliquer sur "Run" (ou Ctrl+Enter)
2. Attendre quelques secondes
3. Vérifier qu'il n'y a pas d'erreurs
```

### **Étape 5 : Vérifier**

```sql
-- Tester la fonction count_sandbox_data
SELECT count_sandbox_data();

-- Résultat attendu :
{
  "school_groups": 0,
  "schools": 0,
  "users": 0,
  "students": 0,
  "classes": 0,
  "inscriptions": 0,
  "grades": 0,
  "absences": 0,
  "payments": 0
}
```

---

## ✅ **APRÈS L'INSTALLATION**

### **1. Rafraîchir la Page**

```
Aller sur /dashboard/sandbox
Rafraîchir (F5)
✅ Plus d'erreur 404 !
```

### **2. Générer les Données**

```bash
# Dans le terminal
npm run generate:sandbox
```

### **3. Vérifier les Stats**

```
Retourner sur /dashboard/sandbox
✅ Les statistiques s'affichent !
```

---

## 🎯 **RÉSUMÉ**

### **Problème**
```
❌ Fonction count_sandbox_data() n'existe pas
❌ Erreur 404
```

### **Solution**
```
✅ Exécuter la migration SQL dans Supabase
✅ Créer les fonctions count_sandbox_data() et delete_sandbox_data()
✅ Créer les policies RLS
✅ Ajouter les colonnes is_sandbox
```

### **Résultat**
```
✅ Page /dashboard/sandbox fonctionne
✅ Statistiques s'affichent
✅ Prêt à générer les données sandbox
```

---

## 📝 **ORDRE D'EXÉCUTION**

```
1️⃣ Exécuter la migration SQL (Supabase Dashboard)
2️⃣ Rafraîchir la page /dashboard/sandbox
3️⃣ Générer les données (Terminal: npm run generate:sandbox)
4️⃣ Vérifier les stats sur /dashboard/sandbox
5️⃣ Tester les modules avec les données fictives
6️⃣ Supprimer les données (SQL: SELECT delete_sandbox_data())
```

---

## ⚠️ **IMPORTANT**

**NE PAS OUBLIER** d'exécuter la migration SQL **AVANT** de générer les données !

Sinon :
- ❌ Les colonnes `is_sandbox` n'existent pas
- ❌ Les fonctions n'existent pas
- ❌ Les policies ne fonctionnent pas
- ❌ Erreur 404

---

**Exécute la migration SQL maintenant et tout fonctionnera ! 🚀**
