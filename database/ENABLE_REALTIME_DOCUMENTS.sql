-- =====================================================
-- ACTIVATION TEMPS RÉEL SUPABASE - HUB DOCUMENTAIRE
-- =====================================================
-- Date: 16 Novembre 2025
-- Description: Active les subscriptions temps réel pour le Hub Documentaire

-- =====================================================
-- 1. ACTIVER REALTIME SUR LES TABLES
-- =====================================================

-- Table principale des documents
ALTER PUBLICATION supabase_realtime ADD TABLE group_documents;

-- Table des vues
ALTER PUBLICATION supabase_realtime ADD TABLE document_views;

-- Table des réactions
ALTER PUBLICATION supabase_realtime ADD TABLE document_reactions;

-- Table des commentaires
ALTER PUBLICATION supabase_realtime ADD TABLE document_comments;

-- =====================================================
-- 2. VÉRIFIER L'ACTIVATION
-- =====================================================

-- Vérifier que les tables sont bien dans la publication
SELECT 
    schemaname,
    tablename
FROM 
    pg_publication_tables
WHERE 
    pubname = 'supabase_realtime'
    AND tablename IN (
        'group_documents',
        'document_views',
        'document_reactions',
        'document_comments'
    )
ORDER BY 
    tablename;

-- =====================================================
-- 3. COMMENTAIRES
-- =====================================================

COMMENT ON TABLE group_documents IS 'Documents du groupe - Temps réel activé pour updates instantanées';
COMMENT ON TABLE document_views IS 'Vues des documents - Temps réel activé pour compteur en direct';
COMMENT ON TABLE document_reactions IS 'Réactions aux documents - Temps réel activé pour likes instantanés';
COMMENT ON TABLE document_comments IS 'Commentaires des documents - Temps réel activé pour chat en direct';

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================
