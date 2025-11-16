/**
 * Types pour le Hub Documentaire Social
 */

export type DocumentCategory = 
  | 'Administratif'
  | 'Pédagogique'
  | 'Financier'
  | 'RH'
  | 'Technique'
  | 'Autre';

export type DocumentVisibility = 'group' | 'school' | 'private';

export type ReactionType = 'vu' | 'important' | 'utile' | 'like';

export interface GroupDocument {
  id: string;
  school_group_id: string;
  school_id: string | null;
  title: string;
  description: string | null;
  category: DocumentCategory;
  tags: string[];
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  visibility: DocumentVisibility;
  is_pinned: boolean;
  is_archived: boolean;
  views_count: number;
  downloads_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  
  // Relations (si chargées)
  uploader?: {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    avatar: string | null;
  };
  school?: {
    id: string;
    name: string;
  };
}

export interface DocumentComment {
  id: string;
  document_id: string;
  user_id: string;
  parent_comment_id: string | null;
  comment: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    avatar: string | null;
  };
  replies?: DocumentComment[];
}

export interface DocumentReaction {
  id: string;
  document_id: string;
  user_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

export interface DocumentView {
  id: string;
  document_id: string;
  user_id: string;
  viewed_at: string;
}

// Types pour les formulaires
export interface UploadDocumentForm {
  title: string;
  description: string;
  category: DocumentCategory;
  tags: string[];
  visibility: DocumentVisibility;
  school_id: string | null;
  file: File;
}

export interface DocumentFilters {
  category?: DocumentCategory;
  school_id?: string;
  uploaded_by?: string;
  tags?: string[];
  search?: string;
  is_pinned?: boolean;
  date_from?: string;
  date_to?: string;
}

export interface DocumentStats {
  total_documents: number;
  total_views: number;
  total_downloads: number;
  total_comments: number;
  by_category: Record<DocumentCategory, number>;
  most_viewed: GroupDocument[];
  most_downloaded: GroupDocument[];
  recent_uploads: GroupDocument[];
}

// Props pour les composants
export interface DocumentHubProps {
  schoolGroupId: string;
  currentUserId: string;
}

export interface DocumentCardProps {
  document: GroupDocument;
  onView: (documentId: string) => void;
  onDownload: (documentId: string) => void;
  onComment: (documentId: string) => void;
  onReact: (documentId: string, reactionType: ReactionType) => void;
  onEdit?: (documentId: string) => void;
  onDelete?: (documentId: string) => void;
  onPin?: (documentId: string) => void;
}

export interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolGroupId: string;
  schools: Array<{ id: string; name: string }>;
  onSuccess: () => void;
}

export interface DocumentCommentsProps {
  documentId: string;
  comments: DocumentComment[];
  onAddComment: (comment: string, parentId?: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  currentUserId: string;
}

export interface DocumentReactionsProps {
  documentId: string;
  reactions: Record<ReactionType, number>;
  userReactions: ReactionType[];
  onReact: (reactionType: ReactionType) => Promise<void>;
}
