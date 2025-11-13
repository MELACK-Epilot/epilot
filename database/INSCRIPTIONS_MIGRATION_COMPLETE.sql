-- ============================================================================
-- MIGRATION COMPLÈTE MODULE INSCRIPTIONS E-PILOT CONGO
-- Ajoute toutes les colonnes manquantes pour cohérence avec le code TypeScript
-- Date: 31 octobre 2025
-- ============================================================================

BEGIN;

-- 1. AJOUTER COLONNES AIDES SOCIALES
-- ============================================================================
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS a_aide_sociale BOOLEAN DEFAULT FALSE;
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS est_pensionnaire BOOLEAN DEFAULT FALSE;
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS a_bourse BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN inscriptions.a_aide_sociale IS 'Bénéficie d''une aide sociale';
COMMENT ON COLUMN inscriptions.est_pensionnaire IS 'Élève pensionnaire (internat)';
COMMENT ON COLUMN inscriptions.a_bourse IS 'Bénéficie d''une bourse d''études';

-- 2. AJOUTER COLONNES STATUT SCOLAIRE
-- ============================================================================
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS est_redoublant BOOLEAN DEFAULT FALSE;
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS est_affecte BOOLEAN DEFAULT FALSE;
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS numero_affectation VARCHAR(50);

COMMENT ON COLUMN inscriptions.est_redoublant IS 'Redouble la classe';
COMMENT ON COLUMN inscriptions.est_affecte IS 'A été affecté à une classe';
COMMENT ON COLUMN inscriptions.numero_affectation IS 'Numéro d''affectation officiel';

-- 3. AJOUTER COLONNES FRAIS ADDITIONNELS
-- ============================================================================
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS frais_cantine DECIMAL(10,2) DEFAULT 0;
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS frais_transport DECIMAL(10,2) DEFAULT 0;

COMMENT ON COLUMN inscriptions.frais_cantine IS 'Frais de cantine mensuel en FCFA';
COMMENT ON COLUMN inscriptions.frais_transport IS 'Frais de transport mensuel en FCFA';

-- 4. AJOUTER COLONNES WORKFLOW
-- ============================================================================
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS workflow_step VARCHAR(20) DEFAULT 'soumission';
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Ajouter contrainte sur workflow_step
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'inscriptions_workflow_step_check'
  ) THEN
    ALTER TABLE inscriptions 
    ADD CONSTRAINT inscriptions_workflow_step_check 
    CHECK (workflow_step IN ('soumission', 'validation', 'refus', 'brouillon'));
  END IF;
END $$;

COMMENT ON COLUMN inscriptions.workflow_step IS 'Étape du workflow: soumission, validation, refus, brouillon';
COMMENT ON COLUMN inscriptions.internal_notes IS 'Notes internes (visibles uniquement par les administrateurs)';
COMMENT ON COLUMN inscriptions.rejection_reason IS 'Motif de refus de l''inscription';

-- 5. AJOUTER COLONNES DATES DE VALIDATION
-- ============================================================================
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ;
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS validated_by UUID;

