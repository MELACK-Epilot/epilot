/**
 * Types TypeScript pour le module Communication
 * Tickets, Messagerie, Social Feed
 */

// ============= TICKETS / PLAINTES =============
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketCategory = 'technique' | 'pedagogique' | 'financier' | 'administratif' | 'autre';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdBy: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
    schoolGroup?: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    avatar?: string;
  };
  attachments?: string[];
  comments: TicketComment[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  avgResolutionTime: number; // en heures
}

// ============= MESSAGERIE =============
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';
export type MessageType = 'direct' | 'group' | 'broadcast';

export interface Message {
  id: string;
  type: MessageType;
  subject?: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientIds: string[];
  recipients: MessageRecipient[];
  attachments?: MessageAttachment[];
  status: MessageStatus;
  isRead: boolean;
  sentAt: string;
  readAt?: string;
  replyTo?: string;
}

export interface MessageRecipient {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  schoolGroup?: string;
  isRead: boolean;
  readAt?: string;
}

export interface MessageAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface Conversation {
  id: string;
  participants: MessageRecipient[];
  lastMessage: Message;
  unreadCount: number;
  updatedAt: string;
}

export interface MessageDraft {
  id: string;
  subject: string;
  content: string;
  recipientIds: string[];
  attachments?: MessageAttachment[];
  updatedAt: string;
}

export interface MessagingStats {
  totalSent: number;
  totalReceived: number;
  unread: number;
  drafts: number;
}

// ============= SOCIAL FEED =============
export type PostType = 'announcement' | 'discussion' | 'poll' | 'event';
export type ReactionType = 'like' | 'love' | 'celebrate' | 'support' | 'insightful';

export interface Post {
  id: string;
  type: PostType;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: string;
  authorSchoolGroup?: string;
  attachments?: PostAttachment[];
  reactions: PostReaction[];
  comments: PostComment[];
  isPinned: boolean;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  // Pour les sondages
  poll?: {
    question: string;
    options: PollOption[];
    endsAt: string;
  };
  // Pour les événements
  event?: {
    title: string;
    date: string;
    location: string;
  };
}

export interface PostAttachment {
  id: string;
  type: 'image' | 'video' | 'document';
  url: string;
  name: string;
  size: number;
}

export interface PostReaction {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: ReactionType;
  createdAt: string;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole: string;
  content: string;
  reactions: PostReaction[];
  createdAt: string;
  updatedAt?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[]; // User IDs
}

export interface SocialFeedStats {
  totalPosts: number;
  totalComments: number;
  totalReactions: number;
  activeMembers: number;
}

// ============= FILTRES & RECHERCHE =============
export interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
  assignedToMe?: boolean;
  createdByMe?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface MessageFilters {
  type?: MessageType[];
  isRead?: boolean;
  hasAttachments?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface PostFilters {
  type?: PostType[];
  authorId?: string;
  isPinned?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}
