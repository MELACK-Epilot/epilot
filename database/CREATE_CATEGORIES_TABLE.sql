-- ============================================
-- CRÉATION TABLE CATEGORIES
-- ============================================
-- Date: 4 Novembre 2025
-- Objectif: Créer la table des catégories métiers
-- ============================================

BEGIN;

-- ============================================
-- 1️⃣ TABLE categories
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(100),
  color VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- Commentaires
COMMENT ON TABLE categories IS 'Catégories métiers (8 catégories définies par super_admin)';
COMMENT ON COLUMN categories.name IS 'Nom de la catégorie (ex: Pédagogie, Administration)';
COMMENT ON COLUMN categories.slug IS 'Identifiant unique URL-friendly';
COMMENT ON COLUMN categories.icon IS 'Nom de l''icône Lucide React';
COMMENT ON COLUMN categories.color IS 'Couleur hexadécimale pour l''UI';
COMMENT ON COLUMN categories.display_order IS 'Ordre d''affichage';

-- ============================================
-- 2️⃣ TRIGGER updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_updated_at();

-- ============================================
-- 3️⃣ POLITIQUES RLS
-- ============================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les catégories actives
DROP POLICY IF EXISTS "Anyone can view active categories" ON categories;
CREATE POLICY "Anyone can view active categories"
  ON categories FOR SELECT
  USING (status = 'active');

-- Seul super_admin peut créer/modifier/supprimer
DROP POLICY IF EXISTS "Super admin can manage categories" ON categories;
CREATE POLICY "Super admin can manage categories"
  ON categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- ============================================
-- 4️⃣ DONNÉES INITIALES (8 Catégories)
-- ============================================
INSERT INTO categories (name, slug, description, icon, color, display_order, status) VALUES
  ('Pédagogie', 'pedagogie', 'Gestion des enseignements, notes, absences, emploi du temps', 'BookOpen', '#2A9D8F', 1, 'active'),
  ('Administration', 'administration', 'Gestion administrative, secrétariat, documents', 'FileText', '#1D3557', 2, 'active'),
  ('Finances', 'finances', 'Gestion financière, paiements, comptabilité', 'DollarSign', '#E63946', 3, 'active'),
  ('Vie Scolaire', 'vie-scolaire', 'CPE, discipline, activités extra-scolaires', 'Users', '#F4A261', 4, 'active'),
  ('Ressources Humaines', 'ressources-humaines', 'Gestion du personnel, recrutement, paie', 'UserCheck', '#264653', 5, 'active'),
  ('Communication', 'communication', 'Communication interne/externe, newsletters', 'MessageSquare', '#E76F51', 6, 'active'),
  ('Orientation', 'orientation', 'Orientation scolaire et professionnelle', 'Compass', '#8338EC', 7, 'active'),
  ('Santé', 'sante', 'Infirmerie, suivi médical', 'Heart', '#06D6A0', 8, 'active')
ON CONFLICT (slug) DO NOTHING;

COMMIT;

-- ============================================
-- 5️⃣ VÉRIFICATION
-- ============================================
SELECT 
  id,
  name,
  slug,
  icon,
  color,
  display_order,
  status
FROM categories
ORDER BY display_order;

-- ✅ RÉSULTAT ATTENDU : 8 catégories créées
