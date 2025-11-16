/**
 * Store Zustand pour le Hub Documentaire
 * Optimistic updates pour réactivité instantanée
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { GroupDocument, ReactionType } from '../types/document-hub.types';

interface DocumentComment {
  id: string;
  comment: string;
  created_at: string;
  user_id: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface DocumentStore {
  // État
  documents: GroupDocument[];
  comments: Record<string, DocumentComment[]>;
  isLoading: boolean;
  
  // Actions
  setDocuments: (documents: GroupDocument[]) => void;
  
  // Réactions - Optimistic update
  toggleReaction: (documentId: string, reactionType: ReactionType, userId: string) => Promise<void>;
  
  // Commentaires
  addComment: (documentId: string, content: string, userId: string, userName: string) => Promise<void>;
  loadComments: (documentId: string) => Promise<void>;
  deleteComment: (documentId: string, commentId: string) => Promise<void>;
  
  // Vues et téléchargements
  incrementViews: (documentId: string) => void;
  incrementDownloads: (documentId: string) => void;
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  comments: {},
  isLoading: false,

  setDocuments: (documents) => set({ documents }),

  // Toggle réaction avec optimistic update
  toggleReaction: async (documentId, reactionType, userId) => {
    const { documents } = get();
    const docIndex = documents.findIndex(d => d.id === documentId);
    if (docIndex === -1) return;

    const doc = documents[docIndex];
    const reactions = doc.reactions || [];
    const existingReaction = reactions.find(
      r => r.user_id === userId && r.reaction_type === reactionType
    );

    // Optimistic update - Mise à jour immédiate de l'UI
    const newReactions = existingReaction
      ? reactions.filter(r => !(r.user_id === userId && r.reaction_type === reactionType))
      : [...reactions, { id: 'temp', user_id: userId, reaction_type: reactionType }];

    const updatedDocuments = [...documents];
    updatedDocuments[docIndex] = {
      ...doc,
      reactions: newReactions,
    };
    set({ documents: updatedDocuments });

    // Mise à jour BDD en arrière-plan
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (existingReaction) {
        await supabase
          .from('document_reactions')
          .delete()
          .eq('document_id', documentId)
          .eq('user_id', user.id)
          .eq('reaction_type', reactionType);
      } else {
        await supabase
          .from('document_reactions')
          .insert({
            document_id: documentId,
            user_id: user.id,
            reaction_type: reactionType,
          });
      }
    } catch (error) {
      console.error('Erreur réaction:', error);
      // Rollback en cas d'erreur
      set({ documents });
    }
  },

  // Incrémenter vues (optimistic)
  incrementViews: (documentId) => {
    const { documents } = get();
    const updatedDocuments = documents.map(doc =>
      doc.id === documentId
        ? { ...doc, views_count: doc.views_count + 1 }
        : doc
    );
    set({ documents: updatedDocuments });
  },

  // Incrémenter téléchargements (optimistic)
  incrementDownloads: (documentId) => {
    const { documents } = get();
    const updatedDocuments = documents.map(doc =>
      doc.id === documentId
        ? { ...doc, downloads_count: doc.downloads_count + 1 }
        : doc
    );
    set({ documents: updatedDocuments });
  },

  // Charger commentaires
  loadComments: async (documentId) => {
    try {
      const { data, error } = await supabase
        .from('document_comments')
        .select(`
          id,
          comment,
          created_at,
          user_id,
          user:user_id (
            id,
            first_name,
            last_name
          )
        `)
        .eq('document_id', documentId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      set(state => ({
        comments: {
          ...state.comments,
          [documentId]: data || [],
        },
      }));
    } catch (error) {
      console.error('Erreur chargement commentaires:', error);
    }
  },

  // Ajouter commentaire (optimistic)
  addComment: async (documentId, content, userId, userName) => {
    // Optimistic update
    const tempComment: DocumentComment = {
      id: `temp-${Date.now()}`,
      comment: content,
      created_at: new Date().toISOString(),
      user_id: userId,
      user: {
        id: userId,
        first_name: userName.split(' ')[0] || 'User',
        last_name: userName.split(' ')[1] || '',
      },
    };

    set(state => ({
      comments: {
        ...state.comments,
        [documentId]: [...(state.comments[documentId] || []), tempComment],
      },
      documents: state.documents.map(doc =>
        doc.id === documentId
          ? { ...doc, comments_count: doc.comments_count + 1 }
          : doc
      ),
    }));

    // Mise à jour BDD
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');

      const { data, error } = await supabase
        .from('document_comments')
        .insert({
          document_id: documentId,
          user_id: user.id,
          comment: content.trim(),
        })
        .select(`
          id,
          comment,
          created_at,
          user_id,
          user:user_id (
            id,
            first_name,
            last_name
          )
        `)
        .single();

      if (error) throw error;

      // Remplacer le commentaire temporaire par le vrai
      set(state => ({
        comments: {
          ...state.comments,
          [documentId]: state.comments[documentId].map(c =>
            c.id === tempComment.id ? data : c
          ),
        },
      }));
    } catch (error) {
      console.error('Erreur ajout commentaire:', error);
      // Rollback
      set(state => ({
        comments: {
          ...state.comments,
          [documentId]: state.comments[documentId].filter(c => c.id !== tempComment.id),
        },
        documents: state.documents.map(doc =>
          doc.id === documentId
            ? { ...doc, comments_count: Math.max(0, doc.comments_count - 1) }
            : doc
        ),
      }));
      throw error;
    }
  },

  // Supprimer commentaire (optimistic)
  deleteComment: async (documentId, commentId) => {
    const { comments } = get();
    const oldComments = comments[documentId] || [];

    // Optimistic update
    set(state => ({
      comments: {
        ...state.comments,
        [documentId]: oldComments.filter(c => c.id !== commentId),
      },
      documents: state.documents.map(doc =>
        doc.id === documentId
          ? { ...doc, comments_count: Math.max(0, doc.comments_count - 1) }
          : doc
      ),
    }));

    // Mise à jour BDD
    try {
      const { error } = await supabase
        .from('document_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur suppression commentaire:', error);
      // Rollback
      set(state => ({
        comments: {
          ...state.comments,
          [documentId]: oldComments,
        },
        documents: state.documents.map(doc =>
          doc.id === documentId
            ? { ...doc, comments_count: doc.comments_count + 1 }
            : doc
        ),
      }));
      throw error;
    }
  },
}));
