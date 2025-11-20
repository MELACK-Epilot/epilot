-- Migration: Correction des RLS policies pour applied_recommendations
-- Date: 2025-11-20
-- Description: Simplifier les policies pour éviter les erreurs de permissions

-- =====================================================
-- 1. SUPPRIMER LES ANCIENNES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Super admins can view all applied recommendations" ON applied_recommendations;
DROP POLICY IF EXISTS "Admin groupe can view their applied recommendations" ON applied_recommendations;
DROP POLICY IF EXISTS "Admin groupe can create applied recommendations" ON applied_recommendations;
DROP POLICY IF EXISTS "Admin groupe can update their applied recommendations" ON applied_recommendations;

-- =====================================================
-- 2. CRÉER LES NOUVELLES POLICIES SIMPLIFIÉES
-- =====================================================

-- Policy: Tous les utilisateurs authentifiés peuvent voir leurs propres recommandations
CREATE POLICY "Users can view their own applied recommendations"
  ON applied_recommendations FOR SELECT
  USING (applied_by = auth.uid());

-- Policy: Tous les utilisateurs authentifiés peuvent créer des recommandations
CREATE POLICY "Authenticated users can create applied recommendations"
  ON applied_recommendations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Les utilisateurs peuvent mettre à jour leurs propres recommandations
CREATE POLICY "Users can update their own applied recommendations"
  ON applied_recommendations FOR UPDATE
  USING (applied_by = auth.uid());

-- Policy: Les utilisateurs peuvent supprimer leurs propres recommandations
CREATE POLICY "Users can delete their own applied recommendations"
  ON applied_recommendations FOR DELETE
  USING (applied_by = auth.uid());

-- =====================================================
-- 3. COMMENTAIRES
-- =====================================================

COMMENT ON POLICY "Users can view their own applied recommendations" ON applied_recommendations 
  IS 'Les utilisateurs peuvent voir les recommandations qu''ils ont appliquées';

COMMENT ON POLICY "Authenticated users can create applied recommendations" ON applied_recommendations 
  IS 'Tous les utilisateurs authentifiés peuvent créer des recommandations';

COMMENT ON POLICY "Users can update their own applied recommendations" ON applied_recommendations 
  IS 'Les utilisateurs peuvent mettre à jour leurs propres recommandations';

COMMENT ON POLICY "Users can delete their own applied recommendations" ON applied_recommendations 
  IS 'Les utilisateurs peuvent supprimer leurs propres recommandations';
