/**
 * Hook optimisé pour le Hub Documentaire avec Zustand
 * Updates instantanées sans rechargement
 */

import { useEffect, useCallback } from 'react';
import { useDocumentStore } from '../store/useDocumentStore';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import type { ReactionType, UploadDocumentForm } from '../types/document-hub.types';

export const useDocumentHubOptimized = (schoolGroupId: string, currentUserId: string) => {
  const { toast } = useToast();
  const {
    documents,
    comments,
    isLoading,
    setDocuments,
    toggleReaction,
    addComment,
    loadComments,
    deleteComment,
    incrementViews,
    incrementDownloads,
  } = useDocumentStore();

  // Charger les documents
  const loadDocuments = useCallback(async () => {
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
    } catch (error: any) {
      console.error('Erreur chargement documents:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les documents.",
        variant: "destructive",
      });
    }
  }, [schoolGroupId, setDocuments, toast]);

  // Réaction instantanée
  const handleReaction = useCallback(async (documentId: string, reactionType: ReactionType) => {
    await toggleReaction(documentId, reactionType, currentUserId);
  }, [toggleReaction, currentUserId]);

  // Vue instantanée
  const handleView = useCallback(async (documentId: string) => {
    incrementViews(documentId);
    
    // Enregistrer en BDD en arrière-plan
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('document_views')
        .upsert({
          document_id: documentId,
          user_id: user.id,
        }, {
          onConflict: 'document_id,user_id'
        });
    } catch (error) {
      console.error('Erreur vue:', error);
    }
  }, [incrementViews]);

  // Téléchargement instantané
  const handleDownload = useCallback(async (documentId: string) => {
    const document = documents.find(d => d.id === documentId);
    if (!document) return;

    incrementDownloads(documentId);

    try {
      const { data, error } = await supabase.storage
        .from('group-documents')
        .createSignedUrl(document.file_path, 60);

      if (error) throw error;
      window.open(data.signedUrl, '_blank');

      // Mise à jour BDD en arrière-plan
      await supabase
        .from('group_documents')
        .update({ downloads_count: document.downloads_count + 1 })
        .eq('id', documentId);
    } catch (error: any) {
      console.error('Erreur téléchargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le document.",
        variant: "destructive",
      });
    }
  }, [documents, incrementDownloads, toast]);

  // Commentaire instantané
  const handleAddComment = useCallback(async (documentId: string, content: string, userName: string) => {
    try {
      await addComment(documentId, content, currentUserId, userName);
      toast({
        title: 'Commentaire ajouté',
        description: 'Votre commentaire a été publié.',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter le commentaire.',
        variant: 'destructive',
      });
    }
  }, [addComment, currentUserId, toast]);

  // Supprimer commentaire
  const handleDeleteComment = useCallback(async (documentId: string, commentId: string) => {
    try {
      await deleteComment(documentId, commentId);
      toast({
        title: 'Commentaire supprimé',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le commentaire.',
        variant: 'destructive',
      });
    }
  }, [deleteComment, toast]);

  // Upload document
  const uploadDocument = useCallback(async (formData: UploadDocumentForm) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');

      const fileExt = formData.file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${schoolGroupId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('group-documents')
        .upload(filePath, formData.file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('group_documents')
        .insert({
          school_group_id: schoolGroupId,
          school_id: formData.school_id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          tags: formData.tags,
          file_name: formData.file.name,
          file_path: filePath,
          file_size: formData.file.size,
          file_type: formData.file.type,
          uploaded_by: user.id,
          visibility: formData.visibility,
        });

      if (dbError) throw dbError;

      toast({
        title: "Document publié !",
        description: `${formData.title} a été ajouté au hub documentaire.`,
      });

      await loadDocuments();
    } catch (error: any) {
      console.error('Erreur upload:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de publier le document.",
        variant: "destructive",
      });
      throw error;
    }
  }, [schoolGroupId, toast, loadDocuments]);

  // Charger au montage
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return {
    documents,
    comments,
    isLoading,
    loadDocuments,
    handleReaction,
    handleView,
    handleDownload,
    handleAddComment,
    handleDeleteComment,
    loadComments,
    uploadDocument,
  };
};
