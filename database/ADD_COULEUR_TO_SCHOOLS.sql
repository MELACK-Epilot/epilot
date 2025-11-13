-- ============================================
-- Ajouter le champ couleur_principale à la table schools
-- Pour différencier visuellement les écoles
-- ============================================

-- Ajouter la colonne couleur_principale
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS couleur_principale VARCHAR(7) DEFAULT '#1D3557' CHECK (couleur_principale ~ '^#[0-9A-Fa-f]{6}$');

-- Commentaire
COMMENT ON COLUMN schools.couleur_principale IS 'Couleur principale de l''école au format hexadécimal (#RRGGBB) pour la différenciation visuelle';

-- Index pour recherche par couleur (optionnel)
CREATE INDEX IF NOT EXISTS idx_schools_couleur ON schools(couleur_principale);

-- Mettre à jour les écoles existantes avec des couleurs aléatoires
UPDATE schools 
SET couleur_principale = (
  CASE (hashtext(id::text) % 10)
    WHEN 0 THEN '#1D3557'  -- Bleu E-Pilot
    WHEN 1 THEN '#2A9D8F'  -- Vert E-Pilot
    WHEN 2 THEN '#E9C46A'  -- Or E-Pilot
    WHEN 3 THEN '#E63946'  -- Rouge
    WHEN 4 THEN '#3B82F6'  -- Bleu Ciel
    WHEN 5 THEN '#10B981'  -- Vert Forêt
    WHEN 6 THEN '#8B5CF6'  -- Violet
    WHEN 7 THEN '#F59E0B'  -- Orange
    WHEN 8 THEN '#EC4899'  -- Rose
    ELSE '#6366F1'         -- Indigo
  END
)
WHERE couleur_principale IS NULL OR couleur_principale = '#1D3557';
