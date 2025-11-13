-- =====================================================
-- E-PILOT CONGO - MODULES (PARTIE 2/2)
-- Insertion des 25 derniers modules
-- =====================================================

-- CATÉGORIE 4: Ressources Humaines (7 modules)
-- =====================================================

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Gestion des enseignants',
  'gestion-enseignants',
  'Gestion complète du personnel enseignant (profils, qualifications, affectations)',
  id,
  'GraduationCap',
  'active',
  'premium',
  false,
  true,
  1,
  '["Profils enseignants", "Qualifications", "Affectations", "Historique"]'::jsonb
FROM business_categories WHERE slug = 'ressources-humaines'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Gestion des personnels administratifs',
  'gestion-administratifs',
  'Gestion du personnel administratif et de direction',
  id,
  'Briefcase',
  'active',
  'premium',
  false,
  true,
  2,
  '["Profils admin", "Organigramme", "Responsabilités", "Évaluations"]'::jsonb
FROM business_categories WHERE slug = 'ressources-humaines'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Gestion du personnel de service',
  'gestion-personnel-service',
  'Gestion du personnel de service et d''entretien',
  id,
  'HardHat',
  'active',
  'premium',
  false,
  true,
  3,
  '["Profils service", "Planning", "Tâches", "Présences"]'::jsonb
FROM business_categories WHERE slug = 'ressources-humaines'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Gestion des contrats',
  'gestion-contrats',
  'Gestion des contrats de travail et avenants',
  id,
  'FileSignature',
  'active',
  'pro',
  false,
  true,
  4,
  '["Contrats types", "Avenants", "Renouvellements", "Alertes fin contrat"]'::jsonb
FROM business_categories WHERE slug = 'ressources-humaines'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Gestion des congés',
  'gestion-conges',
  'Gestion des demandes de congés et absences du personnel',
  id,
  'Palmtree',
  'active',
  'premium',
  false,
  true,
  5,
  '["Demandes congés", "Validation", "Planning", "Soldes"]'::jsonb
FROM business_categories WHERE slug = 'ressources-humaines'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Paie & indemnités',
  'paie-indemnites',
  'Gestion de la paie et des indemnités du personnel',
  id,
  'Banknote',
  'active',
  'pro',
  false,
  true,
  6,
  '["Bulletins paie", "Indemnités", "Charges sociales", "Virements"]'::jsonb
FROM business_categories WHERE slug = 'ressources-humaines'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Évaluation & formation',
  'evaluation-formation',
  'Évaluation des performances et gestion des formations',
  id,
  'Target',
  'active',
  'pro',
  false,
  true,
  7,
  '["Évaluations", "Formations", "Compétences", "Plans développement"]'::jsonb
FROM business_categories WHERE slug = 'ressources-humaines'
ON CONFLICT (slug) DO NOTHING;

-- CATÉGORIE 5: Vie Scolaire & Discipline (6 modules)
-- =====================================================

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Suivi des absences',
  'suivi-absences',
  'Suivi quotidien des absences élèves avec notifications parents',
  id,
  'UserX',
  'active',
  'premium',
  false,
  true,
  1,
  '["Pointage quotidien", "Justificatifs", "Notifications SMS", "Statistiques"]'::jsonb
FROM business_categories WHERE slug = 'vie-scolaire-discipline'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Suivi des retards',
  'suivi-retards',
  'Gestion des retards avec système de sanctions progressives',
  id,
  'Clock',
  'active',
  'premium',
  false,
  true,
  2,
  '["Enregistrement retards", "Motifs", "Sanctions", "Rapports"]'::jsonb
FROM business_categories WHERE slug = 'vie-scolaire-discipline'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Discipline & sanctions',
  'discipline-sanctions',
  'Gestion des incidents disciplinaires et sanctions',
  id,
  'ShieldAlert',
  'active',
  'premium',
  false,
  true,
  3,
  '["Incidents", "Sanctions", "Conseils discipline", "Historique"]'::jsonb
FROM business_categories WHERE slug = 'vie-scolaire-discipline'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Suivi médical',
  'suivi-medical',
  'Suivi médical des élèves (vaccinations, allergies, traitements)',
  id,
  'Stethoscope',
  'active',
  'pro',
  false,
  true,
  4,
  '["Dossiers médicaux", "Vaccinations", "Allergies", "Traitements"]'::jsonb
FROM business_categories WHERE slug = 'vie-scolaire-discipline'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Communication & notifications',
  'communication-notifications',
  'Système de communication avec les parents (SMS, email, notifications)',
  id,
  'MessageSquare',
  'active',
  'premium',
  false,
  true,
  5,
  '["SMS groupés", "Emails", "Notifications push", "Historique"]'::jsonb
FROM business_categories WHERE slug = 'vie-scolaire-discipline'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Relations parents',
  'relations-parents',
  'Espace parents avec accès aux informations de leurs enfants',
  id,
  'Users',
  'active',
  'pro',
  false,
  true,
  6,
  '["Portail parents", "Rendez-vous", "Messagerie", "Documents"]'::jsonb
FROM business_categories WHERE slug = 'vie-scolaire-discipline'
ON CONFLICT (slug) DO NOTHING;

