-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED: Assignation des modules aux profils d'accès
-- ═══════════════════════════════════════════════════════════════════════════════
-- 
-- Cette migration assigne les modules appropriés à chaque profil d'accès
-- selon la logique métier E-Pilot Congo
--
-- PROFILS:
-- 1. chef_etablissement - Accès complet (tous les modules)
-- 2. financier_sans_suppression - Finances uniquement
-- 3. administratif_basique - Administration + consultation
-- 4. enseignant_saisie_notes - Pédagogie limitée
-- 5. parent_consultation - Consultation enfants
-- 6. eleve_consultation - Consultation propres données
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════
-- 1️⃣ CHEF D'ÉTABLISSEMENT (Proviseur/Directeur)
-- Accès complet à tous les modules avec permissions étendues
-- ═══════════════════════════════════════════════════════════

INSERT INTO public.access_profile_modules (access_profile_code, module_id, can_read, can_write, can_delete, can_export)
SELECT 
    'chef_etablissement',
    m.id,
    true,  -- can_read
    true,  -- can_write
    false, -- can_delete (sécurité)
    true   -- can_export
FROM public.modules m
WHERE m.status = 'active'
ON CONFLICT (access_profile_code, module_id) DO UPDATE SET
    can_read = EXCLUDED.can_read,
    can_write = EXCLUDED.can_write,
    can_delete = EXCLUDED.can_delete,
    can_export = EXCLUDED.can_export;

-- ═══════════════════════════════════════════════════════════
-- 2️⃣ FINANCIER (Comptable/Économe)
-- Accès aux modules finances uniquement
-- ═══════════════════════════════════════════════════════════

INSERT INTO public.access_profile_modules (access_profile_code, module_id, can_read, can_write, can_delete, can_export)
SELECT 
    'financier_sans_suppression',
    m.id,
    true,  -- can_read
    true,  -- can_write
    false, -- can_delete
    true   -- can_export
FROM public.modules m
JOIN public.business_categories bc ON bc.id = m.category_id
WHERE m.status = 'active'
AND bc.slug IN ('finances', 'comptabilite', 'finances-comptabilite')
ON CONFLICT (access_profile_code, module_id) DO UPDATE SET
    can_read = EXCLUDED.can_read,
    can_write = EXCLUDED.can_write,
    can_delete = EXCLUDED.can_delete,
    can_export = EXCLUDED.can_export;

-- Ajouter accès lecture aux statistiques
INSERT INTO public.access_profile_modules (access_profile_code, module_id, can_read, can_write, can_delete, can_export)
SELECT 
    'financier_sans_suppression',
    m.id,
    true,  -- can_read
    false, -- can_write
    false, -- can_delete
    true   -- can_export
