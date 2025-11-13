-- =====================================================
-- E-PILOT CONGO - MODULES (PARTIE 1/2)
-- Insertion des 25 premiers modules
-- =====================================================

-- CATÉGORIE 1: Scolarité & Admissions (6 modules)
-- =====================================================

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Gestion des inscriptions',
  'gestion-inscriptions',
  'Gestion complète des inscriptions des élèves avec formulaires personnalisables et validation automatique',
  id,
  'UserPlus',
  'active',
  'gratuit',
  true,
  false,
  1,
  '["Formulaires d''inscription", "Validation automatique", "Documents requis", "Notifications parents"]'::jsonb
FROM business_categories WHERE slug = 'scolarite-admissions'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Admission des élèves',
  'admission-eleves',
  'Gestion des admissions et validation des dossiers élèves avec critères personnalisables',
  id,
  'CheckCircle',
  'active',
  'gratuit',
  true,
  false,
  2,
  '["Critères d''admission", "Validation dossiers", "Listes d''attente", "Notifications automatiques"]'::jsonb
FROM business_categories WHERE slug = 'scolarite-admissions'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Suivi des élèves',
  'suivi-eleves',
  'Suivi individuel complet des élèves (données personnelles, progrès académiques, comportement)',
  id,
  'UserCheck',
  'active',
  'gratuit',
  true,
  false,
  3,
  '["Fiche élève complète", "Historique académique", "Suivi comportemental", "Alertes personnalisées"]'::jsonb
FROM business_categories WHERE slug = 'scolarite-admissions'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Transfert d''élèves',
  'transfert-eleves',
  'Gestion des changements d''école ou de classe pour un élève avec historique complet',
  id,
  'ArrowRightLeft',
  'active',
  'premium',
  false,
  true,
  4,
  '["Transfert inter-écoles", "Changement de classe", "Historique transferts", "Documents automatiques"]'::jsonb
FROM business_categories WHERE slug = 'scolarite-admissions'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Dossiers scolaires',
  'dossiers-scolaires',
  'Centralisation et archivage numérique des documents scolaires des élèves',
  id,
  'FolderOpen',
  'active',
  'premium',
  false,
  true,
  5,
  '["Stockage cloud", "Scan documents", "Recherche avancée", "Partage sécurisé"]'::jsonb
FROM business_categories WHERE slug = 'scolarite-admissions'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Badges élèves personnalisés',
  'badges-eleves',
  'Création et impression de badges personnalisés pour les élèves avec photo et QR code',
  id,
  'CreditCard',
  'active',
  'premium',
  false,
  true,
  6,
  '["Design personnalisable", "QR code unique", "Impression en masse", "Gestion photos"]'::jsonb
FROM business_categories WHERE slug = 'scolarite-admissions'
ON CONFLICT (slug) DO NOTHING;

-- CATÉGORIE 2: Pédagogie & Évaluations (10 modules)
-- =====================================================

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Gestion des classes',
  'gestion-classes',
  'Organisation et gestion des classes, groupes d''élèves et affectations enseignants',
  id,
  'School',
  'active',
  'gratuit',
  true,
  false,
  1,
  '["Création classes", "Affectation élèves", "Gestion groupes", "Statistiques classe"]'::jsonb
FROM business_categories WHERE slug = 'pedagogie-evaluations'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Gestion des matières',
  'gestion-matieres',
  'Gestion complète des matières enseignées avec coefficients et programmes',
  id,
  'BookOpen',
  'active',
  'gratuit',
  true,
  false,
  2,
  '["Création matières", "Coefficients", "Programmes", "Affectation enseignants"]'::jsonb
FROM business_categories WHERE slug = 'pedagogie-evaluations'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Emplois du temps',
  'emplois-du-temps',
  'Création et gestion des emplois du temps avec détection de conflits',
  id,
  'Calendar',
  'active',
  'premium',
  false,
  true,
  3,
  '["Génération automatique", "Détection conflits", "Vue enseignant/classe", "Export PDF"]'::jsonb
FROM business_categories WHERE slug = 'pedagogie-evaluations'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Cahier de textes',
  'cahier-textes',
  'Gestion des devoirs, leçons et travaux à faire par les enseignants',
  id,
  'BookMarked',
  'active',
  'premium',
  false,
  true,
  4,
  '["Devoirs en ligne", "Leçons", "Pièces jointes", "Notifications parents"]'::jsonb
FROM business_categories WHERE slug = 'pedagogie-evaluations'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Notes & évaluations',
  'notes-evaluations',
  'Saisie et calcul automatique des notes avec moyennes et classements',
  id,
  'Calculator',
  'active',
  'gratuit',
  true,
  false,
  5,
  '["Saisie notes", "Calcul moyennes", "Classements", "Appréciations"]'::jsonb
