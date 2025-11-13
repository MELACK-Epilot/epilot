-- ============================================================================
-- SCHÉMA COMPLET MODULE INSCRIPTIONS E-PILOT CONGO
-- Tous les niveaux d'enseignement (Préscolaire → Supérieur)
-- ============================================================================

-- 1. TABLE PRINCIPALE : inscriptions
-- ============================================================================
CREATE TABLE IF NOT EXISTS inscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_inscription VARCHAR(20) UNIQUE NOT NULL,
  
  -- ========================================================================
  -- 1. INFORMATIONS GÉNÉRALES DE L'ÉLÈVE
  -- ========================================================================
  photo_url TEXT,
  nom VARCHAR(100) NOT NULL,
  postnom VARCHAR(100),
  prenom VARCHAR(100) NOT NULL,
  sexe CHAR(1) CHECK (sexe IN ('M', 'F')) NOT NULL,
  date_naissance DATE NOT NULL,
  lieu_naissance VARCHAR(200),
  nationalite VARCHAR(100) DEFAULT 'Congolaise',
  identifiant_national VARCHAR(50),
  adresse TEXT,
  telephone VARCHAR(20),
  email VARCHAR(100),
  
  -- ========================================================================
  -- 2. INFORMATIONS SUR LES PARENTS / TUTEURS
  -- ========================================================================
  -- Père
  nom_pere VARCHAR(200),
  profession_pere VARCHAR(100),
  telephone_pere VARCHAR(20) NOT NULL,
  
  -- Mère
  nom_mere VARCHAR(200),
  profession_mere VARCHAR(100),
  telephone_mere VARCHAR(20) NOT NULL,
  
  -- Tuteur (optionnel)
  nom_tuteur VARCHAR(200),
  lien_parente VARCHAR(100),
  telephone_tuteur VARCHAR(20),
  adresse_tuteur TEXT,
  
  -- ========================================================================
  -- 3. INFORMATIONS SCOLAIRES
  -- ========================================================================
  annee_academique VARCHAR(20) NOT NULL,
  
  -- Niveau d'enseignement
  niveau VARCHAR(50) NOT NULL CHECK (niveau IN (
    'Préscolaire',
    'Primaire',
    'Collège',
    'Lycée Général',
    'Lycée Technique',
    'Enseignement Professionnel',
    'Enseignement Supérieur'
  )),
  
  -- Classe / Niveau d'étude
  classe VARCHAR(50) NOT NULL,
  
  -- Filière / Section (optionnel selon niveau)
  filiere VARCHAR(100),
  
  -- Option / Spécialité (optionnel)
  option VARCHAR(100),
  
  -- Type d'inscription
  type_inscription VARCHAR(20) CHECK (type_inscription IN (
    'nouvelle',
    'reinscription',
    'transfert'
  )) NOT NULL,
  
  -- Si transfert
  ancienne_ecole VARCHAR(200),
  
  -- Moyenne d'admission (optionnel)
  moyenne_admission DECIMAL(4,2),
  
  -- Numéro du dossier papier (optionnel)
  numero_dossier VARCHAR(50),
  
  -- ========================================================================
  -- 4. INFORMATIONS FINANCIÈRES
  -- ========================================================================
  droit_inscription DECIMAL(10,2) NOT NULL DEFAULT 0,
  frais_scolarite DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Mode de paiement
  mode_paiement VARCHAR(50) CHECK (mode_paiement IN (
    'Espèces',
    'Mobile Money',
    'Virement bancaire',
    'Chèque'
  )),
  
  montant_paye DECIMAL(10,2) DEFAULT 0,
  solde_restant DECIMAL(10,2) GENERATED ALWAYS AS (
    (droit_inscription + frais_scolarite) - COALESCE(montant_paye, 0)
  ) STORED,
  
  reference_paiement VARCHAR(100),
  date_paiement DATE,
  
  -- ========================================================================
  -- 5. DOCUMENTS À JOINDRE (URLs Supabase Storage)
  -- ========================================================================
  acte_naissance_url TEXT,
  photo_identite_url TEXT,
  certificat_transfert_url TEXT,
  releve_notes_url TEXT,
  carnet_vaccination_url TEXT,
  
  -- ========================================================================
  -- 6. GESTION INTERNE (ADMINISTRATION)
  -- ========================================================================
  agent_inscription_id UUID REFERENCES users(id),
  date_enregistrement TIMESTAMPTZ DEFAULT NOW(),
  
  -- Statut de validation
  statut VARCHAR(20) DEFAULT 'en_attente' CHECK (statut IN (
    'en_attente',
    'validee',
    'refusee'
  )),
  
  observations TEXT,
  
  -- ========================================================================
  -- RELATIONS & METADATA
  -- ========================================================================
  school_group_id UUID REFERENCES school_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index pour performance
  CONSTRAINT fk_school_group FOREIGN KEY (school_group_id) 
    REFERENCES school_groups(id) ON DELETE CASCADE,
  CONSTRAINT fk_agent FOREIGN KEY (agent_inscription_id) 
    REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- 2. INDEX POUR PERFORMANCE
