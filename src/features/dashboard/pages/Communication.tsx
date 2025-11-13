/**
 * Page Communication - Hub complet
 * Tickets/Plaintes, Messagerie, Social Feed
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  LifeBuoy,
  Mail,
  Users
} from 'lucide-react';
import { TicketsSection } from '../components/communication/TicketsSection';
import { MessagingSection } from '../components/communication/MessagingSection';
import { SocialFeedSection } from '../components/communication/SocialFeedSection';
import { ComposeMessageDialog } from '../components/communication/ComposeMessageDialog';
import { ViewMessageDialog } from '../components/communication/ViewMessageDialog';
import { CreateTicketDialog } from '../components/communication/CreateTicketDialog';
import { ViewTicketDialog } from '../components/communication/ViewTicketDialog';
import { 
  useTickets, 
  useTicketsStats,
  useMessages,
  useMessagingStats,
  useConversations,
  usePosts,
  useSocialFeedStats
} from '../hooks/useCommunication';
import type { Ticket, Message, ReactionType } from '../types/communication.types';

export const Communication = () => {
  const [activeTab, setActiveTab] = useState('social');
  
  // États pour les modals
  const [isComposeMessageOpen, setIsComposeMessageOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Tickets
  const { data: tickets = [], isLoading: ticketsLoading } = useTickets();
  const { data: ticketsStats } = useTicketsStats();

  // Messaging
  const { data: messages = [], isLoading: messagesLoading } = useMessages();
  const { data: messagingStats } = useMessagingStats();
  const { data: conversations = [] } = useConversations();

  // Social Feed
  const { data: posts = [], isLoading: postsLoading } = usePosts();
  const { data: socialStats } = useSocialFeedStats();

  // Handlers pour Tickets
  const handleCreateTicket = () => {
    setIsCreateTicketOpen(true);
  };

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  const handleTicketCreate = (data: any) => {
    console.log('Creating ticket:', data);
    // TODO: Appel API pour créer le ticket
  };

  const handleAddComment = (ticketId: string, comment: string) => {
    console.log('Adding comment to ticket:', ticketId, comment);
    // TODO: Appel API pour ajouter un commentaire
  };

  const handleUpdateTicketStatus = (ticketId: string, status: any) => {
    console.log('Updating ticket status:', ticketId, status);
    // TODO: Appel API pour mettre à jour le statut
  };

  // Handlers pour Messages
  const handleComposeMessage = () => {
    setIsComposeMessageOpen(true);
  };

  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
  };

  const handleSendMessage = (data: any) => {
    console.log('Sending message:', data);
    // TODO: Appel API pour envoyer le message
  };

  const handleReplyMessage = (message: Message) => {
    console.log('Reply to message:', message);
    // TODO: Ouvrir modal de réponse
  };

  const handleForwardMessage = (message: Message) => {
    console.log('Forward message:', message);
    // TODO: Ouvrir modal de transfert
  };

  const handleDeleteMessage = (message: Message) => {
    console.log('Delete message:', message);
    // TODO: Appel API pour supprimer le message
  };

  const handleCreatePost = () => {
    console.log('Create post');
    // TODO: Publier le post
  };

  const handleReact = (postId: string, reaction: ReactionType) => {
    console.log('React to post:', postId, reaction);
    // TODO: Ajouter réaction
  };

  const handleComment = (postId: string, content: string) => {
    console.log('Comment on post:', postId, content);
    // TODO: Ajouter commentaire
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header simple */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-[#1D3557]" />
            Communication
          </h1>
          <p className="text-gray-500 mt-1">Gérez vos tickets, messages et publications</p>
        </div>
      </div>

      {/* Tabs Navigation simple */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 h-auto p-1">
          <TabsTrigger 
            value="social"
            className="data-[state=active]:bg-white py-3"
          >
            <Users className="w-4 h-4 mr-2" />
            Social Feed
            {socialStats && socialStats.totalPosts > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-200 text-xs">
                {socialStats.totalPosts}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="messaging"
            className="data-[state=active]:bg-white py-3"
          >
            <Mail className="w-4 h-4 mr-2" />
            Messagerie
            {messagingStats && messagingStats.unread > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-[#E63946] text-white text-xs font-semibold">
                {messagingStats.unread}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="tickets"
            className="data-[state=active]:bg-white py-3"
          >
            <LifeBuoy className="w-4 h-4 mr-2" />
            Tickets
            {ticketsStats && ticketsStats.open > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs">
                {ticketsStats.open}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Social Feed Tab */}
        <TabsContent value="social" className="mt-6">
          <SocialFeedSection
            posts={posts}
            stats={socialStats || { totalPosts: 0, totalComments: 0, totalReactions: 0, activeMembers: 0 }}
            isLoading={postsLoading}
            onCreatePost={handleCreatePost}
            onReact={handleReact}
            onComment={handleComment}
          />
        </TabsContent>

        {/* Messaging Tab */}
        <TabsContent value="messaging" className="mt-6">
          <MessagingSection
            conversations={conversations}
            messages={messages}
            stats={messagingStats || { totalSent: 0, totalReceived: 0, unread: 0, drafts: 0 }}
            isLoading={messagesLoading}
            onComposeMessage={handleComposeMessage}
            onViewMessage={handleViewMessage}
          />
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="mt-6">
          <TicketsSection
            tickets={tickets}
            stats={ticketsStats || { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0, avgResolutionTime: 0 }}
            isLoading={ticketsLoading}
            onCreateTicket={handleCreateTicket}
            onViewTicket={handleViewTicket}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ComposeMessageDialog
        isOpen={isComposeMessageOpen}
        onClose={() => setIsComposeMessageOpen(false)}
        onSend={handleSendMessage}
      />

      <ViewMessageDialog
        message={selectedMessage}
        isOpen={selectedMessage !== null}
        onClose={() => setSelectedMessage(null)}
        onReply={handleReplyMessage}
        onForward={handleForwardMessage}
        onDelete={handleDeleteMessage}
      />

      <CreateTicketDialog
        isOpen={isCreateTicketOpen}
        onClose={() => setIsCreateTicketOpen(false)}
        onCreate={handleTicketCreate}
      />

      <ViewTicketDialog
        ticket={selectedTicket}
        isOpen={selectedTicket !== null}
        onClose={() => setSelectedTicket(null)}
        onAddComment={handleAddComment}
        onUpdateStatus={handleUpdateTicketStatus}
      />
    </div>
  );
};

export default Communication;
