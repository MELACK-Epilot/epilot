/**
 * Carte de document dans le feed
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  MessageSquare,
  Eye,
  Pin,
  MoreVertical,
  Trash2,
  Edit,
  Calendar,
  User,
  Tag,
  School,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { GroupDocument, ReactionType } from '../types/document-hub.types';
import { CommentsSection } from './CommentsSection';

interface DocumentCardProps {
  document: GroupDocument;
  onView: (documentId: string) => void;
  onDownload: (documentId: string) => void;
  onComment: (documentId: string) => void;
  onReact: (documentId: string, reactionType: ReactionType) => void;
  onEdit?: (documentId: string) => void;
  onDelete?: (documentId: string) => void;
  onPin?: (documentId: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canPin?: boolean;
  currentUserId: string;
}

const reactionIcons: Record<ReactionType, string> = {
  vu: '👁️',
  important: '⭐',
  utile: '❤️',
  like: '👍',
};

const categoryColors: Record<string, string> = {
  Administratif: 'bg-blue-100 text-blue-700',
  Pédagogique: 'bg-green-100 text-green-700',
  Financier: 'bg-yellow-100 text-yellow-700',
  RH: 'bg-purple-100 text-purple-700',
  Technique: 'bg-orange-100 text-orange-700',
  Autre: 'bg-gray-100 text-gray-700',
};

export const DocumentCard = ({
  document,
  onView,
  onDownload,
  onComment,
  onReact,
  onEdit,
  onDelete,
  onPin,
  canEdit = false,
  canDelete = false,
  canPin = false,
  currentUserId,
}: DocumentCardProps) => {
  const [showComments, setShowComments] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR');
  };

  const handleCardClick = () => {
    onView(document.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl border-2 transition-all hover:shadow-lg ${
        document.is_pinned ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
      }`}
    >
      {/* En-tête */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {document.is_pinned && (
                <Pin className="h-4 w-4 text-yellow-600 fill-yellow-600" />
              )}
              <h3 
                className="text-lg font-bold text-gray-900 hover:text-blue-600 cursor-pointer"
                onClick={handleCardClick}
              >
                {document.title}
              </h3>
            </div>

            {/* Métadonnées */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              {/* Auteur */}
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>
                  {document.uploader
                    ? `${document.uploader.first_name} ${document.uploader.last_name}`
                    : 'Utilisateur'}
                </span>
              </div>

              {/* Date */}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(document.created_at)}</span>
              </div>

              {/* École */}
              {document.school && (
                <div className="flex items-center gap-1">
                  <School className="h-4 w-4" />
                  <span>{document.school.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Menu actions */}
          {(canEdit || canDelete || canPin) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canPin && onPin && (
                  <DropdownMenuItem onClick={() => onPin(document.id)}>
                    <Pin className="h-4 w-4 mr-2" />
                    {document.is_pinned ? 'Désépingler' : 'Épingler'}
                  </DropdownMenuItem>
                )}
                {canEdit && onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(document.id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                )}
                {canDelete && onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(document.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Catégorie et tags */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge className={categoryColors[document.category] || categoryColors.Autre}>
            {document.category}
          </Badge>
          {document.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>

        {/* Description */}
        {document.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {document.description}
          </p>
        )}

        {/* Informations fichier */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>{document.file_name}</span>
          </div>
          <span>•</span>
          <span>{formatFileSize(document.file_size)}</span>
        </div>

        {/* Statistiques */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{document.views_count} vues</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            <span>{document.downloads_count} téléchargements</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>{document.comments_count} commentaires</span>
          </div>
        </div>

        {/* Réactions */}
        <div className="flex items-center gap-2 mb-4">
          {(['vu', 'important', 'utile', 'like'] as ReactionType[]).map((type) => {
            const count = document.reactions?.filter(r => r.reaction_type === type).length || 0;
            return (
              <button
                key={type}
                onClick={() => onReact(document.id, type)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
              >
                <span>{reactionIcons[type]}</span>
                <span className="text-gray-700">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => onDownload(document.id)}
            className="flex-1 bg-blue-500 hover:bg-blue-600"
          >
            <Download className="h-4 w-4 mr-2" />
            Télécharger
          </Button>
          <Button
            onClick={() => {
              setShowComments(!showComments);
              onComment(document.id);
            }}
            variant="outline"
            className="flex-1"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Commenter
          </Button>
        </div>
      </div>

      {/* Section commentaires */}
      {showComments && (
        <CommentsSection
          documentId={document.id}
          currentUserId={currentUserId}
        />
      )}
    </motion.div>
  );
};