-- ============================================================================

-- Index sur les champs fréquemment recherchés
CREATE INDEX IF NOT EXISTS idx_inscriptions_numero ON inscriptions(numero_inscription);
CREATE INDEX IF NOT EXISTS idx_inscriptions_nom ON inscriptions(nom);
CREATE INDEX IF NOT EXISTS idx_inscriptions_prenom ON inscriptions(prenom);
CREATE INDEX IF NOT EXISTS idx_inscriptions_niveau ON inscriptions(niveau);
CREATE INDEX IF NOT EXISTS idx_inscriptions_classe ON inscriptions(classe);
CREATE INDEX IF NOT EXISTS idx_inscriptions_statut ON inscriptions(statut);
CREATE INDEX IF NOT EXISTS idx_inscriptions_annee ON inscriptions(annee_academique);
CREATE INDEX IF NOT EXISTS idx_inscriptions_school_group ON inscriptions(school_group_id);
CREATE INDEX IF NOT EXISTS idx_inscriptions_created_at ON inscriptions(created_at DESC);

-- Index composites pour requêtes complexes
CREATE INDEX IF NOT EXISTS idx_inscriptions_niveau_classe ON inscriptions(niveau, classe);
CREATE INDEX IF NOT EXISTS idx_inscriptions_statut_annee ON inscriptions(statut, annee_academique);

-- ============================================================================
-- 3. FONCTION : GÉNÉRATION AUTOMATIQUE DU NUMÉRO D'INSCRIPTION
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_numero_inscription()
RETURNS TRIGGER AS $$
DECLARE
  current_year TEXT;
  sequence_number TEXT;
  new_numero TEXT;
BEGIN
  -- Année académique actuelle (ex: 2024-2025 → 2425)
  current_year := SUBSTRING(NEW.annee_academique FROM 1 FOR 4) || 
                  SUBSTRING(NEW.annee_academique FROM 6 FOR 2);
  
  -- Compter les inscriptions de l'année
  SELECT LPAD((COUNT(*) + 1)::TEXT, 5, '0')
  INTO sequence_number
  FROM inscriptions
  WHERE annee_academique = NEW.annee_academique
    AND school_group_id = NEW.school_group_id;
  
  -- Format: INS-2425-00001
  new_numero := 'INS-' || current_year || '-' || sequence_number;
  
  NEW.numero_inscription := new_numero;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour générer le numéro automatiquement
DROP TRIGGER IF EXISTS trigger_generate_numero_inscription ON inscriptions;
CREATE TRIGGER trigger_generate_numero_inscription
  BEFORE INSERT ON inscriptions
  FOR EACH ROW
  WHEN (NEW.numero_inscription IS NULL)
  EXECUTE FUNCTION generate_numero_inscription();

-- ============================================================================
-- 4. FONCTION : MISE À JOUR AUTOMATIQUE DU TIMESTAMP
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_inscriptions_updated_at ON inscriptions;
CREATE TRIGGER trigger_update_inscriptions_updated_at
  BEFORE UPDATE ON inscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. VUE : STATISTIQUES PAR NIVEAU
-- ============================================================================

CREATE OR REPLACE VIEW inscriptions_stats_par_niveau AS
SELECT 
  niveau,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE statut = 'en_attente') as en_attente,
  COUNT(*) FILTER (WHERE statut = 'validee') as validees,
  COUNT(*) FILTER (WHERE statut = 'refusee') as refusees,
  SUM(droit_inscription + frais_scolarite) as revenus_potentiels,
  SUM(montant_paye) as revenus_percus,
  SUM(solde_restant) as soldes_restants
FROM inscriptions
GROUP BY niveau
ORDER BY 
  CASE niveau
    WHEN 'Préscolaire' THEN 1
    WHEN 'Primaire' THEN 2
    WHEN 'Collège' THEN 3
    WHEN 'Lycée Général' THEN 4
    WHEN 'Lycée Technique' THEN 5
    WHEN 'Enseignement Professionnel' THEN 6
    WHEN 'Enseignement Supérieur' THEN 7
  END;

