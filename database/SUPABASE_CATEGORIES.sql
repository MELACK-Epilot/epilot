-- =====================================================
-- E-PILOT CONGO - CATÉGORIES MÉTIERS
-- 8 catégories principales pour organiser les modules
-- =====================================================

-- 1. TABLE: business_categories
-- =====================================================
CREATE TABLE IF NOT EXISTS business_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon VARCHAR(50) NOT NULL, -- Nom de l'icône Lucide
  color VARCHAR(7) NOT NULL, -- Code couleur hex
  order_index INTEGER NOT NULL DEFAULT 0,
  module_count INTEGER DEFAULT 0,
  is_core BOOLEAN DEFAULT false, -- Catégorie essentielle
  required_plan VARCHAR(30) NOT NULL DEFAULT 'gratuit',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT business_categories_required_plan_check CHECK (required_plan IN ('gratuit', 'premium', 'pro', 'institutionnel')),
  CONSTRAINT business_categories_status_check CHECK (status IN ('active', 'inactive', 'beta'))
);

-- 2. INDEX
-- =====================================================
CREATE INDEX idx_business_categories_slug ON business_categories(slug);
CREATE INDEX idx_business_categories_status ON business_categories(status);
CREATE INDEX idx_business_categories_order ON business_categories(order_index);

-- 3. TRIGGER pour updated_at
-- =====================================================
CREATE TRIGGER update_business_categories_updated_at BEFORE UPDATE ON business_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE business_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin full access on business_categories" ON business_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Lecture publique pour les autres utilisateurs authentifiés
CREATE POLICY "Authenticated users can view categories" ON business_categories
  FOR SELECT USING (auth.role() = 'authenticated');

-- 5. INSERTION DES 8 CATÉGORIES MÉTIERS
-- =====================================================

-- Catégorie 1: Scolarité & Admissions
INSERT INTO business_categories (name, slug, description, icon, color, order_index, is_core, required_plan, status)
VALUES (
  'Scolarité & Admissions',
  'scolarite-admissions',
  'Gestion complète des inscriptions, admissions et suivi des élèves. Centralisation des dossiers scolaires et création de badges personnalisés.',
  'GraduationCap',
  '#2A9D8F',
  1,
  true,
  'gratuit',
  'active'
) ON CONFLICT (slug) DO NOTHING;

-- Catégorie 2: Pédagogie & Évaluations
INSERT INTO business_categories (name, slug, description, icon, color, order_index, is_core, required_plan, status)
VALUES (
  'Pédagogie & Évaluations',
  'pedagogie-evaluations',
  'Gestion des classes, matières, emplois du temps, notes, bulletins et examens. Outils pédagogiques complets pour les enseignants.',
  'BookOpen',
  '#1D3557',
  2,
  true,
  'gratuit',
  'active'
) ON CONFLICT (slug) DO NOTHING;

-- Catégorie 3: Finances & Comptabilité
INSERT INTO business_categories (name, slug, description, icon, color, order_index, is_core, required_plan, status)
VALUES (
  'Finances & Comptabilité',
  'finances-comptabilite',
  'Gestion des frais de scolarité, paiements, caisse, comptabilité générale et rapports financiers. Suivi des arriérés et relances automatiques.',
  'DollarSign',
  '#E9C46A',
  3,
  true,
  'premium',
  'active'
) ON CONFLICT (slug) DO NOTHING;

-- Catégorie 4: Ressources Humaines
INSERT INTO business_categories (name, slug, description, icon, color, order_index, is_core, required_plan, status)
VALUES (
  'Ressources Humaines',
  'ressources-humaines',
  'Gestion complète du personnel (enseignants, administratifs, service). Contrats, congés, paie et évaluation du personnel.',
  'Users',
  '#457B9D',
  4,
  false,
  'premium',
  'active'
) ON CONFLICT (slug) DO NOTHING;

-- Catégorie 5: Vie Scolaire & Discipline
INSERT INTO business_categories (name, slug, description, icon, color, order_index, is_core, required_plan, status)
VALUES (
  'Vie Scolaire & Discipline',
  'vie-scolaire-discipline',
  'Suivi des absences, retards, discipline et sanctions. Suivi médical des élèves et communication avec les parents.',
  'Shield',
  '#E63946',
  5,
  false,
  'premium',
  'active'
) ON CONFLICT (slug) DO NOTHING;

-- Catégorie 6: Services & Infrastructures
INSERT INTO business_categories (name, slug, description, icon, color, order_index, is_core, required_plan, status)
VALUES (
  'Services & Infrastructures',
  'services-infrastructures',
  'Gestion de la cantine, transport scolaire, bibliothèque, infirmerie, maintenance et réservation des salles.',
  'Building2',
  '#F77F00',
  6,
  false,
  'pro',
  'active'
) ON CONFLICT (slug) DO NOTHING;

-- Catégorie 7: Sécurité & Accès
INSERT INTO business_categories (name, slug, description, icon, color, order_index, is_core, required_plan, status)
VALUES (
  'Sécurité & Accès',
  'securite-acces',
  'Gestion des rôles, permissions, utilisateurs et contrôle d''accès. Sécurité renforcée de la plateforme.',
  'Lock',
  '#6A4C93',
  7,
  true,
  'gratuit',
  'active'
) ON CONFLICT (slug) DO NOTHING;

-- Catégorie 8: Documents & Rapports
INSERT INTO business_categories (name, slug, description, icon, color, order_index, is_core, required_plan, status)
VALUES (
  'Documents & Rapports',
  'documents-rapports',
  'Génération automatique de feuilles de rapport, listes d''admission et rapports personnalisés. Export PDF et Excel.',
  'FileText',
  '#06A77D',
  8,
  false,
  'premium',
  'active'
) ON CONFLICT (slug) DO NOTHING;

-- 6. COMMENTAIRES
-- =====================================================
COMMENT ON TABLE business_categories IS 'Catégories métiers pour organiser les modules E-Pilot';
COMMENT ON COLUMN business_categories.slug IS 'Identifiant unique de la catégorie (URL-friendly)';
COMMENT ON COLUMN business_categories.icon IS 'Nom de l''icône Lucide React à utiliser';
COMMENT ON COLUMN business_categories.color IS 'Couleur hex pour l''affichage visuel';
COMMENT ON COLUMN business_categories.is_core IS 'Catégorie essentielle au fonctionnement de base';
COMMENT ON COLUMN business_categories.required_plan IS 'Plan minimum requis pour accéder à cette catégorie';
COMMENT ON COLUMN business_categories.module_count IS 'Nombre de modules dans cette catégorie (calculé automatiquement)';
