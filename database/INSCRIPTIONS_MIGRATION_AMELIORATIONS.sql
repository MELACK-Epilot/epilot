-- ============================================================================
-- MIGRATION & AMÉLIORATIONS TABLE INSCRIPTIONS EXISTANTE
-- Adaptation pour module complet E-Pilot Congo
-- ============================================================================

-- ============================================================================
-- 1. AJOUT DES CHAMPS MANQUANTS (ALTER TABLE)
-- ============================================================================

-- Informations élève manquantes
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS student_postnom VARCHAR(100);
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS student_nationality VARCHAR(100) DEFAULT 'Congolaise';
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS student_national_id VARCHAR(50);
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS student_phone VARCHAR(20);
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS student_email VARCHAR(100);

-- Informations parents complètes
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS parent1_address TEXT;
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS parent2_address TEXT;

-- Tuteur (si différent des parents)
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS tuteur_first_name VARCHAR(100);
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS tuteur_last_name VARCHAR(100);
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS tuteur_phone VARCHAR(20);
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS tuteur_address TEXT;
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS tuteur_relation VARCHAR(100);

-- Informations scolaires manquantes
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS filiere VARCHAR(100);
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS option_specialite VARCHAR(100);
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS type_inscription VARCHAR(20) 
  CHECK (type_inscription IN ('nouvelle', 'reinscription', 'transfert'));
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS ancienne_ecole VARCHAR(200);
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS moyenne_admission DECIMAL(4,2);
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS numero_dossier_papier VARCHAR(50);

-- Informations financières manquantes
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS mode_paiement VARCHAR(50)
  CHECK (mode_paiement IN ('Espèces', 'Mobile Money', 'Virement bancaire', 'Chèque'));
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS montant_paye DECIMAL(10,2) DEFAULT 0;
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS solde_restant DECIMAL(10,2);
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS reference_paiement VARCHAR(100);
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS date_paiement DATE;

-- Documents supplémentaires
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS acte_naissance_url TEXT;
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS photo_identite_url TEXT;
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS certificat_transfert_url TEXT;
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS releve_notes_url TEXT;
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS carnet_vaccination_url TEXT;

-- Gestion interne
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS agent_inscription_id UUID REFERENCES users(id);
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS observations TEXT;

