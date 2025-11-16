/**
 * Hook personnalisé pour gérer le Hub Documentaire
 */

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import type {
  GroupDocument,
  DocumentComment,
  DocumentFilters,
  ReactionType,
  UploadDocumentForm
} from '../types/document-hub.types';

export const useDocumentHub = (schoolGroupId: string) => {
  const { toast } = useToast();
  
  const [documents, setDocuments] = useState<GroupDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<GroupDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<DocumentFilters>({});

  // Charger les documents
  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('group_documents')
        .select(`
          *,
          uploader:uploaded_by (
            id,
            first_name,
            last_name,
            role,
            avatar
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

      const { data, error } = await query;

      if (error) throw error;
      
      setDocuments(data || []);
      setFilteredDocuments(data || []);
    } catch (error: any) {
      console.error('Erreur chargement documents:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les documents.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [schoolGroupId, toast]);

  // Appliquer les filtres
  const applyFilters = useCallback((newFilters: DocumentFilters) => {
    setFilters(newFilters);
    
    let filtered = [...documents];

    // Filtre par catégorie
    if (newFilters.category) {
      filtered = filtered.filter(doc => doc.category === newFilters.category);
    }

    // Filtre par école
    if (newFilters.school_id) {
      filtered = filtered.filter(doc => doc.school_id === newFilters.school_id);
    }

    // Filtre par auteur
    if (newFilters.uploaded_by) {
      filtered = filtered.filter(doc => doc.uploaded_by === newFilters.uploaded_by);
    }

    // Filtre par tags
    if (newFilters.tags && newFilters.tags.length > 0) {
      filtered = filtered.filter(doc => 
        newFilters.tags!.some(tag => doc.tags.includes(tag))
      );
    }

    // Recherche textuelle
    if (newFilters.search) {
      const searchLower = newFilters.search.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(searchLower) ||
        doc.description?.toLowerCase().includes(searchLower) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Filtre épinglés
    if (newFilters.is_pinned !== undefined) {
      filtered = filtered.filter(doc => doc.is_pinned === newFilters.is_pinned);
    }

    setFilteredDocuments(filtered);
  }, [documents]);

  // Upload un document
  const uploadDocument = useCallback(async (formData: UploadDocumentForm) => {
    try {
      // 1. Récupérer l'utilisateur
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');

      // 2. Upload du fichier vers Supabase Storage
      const fileExt = formData.file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${schoolGroupId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('group-documents')
        .upload(filePath, formData.file);

      if (uploadError) throw uploadError;

      // 3. Créer l'entrée en base de données
      const { data: document, error: dbError } = await supabase
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
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast({
        title: "Document publié !",
        description: `${formData.title} a été ajouté au hub documentaire.`,
      });

      // Recharger les documents
      await loadDocuments();

      return document;
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

  // Télécharger un document
  const downloadDocument = useCallback(async (documentId: string) => {
    try {
      const document = documents.find(d => d.id === documentId);
      if (!document) return;

      // 1. Obtenir l'URL signée
      const { data, error } = await supabase.storage
        .from('group-documents')
        .createSignedUrl(document.file_path, 60); // 60 secondes

      if (error) throw error;

      // 2. Télécharger le fichier
      window.open(data.signedUrl, '_blank');

      // 3. Incrémenter le compteur de téléchargements
      await supabase
        .from('group_documents')
        .update({ downloads_count: document.downloads_count + 1 })
        .eq('id', documentId);

      // Recharger les documents
      await loadDocuments();
    } catch (error: any) {
      console.error('Erreur téléchargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le document.",
        variant: "destructive",
      });
    }
  }, [documents, toast, loadDocuments]);

  // Enregistrer une vue
  const recordView = useCallback(async (documentId: string) => {
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
      console.error('Erreur enregistrement vue:', error);
    }
  }, []);

  // Ajouter une réaction
  const addReaction = useCallback(async (documentId: string, reactionType: ReactionType) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');

      // Vérifier si la réaction existe déjà
      const { data: existing } = await supabase
        .from('document_reactions')
        .select('id')
        .eq('document_id', documentId)
        .eq('user_id', user.id)
        .eq('reaction_type', reactionType)
        .single();

      if (existing) {
        // Supprimer la réaction
        await supabase
          .from('document_reactions')
          .delete()
          .eq('id', existing.id);
      } else {
        // Ajouter la réaction
        await supabase
          .from('document_reactions')
          .insert({
            document_id: documentId,
            user_id: user.id,
            reaction_type: reactionType,
          });
      }

      await loadDocuments();
    } catch (error: any) {
      console.error('Erreur réaction:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la réaction.",
        variant: "destructive",
      });
    }
  }, [toast, loadDocuments]);

  // Épingler/Désépingler un document
  const togglePin = useCallback(async (documentId: string) => {
    try {
      const document = documents.find(d => d.id === documentId);
      if (!document) return;

      await supabase
        .from('group_documents')
        .update({ is_pinned: !document.is_pinned })
        .eq('id', documentId);

      toast({
        title: document.is_pinned ? "Document désépinglé" : "Document épinglé",
        description: document.is_pinned 
          ? "Le document ne sera plus affiché en haut."
          : "Le document sera affiché en haut du feed.",
      });

      await loadDocuments();
    } catch (error: any) {
      console.error('Erreur épinglage:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le document.",
        variant: "destructive",
      });
    }
  }, [documents, toast, loadDocuments]);

  // Supprimer un document
  const deleteDocument = useCallback(async (documentId: string) => {
    try {
      const document = documents.find(d => d.id === documentId);
      if (!document) return;

      // 1. Supprimer le fichier du storage
      await supabase.storage
        .from('group-documents')
        .remove([document.file_path]);

      // 2. Supprimer l'entrée en base
      await supabase
        .from('group_documents')
        .delete()
        .eq('id', documentId);

      toast({
        title: "Document supprimé",
        description: "Le document a été supprimé définitivement.",
      });

      await loadDocuments();
    } catch (error: any) {
      console.error('Erreur suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le document.",
        variant: "destructive",
      });
    }
  }, [documents, toast, loadDocuments]);

  // Charger les documents au montage
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return {
    documents: filteredDocuments,
    isLoading,
    filters,
    applyFilters,
    uploadDocument,
    downloadDocument,
    recordView,
    addReaction,
    togglePin,
    deleteDocument,
    refreshDocuments: loadDocuments,
  };
};
