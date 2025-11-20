/**
 * Migration: Ajouter colonne plan à school_groups
 * Créé le: 2025-11-20
 * Description: Ajoute la colonne plan pour gérer les abonnements
 */

-- Ajouter colonne plan si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'school_groups' AND column_name = 'plan'
  ) THEN
    ALTER TABLE school_groups 
    ADD COLUMN plan VARCHAR(50) NOT NULL DEFAULT 'gratuit';
    
    COMMENT ON COLUMN school_groups.plan IS 'Plan d''abonnement du groupe (gratuit, premium, pro, institutionnel)';
  END IF;
END $$;

-- Créer un index sur la colonne plan pour les requêtes de filtrage
CREATE INDEX IF NOT EXISTS idx_school_groups_plan ON school_groups(plan);

-- Ajouter une contrainte pour valider les valeurs du plan
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_plan_values'
  ) THEN
    ALTER TABLE school_groups
    ADD CONSTRAINT check_plan_values 
    CHECK (plan IN ('gratuit', 'premium', 'pro', 'institutionnel'));
  END IF;
END $$;
