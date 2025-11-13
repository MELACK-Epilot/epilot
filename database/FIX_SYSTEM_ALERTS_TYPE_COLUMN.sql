-- =====================================================
-- FIX: Renommer la colonne type en "type"
-- =====================================================
-- Ce script corrige le problème de la colonne type
-- qui entre en conflit avec le mot-clé SQL TYPE
-- =====================================================

-- 1. Supprimer les contraintes existantes sur la colonne type
ALTER TABLE public.system_alerts 
DROP CONSTRAINT IF EXISTS system_alerts_type_check;

-- 2. Renommer la colonne (si elle existe sans guillemets)
-- PostgreSQL va automatiquement gérer les guillemets
DO $$ 
BEGIN
    -- Vérifier si la colonne existe
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'system_alerts' 
        AND column_name = 'type'
    ) THEN
        -- La colonne existe, on la renomme temporairement puis on la recrée
        ALTER TABLE public.system_alerts RENAME COLUMN type TO type_old;
        
        -- Ajouter la nouvelle colonne avec guillemets
        ALTER TABLE public.system_alerts 
        ADD COLUMN "type" VARCHAR(50);
        
        -- Copier les données
        UPDATE public.system_alerts SET "type" = type_old;
        
        -- Supprimer l'ancienne colonne
        ALTER TABLE public.system_alerts DROP COLUMN type_old;
        
        -- Ajouter la contrainte NOT NULL
        ALTER TABLE public.system_alerts 
        ALTER COLUMN "type" SET NOT NULL;
        
        -- Ajouter la contrainte CHECK
        ALTER TABLE public.system_alerts 
        ADD CONSTRAINT system_alerts_type_check 
        CHECK ("type" IN ('subscription', 'payment', 'user', 'school', 'system', 'security', 'performance'));
        
        RAISE NOTICE 'Colonne type renommée avec succès en "type"';
    ELSE
        RAISE NOTICE 'La colonne type n''existe pas ou est déjà correctement nommée';
    END IF;
END $$;

-- 3. Recréer l'index sur la colonne "type"
DROP INDEX IF EXISTS idx_system_alerts_type;
CREATE INDEX idx_system_alerts_type ON public.system_alerts("type") WHERE resolved_at IS NULL;

-- 4. Vérifier que tout fonctionne
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'system_alerts'
  AND column_name = 'type';

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

-- Maintenant vous pouvez exécuter CREATE_SYSTEM_ALERTS.sql
