/**
 * Section commentaires optimisée avec Zustand
 * Updates instantanées sans rechargement
 */

import { useState, useEffect } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useDocumentStore } from '../store/useDocumentStore';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface CommentsSectionOptimizedProps {
  documentId: string;
  currentUserId: string;
  currentUserName: string;
  onAddComment: (content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
}

export const CommentsSectionOptimized = ({
  documentId,
  currentUserId,
  currentUserName,
  onAddComment,
  onDeleteComment,
}: CommentsSectionOptimizedProps) => {
  const { comments, loadComments } = useDocumentStore();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  const documentComments = comments[documentId] || [];

  // Charger les commentaires au montage
  useEffect(() => {
    loadComments(documentId);
  }, [documentId, loadComments]);

  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment);
      setNewComment('');
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (commentId: string) => {
    setCommentToDelete(commentId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!commentToDelete) return;
    await onDeleteComment(commentToDelete);
  };

  return (
    <div className="border-t border-gray-200 p-6 bg-gray-50 space-y-4">
      {/* Formulaire nouveau commentaire */}
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-blue-100 text-blue-600">
            {currentUserName.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            placeholder="Ajouter un commentaire..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] resize-none"
            disabled={isSubmitting}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleSubmit();
              }
            }}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              Ctrl+Enter pour envoyer
            </span>
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
        {documentComments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            Aucun commentaire. Soyez le premier à commenter !
          </p>
        ) : (
          documentComments.map((comment) => (
            <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                    {comment.user_id === currentUserId && (
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