-- CATÉGORIE 6: Services & Infrastructures (6 modules)
-- =====================================================

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Gestion de la cantine',
  'gestion-cantine',
  'Gestion complète de la cantine (menus, inscriptions, paiements)',
  id,
  'UtensilsCrossed',
  'active',
  'pro',
  false,
  true,
  1,
  '["Menus", "Inscriptions", "Paiements", "Allergies"]'::jsonb
FROM business_categories WHERE slug = 'services-infrastructures'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Transport scolaire',
  'transport-scolaire',
  'Gestion du transport scolaire (circuits, inscriptions, paiements)',
  id,
  'Bus',
  'active',
  'pro',
  false,
  true,
  2,
  '["Circuits", "Inscriptions", "Chauffeurs", "Suivi GPS"]'::jsonb
FROM business_categories WHERE slug = 'services-infrastructures'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Bibliothèque / CDI',
  'bibliotheque-cdi',
  'Gestion de la bibliothèque et du centre de documentation',
  id,
  'Library',
  'active',
  'pro',
  false,
  true,
  3,
  '["Catalogue livres", "Prêts", "Réservations", "Amendes"]'::jsonb
FROM business_categories WHERE slug = 'services-infrastructures'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Infirmerie',
  'infirmerie',
  'Gestion de l''infirmerie scolaire et des soins',
  id,
  'Cross',
  'active',
  'pro',
  false,
  true,
  4,
  '["Consultations", "Médicaments", "Urgences", "Statistiques"]'::jsonb
FROM business_categories WHERE slug = 'services-infrastructures'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Maintenance & réparations',
  'maintenance-reparations',
  'Gestion de la maintenance et des réparations des infrastructures',
  id,
  'Wrench',
  'active',
  'pro',
  false,
  true,
  5,
  '["Demandes intervention", "Planning", "Suivi travaux", "Budget"]'::jsonb
FROM business_categories WHERE slug = 'services-infrastructures'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Réservation des salles',
  'reservation-salles',
  'Système de réservation des salles et équipements',
  id,
  'DoorOpen',
  'active',
  'premium',
  false,
  true,
  6,
  '["Planning salles", "Réservations", "Conflits", "Équipements"]'::jsonb
FROM business_categories WHERE slug = 'services-infrastructures'
ON CONFLICT (slug) DO NOTHING;

-- CATÉGORIE 7: Sécurité & Accès (3 modules)
-- =====================================================

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Gestion des rôles & permissions',
  'roles-permissions',
  'Gestion fine des rôles et permissions utilisateurs',
  id,
  'ShieldCheck',
  'active',
  'gratuit',
  true,
  false,
  1,
  '["Rôles personnalisés", "Permissions granulaires", "Audit", "Sécurité"]'::jsonb
FROM business_categories WHERE slug = 'securite-acces'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Gestion des utilisateurs',
  'gestion-utilisateurs',
  'Gestion complète des comptes utilisateurs',
  id,
  'UserCog',
  'active',
  'gratuit',
  true,
  false,
  2,
  '["Création comptes", "Activation/Désactivation", "Réinitialisation MDP", "Historique"]'::jsonb
FROM business_categories WHERE slug = 'securite-acces'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Contrôle d''accès',
  'controle-acces',
  'Système de contrôle d''accès physique et numérique',
  id,
  'KeyRound',
  'active',
  'pro',
  false,
  true,
  3,
  '["Badges accès", "Pointage", "Zones sécurisées", "Logs accès"]'::jsonb
FROM business_categories WHERE slug = 'securite-acces'
ON CONFLICT (slug) DO NOTHING;

-- CATÉGORIE 8: Documents & Rapports (3 modules)
-- =====================================================

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Feuilles de rapport',
  'feuilles-rapport',
  'Génération automatique de feuilles de rapport personnalisées',
  id,
  'FileCheck',
  'active',
  'premium',
  false,
  true,
  1,
  '["Templates personnalisables", "Génération auto", "Export PDF", "Signature"]'::jsonb
FROM business_categories WHERE slug = 'documents-rapports'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Listes d''admission',
  'listes-admission',
  'Génération automatique des listes d''admission',
  id,
  'ListChecks',
  'active',
  'gratuit',
  true,
  false,
  2,
  '["Listes automatiques", "Filtres avancés", "Export Excel/PDF", "Impression"]'::jsonb
FROM business_categories WHERE slug = 'documents-rapports'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Rapports automatiques',
  'rapports-automatiques',
  'Système de génération de rapports automatiques personnalisés',
  id,
  'FileBarChart',
  'active',
  'pro',
  false,
  true,
  3,
  '["Rapports planifiés", "Multi-formats", "Envoi auto", "Tableaux de bord"]'::jsonb
FROM business_categories WHERE slug = 'documents-rapports'
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- TOTAL: 50 MODULES RÉPARTIS DANS 8 CATÉGORIES
-- =====================================================
-- Catégorie 1: Scolarité & Admissions (6 modules)
-- Catégorie 2: Pédagogie & Évaluations (10 modules)
-- Catégorie 3: Finances & Comptabilité (6 modules)
-- Catégorie 4: Ressources Humaines (7 modules)
-- Catégorie 5: Vie Scolaire & Discipline (6 modules)
-- Catégorie 6: Services & Infrastructures (6 modules)
-- Catégorie 7: Sécurité & Accès (3 modules)
-- Catégorie 8: Documents & Rapports (3 modules)
-- =====================================================
