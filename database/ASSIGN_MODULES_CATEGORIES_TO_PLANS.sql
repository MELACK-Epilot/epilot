-- ============================================================================
-- ASSIGNATION INTELLIGENTE DES MODULES ET CATÉGORIES AUX PLANS
-- ============================================================================
-- Date: 24 Novembre 2025
-- Objectif: Créer une hiérarchie cohérente selon les meilleures pratiques SaaS
-- ============================================================================

BEGIN;

-- ============================================================================
-- ÉTAPE 1: NETTOYER LES ASSIGNATIONS EXISTANTES
-- ============================================================================

DELETE FROM plan_modules;
DELETE FROM plan_categories;

-- ============================================================================
-- ÉTAPE 2: DÉFINIR LA STRATÉGIE D'ASSIGNATION
-- ============================================================================

-- PHILOSOPHIE:
-- GRATUIT: Fonctionnalités essentielles pour démarrer (modules is_core = true)
-- PREMIUM: Gestion complète d'une école (modules standard + quelques premium)
-- PRO: Fonctionnalités avancées + API + Multi-écoles (tous modules sauf ultra-premium)
-- INSTITUTIONNEL: Tout inclus + personnalisation + support dédié

-- ============================================================================
-- ÉTAPE 3: ASSIGNER LES CATÉGORIES AUX PLANS
-- ============================================================================

-- PLAN GRATUIT: 3 catégories essentielles
INSERT INTO plan_categories (plan_id, category_id)
SELECT 
  sp.id,
  bc.id
FROM subscription_plans sp
CROSS JOIN business_categories bc
WHERE sp.slug = 'gratuit'
  AND bc.slug IN (
    'scolarite-admissions',      -- Gestion de base des élèves
    'pedagogie-evaluations',     -- Notes et bulletins
    'finances-comptabilite'      -- Paiements essentiels
  )
ON CONFLICT DO NOTHING;

-- PLAN PREMIUM: 6 catégories (gestion complète)
INSERT INTO plan_categories (plan_id, category_id)
SELECT 
  sp.id,
  bc.id
FROM subscription_plans sp
CROSS JOIN business_categories bc
WHERE sp.slug = 'premium'
  AND bc.slug IN (
    'scolarite-admissions',
    'pedagogie-evaluations',
    'finances-comptabilite',
    'ressources-humaines',       -- Gestion du personnel
    'vie-scolaire-discipline',   -- Absences, retards
    'services-infrastructures'   -- Cantine, bibliothèque
  )
ON CONFLICT DO NOTHING;

-- PLAN PRO: 8 catégories (toutes sauf ultra-premium)
INSERT INTO plan_categories (plan_id, category_id)
SELECT 
  sp.id,
  bc.id
FROM subscription_plans sp
CROSS JOIN business_categories bc
WHERE sp.slug = 'pro'
  AND bc.slug IN (
    'scolarite-admissions',
    'pedagogie-evaluations',
    'finances-comptabilite',
    'ressources-humaines',
    'vie-scolaire-discipline',
    'services-infrastructures',
    'securite-acces',           -- Gestion avancée des permissions
    'documents-rapports'        -- Rapports avancés
  )
ON CONFLICT DO NOTHING;

-- PLAN INSTITUTIONNEL: TOUTES les catégories
INSERT INTO plan_categories (plan_id, category_id)
SELECT 
  sp.id,
  bc.id
FROM subscription_plans sp
CROSS JOIN business_categories bc
WHERE sp.slug = 'institutionnel'
  AND bc.status = 'active'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ÉTAPE 4: ASSIGNER LES MODULES AUX PLANS
-- ============================================================================

-- ============================================================================
-- PLAN GRATUIT: Modules essentiels uniquement (is_core = true)
-- ============================================================================
INSERT INTO plan_modules (plan_id, module_id)
SELECT 
  sp.id,
  m.id
