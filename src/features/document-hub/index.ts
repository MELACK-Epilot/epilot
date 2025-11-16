/**
 * Point d'entrée du module Hub Documentaire
 */

// Composants
export { DocumentHub } from './components/DocumentHub';
export { DocumentCard } from './components/DocumentCard';
export { UploadDocumentModal } from './components/UploadDocumentModal';

// Hook
export { useDocumentHub } from './hooks/useDocumentHub';

// Types
export type {
  GroupDocument,
  DocumentComment,
  DocumentReaction,
  DocumentView,
  DocumentCategory,
  DocumentVisibility,
  ReactionType,
  UploadDocumentForm,
  DocumentFilters,
  DocumentStats,
  DocumentHubProps,
  DocumentCardProps,
  UploadDocumentModalProps,
} from './types/document-hub.types';
