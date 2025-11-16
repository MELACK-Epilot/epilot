/**
 * Hook pour écouter les changements temps réel Supabase
 * Synchronisation automatique entre tous les utilisateurs
 */

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useDocumentStore } from '../store/useDocumentStore';
import type { RealtimeChannel } from '@supabase/supabase-js';

export const useRealtimeDocuments = (schoolGroupId: string) => {
  const { setDocuments, loadComments } = useDocumentStore();

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupRealtimeSubscriptions = () => {
      // Canal unique pour toutes les subscriptions
      channel = supabase.channel(`documents-${schoolGroupId}`);

      // 1. Écouter les changements sur group_documents
      channel
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'group_documents',
            filter: `school_group_id=eq.${schoolGroupId}`,
          },
          (payload) => {
            console.log('📄 Document changé:', payload);
            // Recharger tous les documents
            loadDocuments();
          }
        )
        // 2. Écouter les réactions
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'document_reactions',
          },
          (payload) => {
            console.log('⭐ Réaction changée:', payload);
            // Recharger pour mettre à jour les compteurs
            loadDocuments();
          }
        )
        // 3. Écouter les commentaires
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'document_comments',
          },
          (payload) => {
            console.log('💬 Commentaire changé:', payload);
            
            if (payload.eventType === 'INSERT' && payload.new) {
              // Recharger les commentaires du document concerné
              const documentId = (payload.new as any).document_id;
              if (documentId) {
                loadComments(documentId);
              }
            }
            
            // Recharger les documents pour mettre à jour comments_count
            loadDocuments();
          }
        )
        // 4. Écouter les vues
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'document_views',
          },
          (payload) => {
            console.log('👁️ Vue ajoutée:', payload);
            // Recharger pour mettre à jour views_count
            loadDocuments();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Temps réel activé pour le Hub Documentaire');
          }
        });
    };

    const loadDocuments = async () => {
      try {
        const { data, error } = await supabase
          .from('group_documents')
          .select(`
            *,
            uploader:uploaded_by (
              id,
              first_name,
              last_name,
              role
            ),
            school:school_id (
              id,
              name
            ),
            reactions:document_reactions (
              id,
              reaction_type,
              user_id
            )
          `)
          .eq('school_group_id', schoolGroupId)
          .eq('is_archived', false)
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDocuments(data || []);
      } catch (error) {
        console.error('Erreur chargement documents:', error);
      }
    };

    // Charger les documents initialement
    loadDocuments();

    // Configurer les subscriptions temps réel
    setupRealtimeSubscriptions();

    // Cleanup
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
        console.log('🔌 Déconnexion temps réel');
      }
    };
  }, [schoolGroupId, setDocuments, loadComments]);
};