-- ============================================================================
-- 6. VUE : STATISTIQUES PAR ANNÉE ACADÉMIQUE
-- ============================================================================

CREATE OR REPLACE VIEW inscriptions_stats_par_annee AS
SELECT 
  annee_academique,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE statut = 'en_attente') as en_attente,
  COUNT(*) FILTER (WHERE statut = 'validee') as validees,
  COUNT(*) FILTER (WHERE statut = 'refusee') as refusees,
  COUNT(*) FILTER (WHERE type_inscription = 'nouvelle') as nouvelles,
  COUNT(*) FILTER (WHERE type_inscription = 'reinscription') as reinscriptions,
  COUNT(*) FILTER (WHERE type_inscription = 'transfert') as transferts,
  SUM(montant_paye) as revenus_percus
FROM inscriptions
GROUP BY annee_academique
ORDER BY annee_academique DESC;

-- ============================================================================
-- 7. FONCTION : VALIDATION AUTOMATIQUE DES INSCRIPTIONS
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
    observations = COALESCE(p_observations, observations),
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
      jsonb_build_object('observations', p_observations)
    );
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. FONCTION : REFUS D'INSCRIPTION
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
    observations = p_motif,
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
      jsonb_build_object('motif', p_motif)
    );
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS
ALTER TABLE inscriptions ENABLE ROW LEVEL SECURITY;

-- Policy : Les super_admin voient tout
CREATE POLICY "Super admins can view all inscriptions"
  ON inscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Policy : Les admin_groupe voient leurs inscriptions
CREATE POLICY "School group admins can view their inscriptions"
  ON inscriptions FOR SELECT
  TO authenticated
  USING (
    school_group_id IN (
      SELECT id FROM school_groups
      WHERE admin_user_id = auth.uid()
    )
  );

-- Policy : Insertion (admin_groupe et super_admin)
CREATE POLICY "Admins can insert inscriptions"
  ON inscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin_groupe')
    )
  );

-- Policy : Mise à jour (admin_groupe et super_admin)
CREATE POLICY "Admins can update inscriptions"
  ON inscriptions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin_groupe')
    )
  );

-- Policy : Suppression (super_admin uniquement)
CREATE POLICY "Only super admins can delete inscriptions"
  ON inscriptions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- ============================================================================
-- 10. BUCKET SUPABASE STORAGE POUR LES DOCUMENTS
-- ============================================================================

-- Créer le bucket 'inscriptions-documents' (à exécuter dans Supabase Dashboard)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('inscriptions-documents', 'inscriptions-documents', false);

-- Policy : Upload de fichiers
-- CREATE POLICY "Admins can upload inscription documents"
--   ON storage.objects FOR INSERT
--   TO authenticated
--   WITH CHECK (
--     bucket_id = 'inscriptions-documents'
--     AND EXISTS (
--       SELECT 1 FROM users
--       WHERE users.id = auth.uid()
--       AND users.role IN ('super_admin', 'admin_groupe')
--     )
--   );

-- Policy : Lecture des fichiers
-- CREATE POLICY "Admins can view inscription documents"
--   ON storage.objects FOR SELECT
--   TO authenticated
--   USING (
--     bucket_id = 'inscriptions-documents'
--     AND EXISTS (
--       SELECT 1 FROM users
--       WHERE users.id = auth.uid()
--       AND users.role IN ('super_admin', 'admin_groupe')
--     )
--   );

-- ============================================================================
-- 11. DONNÉES DE TEST (OPTIONNEL)
-- ============================================================================

-- Exemple d'insertion (à adapter selon vos besoins)
/*
INSERT INTO inscriptions (
  nom, prenom, sexe, date_naissance, telephone_pere, telephone_mere,
  annee_academique, niveau, classe, type_inscription,
  droit_inscription, frais_scolarite, school_group_id
) VALUES (
  'MBEMBA', 'Jean', 'M', '2015-05-15', '+242061234567', '+242069876543',
  '2024-2025', 'Primaire', 'CE2', 'nouvelle',
  25000, 150000, 'uuid-du-groupe-scolaire'
);
*/

-- ============================================================================
-- FIN DU SCHÉMA
-- ============================================================================

COMMENT ON TABLE inscriptions IS 'Table principale des inscriptions scolaires - Tous niveaux';
COMMENT ON COLUMN inscriptions.numero_inscription IS 'Numéro unique auto-généré (format: INS-2425-00001)';
COMMENT ON COLUMN inscriptions.solde_restant IS 'Calculé automatiquement: (droit + frais) - montant_payé';
COMMENT ON COLUMN inscriptions.statut IS 'Statut de validation: en_attente, validee, refusee';