-- ============================================================================
-- 2. FONCTION : CALCUL AUTOMATIQUE DU SOLDE RESTANT
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_solde_restant()
RETURNS TRIGGER AS $$
BEGIN
  NEW.solde_restant := (
    COALESCE(NEW.frais_inscription, 0) + 
    COALESCE(NEW.frais_scolarite, 0) + 
    COALESCE(NEW.frais_cantine, 0) + 
    COALESCE(NEW.frais_transport, 0)
  ) - COALESCE(NEW.montant_paye, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calcul automatique
DROP TRIGGER IF EXISTS trigger_calculate_solde ON inscriptions;
CREATE TRIGGER trigger_calculate_solde
  BEFORE INSERT OR UPDATE OF frais_inscription, frais_scolarite, frais_cantine, frais_transport, montant_paye
  ON inscriptions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_solde_restant();

-- ============================================================================
-- 3. FONCTION : GÉNÉRATION AUTOMATIQUE DU NUMÉRO D'INSCRIPTION
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_inscription_number()
RETURNS TRIGGER AS $$
DECLARE
  current_year TEXT;
  sequence_number TEXT;
  new_numero TEXT;
BEGIN
  -- Si numéro déjà défini, ne rien faire
  IF NEW.inscription_number IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Année académique actuelle (ex: 2024-2025 → 2425)
  current_year := SUBSTRING(NEW.academic_year FROM 1 FOR 4) || 
                  SUBSTRING(NEW.academic_year FROM 6 FOR 2);
  
  -- Compter les inscriptions de l'année pour cette école
  SELECT LPAD((COUNT(*) + 1)::TEXT, 4, '0')
  INTO sequence_number
  FROM inscriptions
  WHERE academic_year = NEW.academic_year
    AND school_id = NEW.school_id;
  
  -- Format: INS-2425-0001
  new_numero := 'INS-' || current_year || '-' || sequence_number;
  
  NEW.inscription_number := new_numero;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour génération automatique
DROP TRIGGER IF EXISTS trigger_generate_inscription_number ON inscriptions;
CREATE TRIGGER trigger_generate_inscription_number
  BEFORE INSERT ON inscriptions
  FOR EACH ROW
  WHEN (NEW.inscription_number IS NULL)
  EXECUTE FUNCTION generate_inscription_number();

-- ============================================================================
-- 4. INDEX POUR PERFORMANCE
-- ============================================================================

-- Index sur les champs fréquemment recherchés
CREATE INDEX IF NOT EXISTS idx_inscriptions_student_name 
  ON inscriptions(student_last_name, student_first_name);
CREATE INDEX IF NOT EXISTS idx_inscriptions_inscription_number 
  ON inscriptions(inscription_number);
CREATE INDEX IF NOT EXISTS idx_inscriptions_level 
  ON inscriptions(requested_level);
CREATE INDEX IF NOT EXISTS idx_inscriptions_status 
  ON inscriptions(status);
CREATE INDEX IF NOT EXISTS idx_inscriptions_academic_year 
  ON inscriptions(academic_year);
CREATE INDEX IF NOT EXISTS idx_inscriptions_school 
  ON inscriptions(school_id);
CREATE INDEX IF NOT EXISTS idx_inscriptions_submitted_at 
  ON inscriptions(submitted_at DESC);

-- Index composites
CREATE INDEX IF NOT EXISTS idx_inscriptions_level_status 
  ON inscriptions(requested_level, status);
CREATE INDEX IF NOT EXISTS idx_inscriptions_year_status 
  ON inscriptions(academic_year, status);

-- ============================================================================
-- 5. VUES POUR STATISTIQUES
-- ============================================================================

-- Vue : Statistiques par niveau
CREATE OR REPLACE VIEW inscriptions_stats_par_niveau AS
SELECT 
  requested_level as niveau,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'en_attente') as en_attente,
  COUNT(*) FILTER (WHERE status = 'validee') as validees,
  COUNT(*) FILTER (WHERE status = 'refusee') as refusees,
  SUM(frais_inscription + frais_scolarite) as revenus_potentiels,
  SUM(montant_paye) as revenus_percus,
  SUM(solde_restant) as soldes_restants
FROM inscriptions
GROUP BY requested_level
ORDER BY requested_level;

-- Vue : Statistiques par année académique
CREATE OR REPLACE VIEW inscriptions_stats_par_annee AS
SELECT 
  academic_year,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'en_attente') as en_attente,
  COUNT(*) FILTER (WHERE status = 'validee') as validees,
  COUNT(*) FILTER (WHERE status = 'refusee') as refusees,
  COUNT(*) FILTER (WHERE type_inscription = 'nouvelle') as nouvelles,
  COUNT(*) FILTER (WHERE type_inscription = 'reinscription') as reinscriptions,
  COUNT(*) FILTER (WHERE type_inscription = 'transfert') as transferts,
  SUM(montant_paye) as revenus_percus
FROM inscriptions
GROUP BY academic_year
ORDER BY academic_year DESC;

-- Vue : Statistiques par école
CREATE OR REPLACE VIEW inscriptions_stats_par_ecole AS
SELECT 
  school_id,
  academic_year,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'en_attente') as en_attente,
  COUNT(*) FILTER (WHERE status = 'validee') as validees,
  SUM(montant_paye) as revenus_percus,
  SUM(solde_restant) as soldes_restants
FROM inscriptions
GROUP BY school_id, academic_year
ORDER BY academic_year DESC, school_id;

