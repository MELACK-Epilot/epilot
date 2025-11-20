-- Migration: Vérifier et corriger la table system_alerts
-- Date: 2025-11-20
-- Objectif: S'assurer que toutes les colonnes nécessaires existent

-- ============================================
-- 1. VÉRIFIER LA STRUCTURE DE LA TABLE
-- ============================================

DO $$
BEGIN
  -- Vérifier si la colonne action_label existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'system_alerts' 
    AND column_name = 'action_label'
  ) THEN
    ALTER TABLE system_alerts ADD COLUMN action_label TEXT;
    RAISE NOTICE '✅ Colonne action_label ajoutée';
  ELSE
    RAISE NOTICE '✅ Colonne action_label existe déjà';
  END IF;

  -- Vérifier si la colonne action_url existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'system_alerts' 
    AND column_name = 'action_url'
  ) THEN
    ALTER TABLE system_alerts ADD COLUMN action_url TEXT;
    RAISE NOTICE '✅ Colonne action_url ajoutée';
  ELSE
    RAISE NOTICE '✅ Colonne action_url existe déjà';
  END IF;

  -- Vérifier si la colonne action_required existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'system_alerts' 
    AND column_name = 'action_required'
  ) THEN
    ALTER TABLE system_alerts ADD COLUMN action_required BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Colonne action_required ajoutée';
  ELSE
    RAISE NOTICE '✅ Colonne action_required existe déjà';
  END IF;

  -- Vérifier si la colonne category existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'system_alerts' 
    AND column_name = 'category'
  ) THEN
    ALTER TABLE system_alerts ADD COLUMN category TEXT;
    RAISE NOTICE '✅ Colonne category ajoutée';
  ELSE
    RAISE NOTICE '✅ Colonne category existe déjà';
  END IF;

  -- Vérifier si la colonne is_read existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'system_alerts' 
    AND column_name = 'is_read'
  ) THEN
    ALTER TABLE system_alerts ADD COLUMN is_read BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Colonne is_read ajoutée';
  ELSE
    RAISE NOTICE '✅ Colonne is_read existe déjà';
  END IF;

  -- Vérifier si la colonne read_at existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'system_alerts' 
    AND column_name = 'read_at'
  ) THEN
    ALTER TABLE system_alerts ADD COLUMN read_at TIMESTAMPTZ;
    RAISE NOTICE '✅ Colonne read_at ajoutée';
  ELSE
    RAISE NOTICE '✅ Colonne read_at existe déjà';
  END IF;

  -- Vérifier si la colonne resolved_at existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'system_alerts' 
    AND column_name = 'resolved_at'
  ) THEN
    ALTER TABLE system_alerts ADD COLUMN resolved_at TIMESTAMPTZ;
    RAISE NOTICE '✅ Colonne resolved_at ajoutée';
  ELSE
    RAISE NOTICE '✅ Colonne resolved_at existe déjà';
  END IF;
END $$;

-- ============================================
-- 2. AFFICHER LA STRUCTURE COMPLÈTE
-- ============================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'system_alerts'
ORDER BY ordinal_position;

-- ============================================
-- 3. METTRE À JOUR LES ALERTES EXISTANTES
-- ============================================

-- S'assurer que toutes les alertes ont is_read = false par défaut
UPDATE system_alerts
SET is_read = false
WHERE is_read IS NULL;

-- ============================================
-- 4. VÉRIFIER LES DONNÉES
-- ============================================

SELECT 
  id,
  alert_type,
  severity,
  category,
  title,
  action_required,
  action_url,
  action_label,
  is_read,
  resolved_at,
  created_at
FROM system_alerts
WHERE resolved_at IS NULL
ORDER BY 
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'error' THEN 2
    WHEN 'warning' THEN 3
    WHEN 'info' THEN 4
  END,
  created_at DESC
LIMIT 10;
