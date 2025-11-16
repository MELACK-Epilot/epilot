-- Seed: Données de test pour activity_logs
-- Date: 2025-11-16
-- Description: Insérer des logs d'activité de démonstration

-- Insérer des logs d'activité de test
-- Note: Remplacer les UUIDs par des vrais IDs d'utilisateurs de votre base

-- Exemple de logs (à adapter avec vos vrais user_id)
INSERT INTO activity_logs (user_id, action, entity, entity_id, details, ip_address, timestamp)
SELECT 
  u.id as user_id,
  'login' as action,
  'user' as entity,
  u.id as entity_id,
  'Connexion réussie à l''application' as details,
  '192.168.1.' || (RANDOM() * 255)::INT as ip_address,
  NOW() - (RANDOM() * INTERVAL '7 days') as timestamp
FROM users u
WHERE u.role IN ('proviseur', 'directeur', 'enseignant', 'cpe', 'comptable')
LIMIT 10;

INSERT INTO activity_logs (user_id, action, entity, entity_id, details, ip_address, timestamp)
SELECT 
  u.id as user_id,
  (ARRAY['create', 'update', 'view', 'delete'])[FLOOR(RANDOM() * 4 + 1)] as action,
  (ARRAY['student', 'class', 'grade', 'payment', 'document'])[FLOOR(RANDOM() * 5 + 1)] as entity,
  gen_random_uuid() as entity_id,
  CASE 
    WHEN RANDOM() < 0.25 THEN 'Création d''un nouvel élément'
    WHEN RANDOM() < 0.5 THEN 'Modification des informations'
    WHEN RANDOM() < 0.75 THEN 'Consultation des données'
    ELSE 'Suppression d''un élément'
  END as details,
  '192.168.1.' || (RANDOM() * 255)::INT as ip_address,
  NOW() - (RANDOM() * INTERVAL '30 days') as timestamp
FROM users u
WHERE u.role IN ('proviseur', 'directeur', 'enseignant', 'cpe', 'comptable')
LIMIT 50;

-- Logs spécifiques pour le proviseur/directeur
INSERT INTO activity_logs (user_id, action, entity, entity_id, details, ip_address, timestamp)
SELECT 
  u.id as user_id,
  'export' as action,
  'report' as entity,
  gen_random_uuid() as entity_id,
  'Export du rapport ' || (ARRAY['académique', 'financier', 'global', 'personnel'])[FLOOR(RANDOM() * 4 + 1)] || ' en PDF',
  '192.168.1.' || (RANDOM() * 255)::INT as ip_address,
  NOW() - (RANDOM() * INTERVAL '7 days') as timestamp
FROM users u
WHERE u.role IN ('proviseur', 'directeur')
LIMIT 15;

-- Logs de modifications de notes
INSERT INTO activity_logs (user_id, action, entity, entity_id, details, ip_address, timestamp)
SELECT 
  u.id as user_id,
  (ARRAY['create', 'update'])[FLOOR(RANDOM() * 2 + 1)] as action,
  'grade' as entity,
  gen_random_uuid() as entity_id,
  'Saisie de ' || (10 + FLOOR(RANDOM() * 30))::TEXT || ' notes pour le contrôle de ' || 
  (ARRAY['Mathématiques', 'Français', 'Anglais', 'Histoire', 'Sciences'])[FLOOR(RANDOM() * 5 + 1)],
  '192.168.1.' || (RANDOM() * 255)::INT as ip_address,
  NOW() - (RANDOM() * INTERVAL '14 days') as timestamp
FROM users u
WHERE u.role = 'enseignant'
LIMIT 25;

-- Logs de paiements
INSERT INTO activity_logs (user_id, action, entity, entity_id, details, ip_address, timestamp)
SELECT 
  u.id as user_id,
  'create' as action,
  'payment' as entity,
  gen_random_uuid() as entity_id,
  'Paiement de ' || (50000 + FLOOR(RANDOM() * 200000))::TEXT || ' FCFA pour frais de scolarité',
  '192.168.1.' || (RANDOM() * 255)::INT as ip_address,
  NOW() - (RANDOM() * INTERVAL '30 days') as timestamp
FROM users u
WHERE u.role = 'comptable'
LIMIT 20;

-- Logs de gestion du personnel
INSERT INTO activity_logs (user_id, action, entity, entity_id, details, ip_address, timestamp)
SELECT 
  u.id as user_id,
  (ARRAY['create', 'update', 'view'])[FLOOR(RANDOM() * 3 + 1)] as action,
  'user' as entity,
  gen_random_uuid() as entity_id,
  CASE 
    WHEN RANDOM() < 0.33 THEN 'Création d''un nouveau compte utilisateur'
    WHEN RANDOM() < 0.66 THEN 'Modification des permissions utilisateur'
    ELSE 'Consultation du profil utilisateur'
  END as details,
  '192.168.1.' || (RANDOM() * 255)::INT as ip_address,
  NOW() - (RANDOM() * INTERVAL '20 days') as timestamp
FROM users u
WHERE u.role IN ('proviseur', 'directeur', 'admin_groupe')
LIMIT 15;

-- Logs de vie scolaire
INSERT INTO activity_logs (user_id, action, entity, entity_id, details, ip_address, timestamp)
SELECT 
  u.id as user_id,
  'create' as action,
  'document' as entity,
  gen_random_uuid() as entity_id,
  'Création d''un rapport disciplinaire pour absence injustifiée',
  '192.168.1.' || (RANDOM() * 255)::INT as ip_address,
  NOW() - (RANDOM() * INTERVAL '10 days') as timestamp
FROM users u
WHERE u.role = 'cpe'
LIMIT 10;
