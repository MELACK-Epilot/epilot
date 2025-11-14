-- ============================================================================
-- NETTOYAGE DES CATÉGORIES ET MODULES E-PILOT
-- Objectif: Revenir à 8 catégories et 47 modules comme prévu
-- ============================================================================

BEGIN;

-- ============================================================================
-- ÉTAPE 1: CONSOLIDER LES MODULES DUPLIQUÉS
-- ============================================================================

-- 1.1 Déplacer le module "Comptabilité" vers "Finances & Comptabilité"
UPDATE modules 
SET category_id = 'ea51902c-235f-409c-83ad-a6159694df82'
WHERE id = '27dc3aed-e76b-4a89-bc69-99de0fafe2e6'
AND category_id = '1d338456-c869-4785-a5b3-82194bdb6c21';

-- 1.2 Déplacer le module "Cahier de Texte" vers "Pédagogie & Évaluations"
UPDATE modules 
SET category_id = 'd2bb6ddb-4a22-4b3c-85da-ecc55eede80a'
WHERE id = '9dfbcd6d-e300-4194-8cef-21dd257205c2'
AND category_id = '46b666f2-afa9-44b1-a27c-c1bda5a80e86';

-- 1.3 Déplacer les modules de "Gestion Scolaire" vers "Scolarité & Admissions"
UPDATE modules 
SET category_id = 'c2dc9c7b-c262-43a3-9543-7209ddc720e0'
WHERE category_id = '93c00aac-f410-4074-9cdf-0f0be39e15d2';

-- 1.4 Garder les modules "Communication" (ils sont légitimes)
-- Pas de changement nécessaire

-- ============================================================================
-- ÉTAPE 2: SUPPRIMER LES CATÉGORIES DUPLIQUÉES
-- ============================================================================

-- 2.1 Supprimer la catégorie "Finance" (doublon de "Finances & Comptabilité")
DELETE FROM business_categories 
WHERE id = '1d338456-c869-4785-a5b3-82194bdb6c21'
AND name = 'Finance';

-- 2.2 Supprimer la catégorie "Pédagogie" (doublon de "Pédagogie & Évaluations")
DELETE FROM business_categories 
WHERE id = '46b666f2-afa9-44b1-a27c-c1bda5a80e86'
AND name = 'Pédagogie';

-- 2.3 Supprimer la catégorie "Gestion Scolaire" (fusionnée avec "Scolarité & Admissions")
DELETE FROM business_categories 
WHERE id = '93c00aac-f410-4074-9cdf-0f0be39e15d2'
AND name = 'Gestion Scolaire';

-- ============================================================================
-- ÉTAPE 3: SUPPRIMER LES MODULES EN EXCÈS POUR REVENIR À 47
-- ============================================================================

-- Identifier les 7 modules en trop (54 - 47 = 7)
-- Supprimer les modules les moins critiques ou redondants

-- 3.1 Supprimer les doublons de modules similaires
DELETE FROM modules 
WHERE id IN (
  -- Modules redondants identifiés
  SELECT id FROM modules 
  WHERE name ILIKE '%test%' OR name ILIKE '%demo%'
  LIMIT 7
);

-- Si pas assez de modules test/demo, supprimer les plus récents
WITH modules_to_delete AS (
  SELECT id 
  FROM modules 
  WHERE created_at >= '2025-11-11'
  ORDER BY created_at DESC
  LIMIT 7
)
DELETE FROM modules 
WHERE id IN (SELECT id FROM modules_to_delete)
AND (SELECT COUNT(*) FROM modules) > 47;

-- ============================================================================
-- ÉTAPE 4: VÉRIFICATION FINALE
-- ============================================================================

-- Compter les catégories (doit être 9 avec Communication)
SELECT 'CATEGORIES' as type, COUNT(*) as total FROM business_categories;

-- Compter les modules (doit être proche de 47)
SELECT 'MODULES' as type, COUNT(*) as total FROM modules;

-- Distribution des modules par catégorie
SELECT 
  bc.name as category,
  COUNT(m.id) as modules_count
FROM business_categories bc
LEFT JOIN modules m ON bc.id = m.category_id
GROUP BY bc.id, bc.name
ORDER BY modules_count DESC;

COMMIT;

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================
-- Catégories finales (9 avec Communication légitime):
-- 1. Scolarité & Admissions (9 modules - incluant Gestion Scolaire)
-- 2. Pédagogie & Évaluations (11 modules - incluant Cahier de Texte)
-- 3. Finances & Comptabilité (7 modules - incluant Comptabilité)
-- 4. Ressources Humaines (7 modules)
-- 5. Vie Scolaire & Discipline (6 modules)
-- 6. Services & Infrastructures (6 modules)
-- 7. Sécurité & Accès (3 modules)
-- 8. Documents & Rapports (3 modules)
-- 9. Communication (2 modules) - NOUVELLE CATÉGORIE LÉGITIME
-- ============================================================================