-- Ajouter foreign key pour validated_by
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'inscriptions_validated_by_fkey'
  ) THEN
    ALTER TABLE inscriptions 
    ADD CONSTRAINT inscriptions_validated_by_fkey 
    FOREIGN KEY (validated_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

COMMENT ON COLUMN inscriptions.submitted_at IS 'Date de soumission de l''inscription';
COMMENT ON COLUMN inscriptions.validated_at IS 'Date de validation de l''inscription';
COMMENT ON COLUMN inscriptions.validated_by IS 'ID de l''agent qui a validé l''inscription';

-- 6. AJOUTER COLONNE SÉRIE
-- ============================================================================
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS serie VARCHAR(100);

COMMENT ON COLUMN inscriptions.serie IS 'Série (ex: A, C, D pour le lycée)';

-- 7. RECALCULER LE SOLDE_RESTANT AVEC LES NOUVEAUX FRAIS
-- ============================================================================
ALTER TABLE inscriptions DROP COLUMN IF EXISTS solde_restant;
ALTER TABLE inscriptions ADD COLUMN solde_restant DECIMAL(10,2) GENERATED ALWAYS AS (
  (droit_inscription + frais_scolarite + COALESCE(frais_cantine, 0) + COALESCE(frais_transport, 0)) 
  - COALESCE(montant_paye, 0)
) STORED;

COMMENT ON COLUMN inscriptions.solde_restant IS 'Solde restant calculé automatiquement (Total - Payé)';

-- 8. AJOUTER INDEX SUR LES NOUVELLES COLONNES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_inscriptions_workflow_step ON inscriptions(workflow_step);
CREATE INDEX IF NOT EXISTS idx_inscriptions_est_affecte ON inscriptions(est_affecte);
CREATE INDEX IF NOT EXISTS idx_inscriptions_validated_at ON inscriptions(validated_at DESC);
CREATE INDEX IF NOT EXISTS idx_inscriptions_validated_by ON inscriptions(validated_by);
CREATE INDEX IF NOT EXISTS idx_inscriptions_submitted_at ON inscriptions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_inscriptions_a_aide_sociale ON inscriptions(a_aide_sociale) WHERE a_aide_sociale = TRUE;
CREATE INDEX IF NOT EXISTS idx_inscriptions_a_bourse ON inscriptions(a_bourse) WHERE a_bourse = TRUE;

-- 9. METTRE À JOUR LES DONNÉES EXISTANTES
-- ============================================================================

-- Mettre à jour workflow_step basé sur le statut
UPDATE inscriptions 
SET workflow_step = CASE 
  WHEN statut = 'validee' THEN 'validation'
  WHEN statut = 'refusee' THEN 'refus'
  ELSE 'soumission'
END
WHERE workflow_step = 'soumission' OR workflow_step IS NULL;

-- Mettre à jour submitted_at avec date_enregistrement si elle existe
UPDATE inscriptions 
SET submitted_at = date_enregistrement
WHERE submitted_at IS NULL AND date_enregistrement IS NOT NULL;

-- 10. CRÉER FONCTION DE MISE À JOUR DU WORKFLOW
-- ============================================================================

CREATE OR REPLACE FUNCTION update_workflow_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour workflow_step automatiquement quand statut change
  IF NEW.statut = 'validee' AND OLD.statut != 'validee' THEN
    NEW.workflow_step := 'validation';
    NEW.validated_at := NOW();
  ELSIF NEW.statut = 'refusee' AND OLD.statut != 'refusee' THEN
    NEW.workflow_step := 'refus';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer trigger
DROP TRIGGER IF EXISTS trigger_update_workflow ON inscriptions;
CREATE TRIGGER trigger_update_workflow
  BEFORE UPDATE OF statut ON inscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_on_status_change();

-- 11. AMÉLIORER LA FONCTION DE VALIDATION
-- ============================================================================

CREATE OR REPLACE FUNCTION valider_inscription(
  p_inscription_id UUID,
  p_agent_id UUID,
  p_observations TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE inscriptions
  SET 
    statut = 'validee',
    workflow_step = 'validation',
    observations = COALESCE(p_observations, observations),
    validated_at = NOW(),
    validated_by = p_agent_id,
    updated_at = NOW()
  WHERE id = p_inscription_id;
  
  -- Log dans activity_logs (si table existe)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs') THEN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (
      p_agent_id,
      'validate_inscription',
      'inscription',
      p_inscription_id,
      jsonb_build_object(
        'observations', p_observations,
        'validated_at', NOW()
      )
    );
  END IF;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erreur lors de la validation: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 12. AMÉLIORER LA FONCTION DE REFUS
-- ============================================================================

CREATE OR REPLACE FUNCTION refuser_inscription(
  p_inscription_id UUID,
  p_agent_id UUID,
  p_motif TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE inscriptions
  SET 
    statut = 'refusee',
    workflow_step = 'refus',
    rejection_reason = p_motif,
    observations = COALESCE(observations || E'\n\nMotif de refus: ' || p_motif, 'Motif de refus: ' || p_motif),
    updated_at = NOW()
  WHERE id = p_inscription_id;
  
  -- Log dans activity_logs
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs') THEN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (
      p_agent_id,
      'reject_inscription',
      'inscription',
      p_inscription_id,
      jsonb_build_object(
        'motif', p_motif,
        'rejected_at', NOW()
      )
    );
  END IF;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erreur lors du refus: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 13. CRÉER VUE POUR LES STATISTIQUES ENRICHIES
-- ============================================================================

CREATE OR REPLACE VIEW inscriptions_stats_enrichies AS
SELECT 
  niveau,
  annee_academique,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE statut = 'en_attente') as en_attente,
  COUNT(*) FILTER (WHERE statut = 'validee') as validees,
  COUNT(*) FILTER (WHERE statut = 'refusee') as refusees,
  COUNT(*) FILTER (WHERE type_inscription = 'nouvelle') as nouvelles,
  COUNT(*) FILTER (WHERE type_inscription = 'reinscription') as reinscriptions,
  COUNT(*) FILTER (WHERE type_inscription = 'transfert') as transferts,
  COUNT(*) FILTER (WHERE a_aide_sociale = TRUE) as avec_aide_sociale,
  COUNT(*) FILTER (WHERE est_pensionnaire = TRUE) as pensionnaires,
  COUNT(*) FILTER (WHERE a_bourse = TRUE) as boursiers,
  COUNT(*) FILTER (WHERE est_redoublant = TRUE) as redoublants,
  COUNT(*) FILTER (WHERE est_affecte = TRUE) as affectes,
  SUM(droit_inscription + frais_scolarite + COALESCE(frais_cantine, 0) + COALESCE(frais_transport, 0)) as revenus_potentiels,
  SUM(montant_paye) as revenus_percus,
  SUM(solde_restant) as soldes_restants,
  AVG(CASE WHEN montant_paye > 0 THEN montant_paye ELSE NULL END) as montant_moyen_paye