FROM business_categories WHERE slug = 'pedagogie-evaluations'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Bulletins scolaires',
  'bulletins-scolaires',
  'Génération et distribution automatique des bulletins de notes périodiques',
  id,
  'FileText',
  'active',
  'gratuit',
  true,
  false,
  6,
  '["Génération PDF", "Personnalisation", "Envoi email", "Signature numérique"]'::jsonb
FROM business_categories WHERE slug = 'pedagogie-evaluations'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Relevés de notes',
  'releves-notes',
  'Génération de relevés de notes détaillés par période ou matière',
  id,
  'ClipboardList',
  'active',
  'gratuit',
  true,
  false,
  7,
  '["Relevés périodiques", "Par matière", "Export Excel/PDF", "Graphiques"]'::jsonb
FROM business_categories WHERE slug = 'pedagogie-evaluations'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Examens & concours',
  'examens-concours',
  'Organisation et gestion des examens, concours et épreuves',
  id,
  'Award',
  'active',
  'premium',
  false,
  true,
  8,
  '["Planification examens", "Surveillance", "Résultats", "Statistiques"]'::jsonb
FROM business_categories WHERE slug = 'pedagogie-evaluations'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Feuilles d''examen',
  'feuilles-examen',
  'Génération automatique de feuilles d''examen personnalisées',
  id,
  'FileSpreadsheet',
  'active',
  'premium',
  false,
  true,
  9,
  '["Templates personnalisables", "QR codes", "Impression en masse", "Anti-triche"]'::jsonb
FROM business_categories WHERE slug = 'pedagogie-evaluations'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Rapports pédagogiques',
  'rapports-pedagogiques',
  'Génération de rapports détaillés sur les performances académiques',
  id,
  'BarChart3',
  'active',
  'premium',
  false,
  true,
  10,
  '["Analyses statistiques", "Graphiques", "Comparaisons", "Export multi-formats"]'::jsonb
FROM business_categories WHERE slug = 'pedagogie-evaluations'
ON CONFLICT (slug) DO NOTHING;

-- CATÉGORIE 3: Finances & Comptabilité (6 modules)
-- =====================================================

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Frais de scolarité',
  'frais-scolarite',
  'Gestion complète des frais de scolarité avec tarifs personnalisables',
  id,
  'DollarSign',
  'active',
  'premium',
  false,
  true,
  1,
  '["Tarifs personnalisables", "Réductions", "Échéanciers", "Alertes paiement"]'::jsonb
FROM business_categories WHERE slug = 'finances-comptabilite'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Paiements & reçus',
  'paiements-recus',
  'Enregistrement des paiements et génération automatique de reçus',
  id,
  'Receipt',
  'active',
  'premium',
  false,
  true,
  2,
  '["Reçus automatiques", "Paiements partiels", "Historique", "Impression"]'::jsonb
FROM business_categories WHERE slug = 'finances-comptabilite'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Caisse scolaire',
  'caisse-scolaire',
  'Gestion de la caisse avec suivi des entrées et sorties',
  id,
  'Wallet',
  'active',
  'premium',
  false,
  true,
  3,
  '["Entrées/Sorties", "Clôture caisse", "Rapports journaliers", "Multi-caisses"]'::jsonb
FROM business_categories WHERE slug = 'finances-comptabilite'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Comptabilité générale',
  'comptabilite-generale',
  'Système comptable complet avec plan comptable et écritures',
  id,
  'Calculator',
  'active',
  'pro',
  false,
  true,
  4,
  '["Plan comptable", "Écritures", "Grand livre", "Balance"]'::jsonb
FROM business_categories WHERE slug = 'finances-comptabilite'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Rapports financiers',
  'rapports-financiers',
  'Génération de rapports financiers détaillés (revenus, dépenses, rentabilité)',
  id,
  'TrendingUp',
  'active',
  'pro',
  false,
  true,
  5,
  '["Bilan", "Compte résultat", "Trésorerie", "Graphiques"]'::jsonb
FROM business_categories WHERE slug = 'finances-comptabilite'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, icon, status, required_plan, is_core, is_premium, order_index, features)
SELECT 
  'Arriérés & relances',
  'arrieres-relances',
  'Suivi des impayés et système de relances automatiques',
  id,
  'AlertTriangle',
  'active',
  'premium',
  false,
  true,
  6,
  '["Suivi arriérés", "Relances auto", "SMS/Email", "Statistiques"]'::jsonb
FROM business_categories WHERE slug = 'finances-comptabilite'
ON CONFLICT (slug) DO NOTHING;
