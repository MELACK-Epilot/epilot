-- ============================================================================
-- VÉRIFIER QUELLES VUES MATÉRIALISÉES EXISTENT
-- ============================================================================

-- Lister toutes les vues matérialisées
SELECT 
  schemaname,
  matviewname AS view_name,
  matviewowner AS owner,
  hasindexes,
  ispopulated
FROM pg_matviews
WHERE schemaname = 'public'
ORDER BY matviewname;

-- Vérifier spécifiquement les vues financières
SELECT 
  'group_financial_stats' AS vue,
  CASE WHEN EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'group_financial_stats') 
    THEN '✅ Existe' 
    ELSE '❌ N''existe pas' 
  END AS statut
UNION ALL
SELECT 
  'school_financial_stats',
  CASE WHEN EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'school_financial_stats') 
    THEN '✅ Existe' 
    ELSE '❌ N''existe pas' 
  END
UNION ALL
SELECT 
  'level_financial_stats',
  CASE WHEN EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'level_financial_stats') 
    THEN '✅ Existe' 
    ELSE '❌ N''existe pas' 
  END
UNION ALL
SELECT 
  'class_financial_stats',
  CASE WHEN EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'class_financial_stats') 
    THEN '✅ Existe' 
    ELSE '❌ N''existe pas' 
  END;

-- Lister toutes les vues normales (non matérialisées)
SELECT 
  schemaname,
  viewname AS view_name,
  viewowner AS owner
FROM pg_views
WHERE schemaname = 'public'
  AND viewname LIKE '%financial%'
ORDER BY viewname;