FROM inscriptions
GROUP BY niveau, annee_academique
ORDER BY 
  annee_academique DESC,
  CASE niveau
    WHEN 'Préscolaire' THEN 1
    WHEN 'Primaire' THEN 2
    WHEN 'Collège' THEN 3
    WHEN 'Lycée Général' THEN 4
    WHEN 'Lycée Technique' THEN 5
    WHEN 'Enseignement Professionnel' THEN 6
    WHEN 'Enseignement Supérieur' THEN 7
  END;

COMMENT ON VIEW inscriptions_stats_enrichies IS 'Statistiques enrichies des inscriptions par niveau et année académique';

-- 14. VÉRIFICATION FINALE
-- ============================================================================

DO $$
DECLARE
  col_count INTEGER;
BEGIN
  -- Compter les colonnes de la table inscriptions
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'inscriptions';
  
  RAISE NOTICE '✅ Migration terminée avec succès!';
  RAISE NOTICE '📊 Nombre total de colonnes dans inscriptions: %', col_count;
  RAISE NOTICE '🔧 Nouvelles colonnes ajoutées:';
  RAISE NOTICE '   - Aides sociales: a_aide_sociale, est_pensionnaire, a_bourse';
  RAISE NOTICE '   - Statut scolaire: est_redoublant, est_affecte, numero_affectation';
  RAISE NOTICE '   - Frais additionnels: frais_cantine, frais_transport';
  RAISE NOTICE '   - Workflow: workflow_step, internal_notes, rejection_reason';
  RAISE NOTICE '   - Validation: submitted_at, validated_at, validated_by';
  RAISE NOTICE '   - Autres: serie';
  RAISE NOTICE '🎯 Fonctions mises à jour: valider_inscription, refuser_inscription';
  RAISE NOTICE '📈 Vue créée: inscriptions_stats_enrichies';
  RAISE NOTICE '✨ Triggers créés: trigger_update_workflow';
END $$;

COMMIT;

-- Afficher un résumé des colonnes
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'inscriptions'
ORDER BY ordinal_position;
