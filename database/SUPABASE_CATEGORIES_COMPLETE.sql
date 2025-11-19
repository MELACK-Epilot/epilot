-- =====================================================
-- CATÉGORIES MÉTIERS E-PILOT CONGO - VERSION COMPLÈTE
-- =====================================================
-- Date: 17 novembre 2025
-- Version: 2.0 - 9 CATÉGORIES (ajout Communication)
-- Description: Catégories métiers pour organiser les 50 modules pédagogiques

-- =====================================================
-- 1. CRÉATION TABLE (si n'existe pas)
-- =====================================================
CREATE TABLE IF NOT EXISTS business_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50) NOT NULL,
  color VARCHAR(7) NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  module_count INTEGER DEFAULT 0,
  is_core BOOLEAN DEFAULT false,
  required_plan VARCHAR(30) NOT NULL DEFAULT 'gratuit',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_business_categories_slug ON business_categories(slug);
CREATE INDEX IF NOT EXISTS idx_business_categories_status ON business_categories(status);
CREATE INDEX IF NOT EXISTS idx_business_categories_required_plan ON business_categories(required_plan);

-- =====================================================
-- 3. INSERTION DES 9 CATÉGORIES MÉTIERS
-- =====================================================

-- Catégorie 1: Scolarité & Admissions
INSERT INTO business_categories (name, slug, description, icon, color, order_index, is_core, required_plan, status)
VALUES (
  'Scolarité & Admissions',
  'scolarite-admissions',
  'Gestion complète des inscriptions, dossiers élèves, admissions et réinscriptions. Suivi des parcours scolaires.',
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
  'Saisie des notes, bulletins, emplois du temps, cahier de texte et ressources pédagogiques. Suivi des apprentissages.',
  'BookOpen',
  '#8B5CF6',
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
  'Gestion des frais scolaires, paiements, factures, comptabilité générale et analytique. Suivi budgétaire.',
  'DollarSign',
  '#10B981',
  3,
  false,
  'premium',
  'active'
) ON CONFLICT (slug) DO NOTHING;

-- Catégorie 4: Ressources Humaines
INSERT INTO business_categories (name, slug, description, icon, color, order_index, is_core, required_plan, status)
VALUES (
  'Ressources Humaines',
  'ressources-humaines',
  'Gestion du personnel enseignant et administratif, paie, congés, absences et évaluations. Planification RH.',
  'Users',
  '#F59E0B',
  4,
  false,
  'pro',
  'active'
) ON CONFLICT (slug) DO NOTHING;

-- Catégorie 5: Vie Scolaire & Discipline
INSERT INTO business_categories (name, slug, description, icon, color, order_index, is_core, required_plan, status)
VALUES (
  'Vie Scolaire & Discipline',
  'vie-scolaire-discipline',
  'Suivi des absences, retards, sanctions, comportement et vie scolaire. Gestion disciplinaire et conseil de classe.',
  'ClipboardCheck',
  '#EF4444',
  5,
  true,
  'gratuit',
  'active'
) ON CONFLICT (slug) DO NOTHING;

-- Catégorie 6: Services & Infrastructures
INSERT INTO business_categories (name, slug, description, icon, color, order_index, is_core, required_plan, status)
VALUES (
  'Services & Infrastructures',
  'services-infrastructures',
  'Gestion de la cantine, transport scolaire, bibliothèque, salles de classe et équipements. Maintenance.',
  'Building2',
  '#3B82F6',
  6,
  false,
  'premium',
  'active'
) ON CONFLICT (slug) DO NOTHING;

-- Catégorie 7: Sécurité & Accès
INSERT INTO business_categories (name, slug, description, icon, color, order_index, is_core, required_plan, status)
VALUES (
  'Sécurité & Accès',
  'securite-acces',
  'Contrôle d''accès, badges, vidéosurveillance, gestion des entrées/sorties. Sécurité des locaux.',
  'Shield',
  '#6366F1',
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

-- Catégorie 9: Communication (NOUVELLE!)
INSERT INTO business_categories (name, slug, description, icon, color, order_index, is_core, required_plan, status)
VALUES (
  'Communication',
  'communication',
  'Messagerie interne, notifications push, SMS aux parents, emails automatiques et système de tickets support.',
  'MessageSquare',
  '#EC4899',
  9,
  false,
  'premium',
  'active'
) ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 4. VÉRIFICATION
-- =====================================================
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM business_categories
  WHERE status = 'active';

  RAISE NOTICE '';
  RAISE NOTICE '✅ CATÉGORIES CRÉÉES: %', v_count;
  RAISE NOTICE '';
  
  -- Afficher toutes les catégories
  FOR rec IN (
    SELECT name, icon, required_plan, is_core
    FROM business_categories
    WHERE status = 'active'
    ORDER BY order_index
  ) LOOP
    RAISE NOTICE '   % % - Plan: % - Core: %', 
      rec.icon, rec.name, rec.required_plan, rec.is_core;
  END LOOP;
  
  RAISE NOTICE '';
END $$;

-- =====================================================
-- 5. COMMENTAIRES
-- =====================================================
COMMENT ON TABLE business_categories IS 'Catégories métiers pour organiser les modules E-Pilot (9 catégories)';
COMMENT ON COLUMN business_categories.slug IS 'Identifiant unique de la catégorie (URL-friendly)';
COMMENT ON COLUMN business_categories.icon IS 'Nom de l''icône Lucide React à utiliser';
COMMENT ON COLUMN business_categories.color IS 'Couleur hex pour l''affichage visuel';
COMMENT ON COLUMN business_categories.is_core IS 'Catégorie essentielle au fonctionnement de base';
COMMENT ON COLUMN business_categories.required_plan IS 'Plan minimum requis pour accéder à cette catégorie';
COMMENT ON COLUMN business_categories.module_count IS 'Nombre de modules dans cette catégorie (calculé automatiquement)';