FROM subscription_plans sp
CROSS JOIN modules m
JOIN business_categories bc ON m.category_id = bc.id
WHERE sp.slug = 'gratuit'
  AND m.status = 'active'
  AND m.is_core = true
  AND bc.slug IN ('scolarite-admissions', 'pedagogie-evaluations', 'finances-comptabilite')
  AND m.slug IN (
    -- Scolarité (3 modules)
    'gestion-inscriptions',
    'admission-eleves',
    'suivi-eleves',
    
    -- Pédagogie (4 modules)
    'gestion-classes',
    'gestion-matieres',
    'notes-evaluations',
    'bulletins-scolaires',
    
    -- Finances (3 modules)
    'frais-scolarite',
    'paiements-recus',
    'caisse-scolaire'
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PLAN PREMIUM: Modules standard (is_core + quelques premium)
-- ============================================================================
INSERT INTO plan_modules (plan_id, module_id)
SELECT 
  sp.id,
  m.id
FROM subscription_plans sp
CROSS JOIN modules m
JOIN business_categories bc ON m.category_id = bc.id
WHERE sp.slug = 'premium'
  AND m.status = 'active'
  AND bc.slug IN (
    'scolarite-admissions',
    'pedagogie-evaluations',
    'finances-comptabilite',
    'ressources-humaines',
    'vie-scolaire-discipline',
    'services-infrastructures'
  )
  AND (
    m.is_core = true 
    OR m.slug IN (
      -- Modules premium essentiels
      'emplois-du-temps',
      'cahier-textes',
      'releves-notes',
      'gestion-enseignants',
      'suivi-absences',
      'suivi-retards',
      'gestion-cantine',
      'bibliotheque-cdi',
      'comptabilite-generale',
      'rapports-financiers'
    )
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PLAN PRO: Modules avancés (tous sauf ultra-premium)
-- ============================================================================
INSERT INTO plan_modules (plan_id, module_id)
SELECT 
  sp.id,
  m.id
FROM subscription_plans sp
CROSS JOIN modules m
JOIN business_categories bc ON m.category_id = bc.id
WHERE sp.slug = 'pro'
  AND m.status = 'active'
  AND bc.slug IN (
    'scolarite-admissions',
    'pedagogie-evaluations',
    'finances-comptabilite',
    'ressources-humaines',
    'vie-scolaire-discipline',
    'services-infrastructures',
    'securite-acces',
    'documents-rapports'
  )
  AND m.slug NOT IN (
    -- Exclus: modules ultra-premium réservés à Institutionnel
    'badges-eleves',
    'dossiers-scolaires'
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PLAN INSTITUTIONNEL: TOUS les modules
-- ============================================================================
INSERT INTO plan_modules (plan_id, module_id)
SELECT 
  sp.id,
  m.id
FROM subscription_plans sp
CROSS JOIN modules m
WHERE sp.slug = 'institutionnel'
  AND m.status = 'active'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ÉTAPE 5: VÉRIFICATION ET STATISTIQUES
-- ============================================================================

-- Statistiques par plan
SELECT 
  sp.name as plan,
  sp.slug,
  sp.price,
  COUNT(DISTINCT pc.category_id) as nb_categories,
  COUNT(DISTINCT pm.module_id) as nb_modules,
  STRING_AGG(DISTINCT bc.name, ', ' ORDER BY bc.name) as categories
FROM subscription_plans sp
LEFT JOIN plan_categories pc ON pc.plan_id = sp.id
LEFT JOIN business_categories bc ON bc.id = pc.category_id
LEFT JOIN plan_modules pm ON pm.plan_id = sp.id
GROUP BY sp.id, sp.name, sp.slug, sp.price
ORDER BY sp.price;

-- Détail par plan et catégorie
SELECT 
  sp.name as plan,
  bc.name as categorie,
  COUNT(m.id) as nb_modules,
  STRING_AGG(m.name, ', ' ORDER BY m.name) as modules
FROM subscription_plans sp
JOIN plan_categories pc ON pc.plan_id = sp.id
JOIN business_categories bc ON bc.id = pc.category_id
LEFT JOIN plan_modules pm ON pm.plan_id = sp.id
LEFT JOIN modules m ON m.id = pm.module_id AND m.category_id = bc.id
GROUP BY sp.id, sp.name, bc.id, bc.name
ORDER BY sp.price, bc.name;

COMMIT;

-- ============================================================================
-- RÉSUMÉ DE L'ASSIGNATION
-- ============================================================================

/*
PLAN GRATUIT (0 FCFA/an)
- 3 catégories
- ~10 modules essentiels (is_core = true)
- Fonctionnalités de base pour démarrer

PLAN PREMIUM (25,000 FCFA/mois) ⭐
- 6 catégories
- ~25 modules standard
- Gestion complète d'une école

PLAN PRO (50,000 FCFA/mois)
- 8 catégories
- ~40 modules avancés
- Multi-écoles + API + Branding

PLAN INSTITUTIONNEL (100,000 FCFA/an)
- TOUTES les catégories (8+)
- TOUS les modules (47)
- Personnalisation complète + Support dédié
*/
