-- =====================================================
-- FIX : PLAN_MODULES & PLAN_CATEGORIES
-- Corriger les références de subscription_plans → plans
-- =====================================================
-- Date: 6 Novembre 2025
-- Objectif: Corriger les foreign keys pour référencer la bonne table
-- =====================================================

BEGIN;

-- =====================================================
-- 1️⃣ CORRIGER plan_modules
-- =====================================================

-- Supprimer l'ancienne contrainte (si elle existe)
ALTER TABLE IF EXISTS plan_modules 
  DROP CONSTRAINT IF EXISTS plan_modules_plan_id_fkey;

-- Ajouter la nouvelle contrainte correcte
ALTER TABLE plan_modules 
  ADD CONSTRAINT plan_modules_plan_id_fkey 
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;

-- Commentaire
COMMENT ON TABLE plan_modules IS 'Modules disponibles selon le plan d''abonnement (corrigé)';

-- =====================================================
-- 2️⃣ CORRIGER plan_categories
-- =====================================================

-- Supprimer l'ancienne contrainte (si elle existe)
ALTER TABLE IF EXISTS plan_categories 
  DROP CONSTRAINT IF EXISTS plan_categories_plan_id_fkey;

-- Ajouter la nouvelle contrainte correcte
ALTER TABLE plan_categories 
  ADD CONSTRAINT plan_categories_plan_id_fkey 
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;

-- Commentaire
COMMENT ON TABLE plan_categories IS 'Catégories disponibles selon le plan d''abonnement (corrigé)';

-- =====================================================
-- 3️⃣ POLITIQUES RLS (Row Level Security)
-- =====================================================

-- Super Admin a accès total
DROP POLICY IF EXISTS "Super Admin full access on plan_modules" ON plan_modules;
CREATE POLICY "Super Admin full access on plan_modules"
  ON plan_modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Super Admin full access on plan_categories" ON plan_categories;
CREATE POLICY "Super Admin full access on plan_categories"
  ON plan_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Lecture publique pour les utilisateurs authentifiés
DROP POLICY IF EXISTS "Authenticated users can view plan_modules" ON plan_modules;
CREATE POLICY "Authenticated users can view plan_modules"
  ON plan_modules FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can view plan_categories" ON plan_categories;
CREATE POLICY "Authenticated users can view plan_categories"
  ON plan_categories FOR SELECT
  USING (auth.role() = 'authenticated');

COMMIT;

-- =====================================================
-- ✅ VÉRIFICATION
-- =====================================================
-- Vérifier que les contraintes sont correctes :
-- SELECT conname, conrelid::regclass, confrelid::regclass 
-- FROM pg_constraint 
-- WHERE conname LIKE 'plan_%_plan_id_fkey';
-- 
-- Résultat attendu :
-- plan_modules_plan_id_fkey | plan_modules | plans
-- plan_categories_plan_id_fkey | plan_categories | plans
-- =====================================================