FROM public.modules m
WHERE m.status = 'active'
AND m.slug IN ('statistiques', 'rapports', 'tableau-de-bord')
ON CONFLICT (access_profile_code, module_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- 3️⃣ ADMINISTRATIF (Secrétaire)
-- Administration + consultation pédagogie
-- ═══════════════════════════════════════════════════════════

-- Modules administration avec écriture
INSERT INTO public.access_profile_modules (access_profile_code, module_id, can_read, can_write, can_delete, can_export)
SELECT 
    'administratif_basique',
    m.id,
    true,  -- can_read
    true,  -- can_write
    false, -- can_delete
    true   -- can_export
FROM public.modules m
JOIN public.business_categories bc ON bc.id = m.category_id
WHERE m.status = 'active'
AND bc.slug IN ('administration', 'scolarite', 'scolarite-admissions', 'inscriptions')
ON CONFLICT (access_profile_code, module_id) DO UPDATE SET
    can_read = EXCLUDED.can_read,
    can_write = EXCLUDED.can_write,
    can_delete = EXCLUDED.can_delete,
    can_export = EXCLUDED.can_export;

-- Modules pédagogie en lecture seule
INSERT INTO public.access_profile_modules (access_profile_code, module_id, can_read, can_write, can_delete, can_export)
SELECT 
    'administratif_basique',
    m.id,
    true,  -- can_read
    false, -- can_write
    false, -- can_delete
    false  -- can_export
FROM public.modules m
JOIN public.business_categories bc ON bc.id = m.category_id
WHERE m.status = 'active'
AND bc.slug IN ('pedagogie', 'pedagogie-evaluations', 'vie-scolaire')
ON CONFLICT (access_profile_code, module_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- 4️⃣ ENSEIGNANT
-- Pédagogie avec saisie notes
-- ═══════════════════════════════════════════════════════════

INSERT INTO public.access_profile_modules (access_profile_code, module_id, can_read, can_write, can_delete, can_export)
SELECT 
    'enseignant_saisie_notes',
    m.id,
    true,  -- can_read
    true,  -- can_write (saisie notes)
    false, -- can_delete
    false  -- can_export
FROM public.modules m
JOIN public.business_categories bc ON bc.id = m.category_id
WHERE m.status = 'active'
AND bc.slug IN ('pedagogie', 'pedagogie-evaluations')
ON CONFLICT (access_profile_code, module_id) DO UPDATE SET
    can_read = EXCLUDED.can_read,
    can_write = EXCLUDED.can_write,
    can_delete = EXCLUDED.can_delete,
    can_export = EXCLUDED.can_export;

-- Vie scolaire en lecture
INSERT INTO public.access_profile_modules (access_profile_code, module_id, can_read, can_write, can_delete, can_export)
SELECT 
    'enseignant_saisie_notes',
    m.id,
    true,  -- can_read
    false, -- can_write
    false, -- can_delete
    false  -- can_export
FROM public.modules m
JOIN public.business_categories bc ON bc.id = m.category_id
WHERE m.status = 'active'
AND bc.slug IN ('vie-scolaire', 'vie-scolaire-discipline')
ON CONFLICT (access_profile_code, module_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- 5️⃣ PARENT
-- Consultation des données de ses enfants
-- ═══════════════════════════════════════════════════════════

INSERT INTO public.access_profile_modules (access_profile_code, module_id, can_read, can_write, can_delete, can_export)
SELECT 
    'parent_consultation',
    m.id,
    true,  -- can_read
    false, -- can_write
    false, -- can_delete
    false  -- can_export
FROM public.modules m
WHERE m.status = 'active'
AND m.slug IN (
    'notes', 'bulletins', 'absences', 'retards', 
    'emploi-du-temps', 'devoirs', 'messagerie',
    'paiements', 'frais-scolaires'
)
ON CONFLICT (access_profile_code, module_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- 6️⃣ ÉLÈVE
-- Consultation de ses propres données
-- ═══════════════════════════════════════════════════════════

INSERT INTO public.access_profile_modules (access_profile_code, module_id, can_read, can_write, can_delete, can_export)
SELECT 
    'eleve_consultation',
    m.id,
    true,  -- can_read
    false, -- can_write
    false, -- can_delete
    false  -- can_export
FROM public.modules m
WHERE m.status = 'active'
AND m.slug IN (
    'notes', 'bulletins', 'absences', 
    'emploi-du-temps', 'devoirs', 'messagerie'
)
ON CONFLICT (access_profile_code, module_id) DO NOTHING;

COMMIT;

-- ═══════════════════════════════════════════════════════════
-- ✅ VÉRIFICATION
-- ═══════════════════════════════════════════════════════════

SELECT 
    ap.code AS profile_code,
    ap.name_fr AS profile_name,
    COUNT(apm.module_id) AS modules_count
FROM public.access_profiles ap
LEFT JOIN public.access_profile_modules apm ON apm.access_profile_code = ap.code
GROUP BY ap.code, ap.name_fr
ORDER BY modules_count DESC;

SELECT '✅ Seed des modules par profil terminé!' AS status;