-- ============================================================================
-- 6. FONCTIONS MÉTIER
-- ============================================================================

-- Fonction : Valider une inscription
CREATE OR REPLACE FUNCTION valider_inscription(
  p_inscription_id UUID,
  p_agent_id UUID,
  p_observations TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE inscriptions
  SET 
    status = 'validee',
    workflow_step = 'validation',
    validated_at = NOW(),
    validated_by = p_agent_id,
    observations = COALESCE(p_observations, observations),
    updated_at = NOW()
  WHERE id = p_inscription_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Fonction : Refuser une inscription
CREATE OR REPLACE FUNCTION refuser_inscription(
  p_inscription_id UUID,
  p_agent_id UUID,
  p_motif TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE inscriptions
  SET 
    status = 'refusee',
    workflow_step = 'refus',
    rejection_reason = p_motif,
    validated_by = p_agent_id,
    updated_at = NOW()
  WHERE id = p_inscription_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Fonction : Mettre à jour le statut de paiement
CREATE OR REPLACE FUNCTION update_paiement_inscription(
  p_inscription_id UUID,
  p_montant_paye DECIMAL,
  p_mode_paiement VARCHAR,
  p_reference VARCHAR,
  p_date_paiement DATE
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE inscriptions
  SET 
    montant_paye = p_montant_paye,
    mode_paiement = p_mode_paiement,
    reference_paiement = p_reference,
    date_paiement = p_date_paiement,
    updated_at = NOW()
  WHERE id = p_inscription_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. AMÉLIORATION DES CONTRAINTES
-- ============================================================================

-- Contrainte : Status valides
ALTER TABLE inscriptions DROP CONSTRAINT IF EXISTS inscriptions_status_check;
ALTER TABLE inscriptions ADD CONSTRAINT inscriptions_status_check 
  CHECK (status IN ('en_attente', 'validee', 'refusee', 'brouillon'));

-- Contrainte : Workflow steps valides
ALTER TABLE inscriptions DROP CONSTRAINT IF EXISTS inscriptions_workflow_check;
ALTER TABLE inscriptions ADD CONSTRAINT inscriptions_workflow_check 
  CHECK (workflow_step IN ('soumission', 'validation', 'refus', 'brouillon'));

-- ============================================================================
-- 8. COMMENTAIRES POUR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE inscriptions IS 'Table des inscriptions scolaires - Tous niveaux d''enseignement';
COMMENT ON COLUMN inscriptions.inscription_number IS 'Numéro unique auto-généré (format: INS-2425-0001)';
COMMENT ON COLUMN inscriptions.solde_restant IS 'Calculé automatiquement: (frais totaux) - montant_payé';
COMMENT ON COLUMN inscriptions.status IS 'Statut: en_attente, validee, refusee, brouillon';
COMMENT ON COLUMN inscriptions.type_inscription IS 'Type: nouvelle, reinscription, transfert';

-- ============================================================================
-- 9. DONNÉES DE TEST (OPTIONNEL)
-- ============================================================================

-- Mettre à jour les données existantes avec les nouveaux champs
UPDATE inscriptions 
SET 
  type_inscription = 'nouvelle',
  student_nationality = 'Congolaise'
WHERE type_inscription IS NULL;

-- Calculer les soldes restants pour les inscriptions existantes
UPDATE inscriptions
SET solde_restant = (
  COALESCE(frais_inscription, 0) + 
  COALESCE(frais_scolarite, 0) + 
  COALESCE(frais_cantine, 0) + 
  COALESCE(frais_transport, 0)
) - COALESCE(montant_paye, 0)
WHERE solde_restant IS NULL;

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================

-- Vérification
SELECT 
  'Migration terminée' as status,
  COUNT(*) as total_inscriptions,
  COUNT(*) FILTER (WHERE solde_restant IS NOT NULL) as avec_solde_calcule
FROM inscriptions;
