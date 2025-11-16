/**
 * Section des commentaires pour un document
 */

import { useState, useEffect } from 'react';
import { Send, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface CommentsSectionProps {
  documentId: string;
  currentUserId: string;
}

export const CommentsSection = ({ documentId, currentUserId }: CommentsSectionProps) => {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  // Charger les commentaires
  const loadComments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_comments')
        .select(`
          id,
          comment,
          created_at,
          user:user_id (
            id,
            first_name,
            last_name
          )
        `)
        .eq('document_id', documentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Erreur chargement commentaires:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Ajouter un commentaire
  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');

      const { error } = await supabase
        .from('document_comments')
        .insert({
          document_id: documentId,
          user_id: user.id,
          comment: newComment.trim(),
        });

      if (error) throw error;

      toast({
        title: 'Commentaire ajouté',
        description: 'Votre commentaire a été publié.',
      });

      setNewComment('');
      await loadComments();
    } catch (error: any) {
      console.error('Erreur ajout commentaire:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter le commentaire.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ouvrir le dialog de confirmation
  const openDeleteDialog = (commentId: string) => {
    setCommentToDelete(commentId);
    setDeleteDialogOpen(true);
  };

  // Supprimer un commentaire
  const handleDelete = async () => {
    if (!commentToDelete) return;

    try {
      const { error } = await supabase
        .from('document_comments')
        .delete()
        .eq('id', commentToDelete);

      if (error) throw error;

      toast({
        title: 'Commentaire supprimé',
        description: 'Le commentaire a été supprimé avec succès.',
      });

      await loadComments();
    } catch (error) {
      console.error('Erreur suppression commentaire:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le commentaire.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    loadComments();
  }, [documentId]);

  return (
    <div className="border-t border-gray-200 p-6 bg-gray-50 space-y-4">
      {/* Formulaire nouveau commentaire */}
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-blue-100 text-blue-600">
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            placeholder="Ajouter un commentaire..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] resize-none"
            disabled={isSubmitting}
          />
          <div className="flex justify-end mt-2">
            <Button
              onClick={handleSubmit}
              disabled={!newComment.trim() || isSubmitting}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Envoi...' : 'Commenter'}
            </Button>
          </div>
        </div>
      </div>

      {/* Liste des commentaires */}
      <div className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-gray-500 text-center py-4">Chargement...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            Aucun commentaire. Soyez le premier à commenter !
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                  {comment.user.first_name[0]}{comment.user.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {comment.user.first_name} {comment.user.last_name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {comment.user.id === currentUserId && (
                      <button
                        onClick={() => openDeleteDialog(comment.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Supprimer le commentaire"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700">{comment.comment}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dialog de confirmation de suppression */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Supprimer ce commentaire ?"
        description="Cette action est irréversible. Le commentaire sera définitivement supprimé."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
        icon="trash"
      />
    </div>
  );
};
