/**
 * Section Messagerie
 * Inbox, Outbox, Messages directs et groupes
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Inbox,
  Send,
  Archive,
  Trash2,
  Search,
  Plus,
  Mail,
  Paperclip,
  Star,
  Reply,
  Forward,
  MoreVertical,
  Users
} from 'lucide-react';
import type { Message, Conversation, MessagingStats } from '../../types/communication.types';

interface MessagingSectionProps {
  conversations?: Conversation[];
  messages: Message[];
  stats: MessagingStats;
  isLoading: boolean;
  onComposeMessage: () => void;
  onViewMessage: (message: Message) => void;
}

export const MessagingSection = ({ 
  conversations,
  messages, 
  stats,
  isLoading,
  onComposeMessage,
  onViewMessage 
}: MessagingSectionProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('inbox');

  // Stats cards avec couleurs E-Pilot
  const statsCards = [
    { 
      label: 'Reçus', 
      value: stats.totalReceived, 
      icon: Inbox, 
      gradient: 'from-[#1D3557] to-[#457B9D]'
    },
    { 
      label: 'Envoyés', 
      value: stats.totalSent, 
      icon: Send, 
      gradient: 'from-[#2A9D8F] to-[#1d7a6f]'
    },
    { 
      label: 'Non lus', 
      value: stats.unread, 
      icon: Mail, 
      gradient: 'from-[#E63946] to-[#c72030]'
    },
    { 
      label: 'Brouillons', 
      value: stats.drafts, 
      icon: Archive, 
      gradient: 'from-[#E9C46A] to-[#d4a84f]'
    },
  ];

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return messageDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const filteredMessages = messages.filter(msg => 
    msg.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.senderName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards - Design moderne E-Pilot */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={stat.label} 
              className="relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0"
              style={{
                animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`
              }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-90`} />
              <div className="relative p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/90">{stat.label}</p>
                    <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              {/* Cercle décoratif */}
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full" />
            </Card>
          );
        })}
      </div>

      {/* Messaging Interface */}
      <Card className="overflow-hidden">
          <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex-1 w-full lg:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher dans les messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 bg-white"
                  />
                </div>
              </div>
              
              <Button
                onClick={onComposeMessage}
                className="bg-gradient-to-r from-[#2A9D8F] to-[#1D3557] hover:opacity-90 h-11"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Message
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-200 px-6">
              <TabsList className="bg-transparent h-auto p-0">
                <TabsTrigger 
                  value="inbox" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-[#2A9D8F] rounded-none px-6 py-3"
                >
                  <Inbox className="w-4 h-4 mr-2" />
                  Boîte de réception
                  {stats.unread > 0 && (
                    <Badge className="ml-2 bg-[#E63946] text-white">{stats.unread}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="sent"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-[#2A9D8F] rounded-none px-6 py-3"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Envoyés
                </TabsTrigger>
                <TabsTrigger 
                  value="drafts"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-[#2A9D8F] rounded-none px-6 py-3"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Brouillons
                </TabsTrigger>
                <TabsTrigger 
                  value="trash"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-[#2A9D8F] rounded-none px-6 py-3"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Corbeille
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="inbox" className="p-0 m-0">
              <div className="divide-y divide-gray-100">
                {filteredMessages.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Mail className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">Aucun message</p>
                    <p className="text-sm mt-1">Votre boîte de réception est vide</p>
                  </div>
                ) : (
                  filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors group ${
                        !message.isRead ? 'bg-blue-50/30' : ''
                      }`}
                      onClick={() => onViewMessage(message)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {message.senderAvatar ? (
                            <img 
                              src={message.senderAvatar} 
                              alt={message.senderName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#1D3557] flex items-center justify-center text-white font-semibold text-sm">
                              {message.senderName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className={`font-semibold text-gray-900 truncate ${
                                !message.isRead ? 'font-bold' : ''
                              }`}>
                                {message.senderName}
                              </span>
                              {message.type === 'group' && (
                                <Badge variant="outline" className="text-xs">
                                  <Users className="w-3 h-3 mr-1" />
                                  Groupe
                                </Badge>
                              )}
                              {!message.isRead && (
                                <div className="w-2 h-2 rounded-full bg-[#2A9D8F]" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-gray-500">
                                {getTimeAgo(message.sentAt)}
                              </span>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                                <Star className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {message.subject && (
                            <p className={`text-sm mb-1 truncate ${
                              !message.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'
                            }`}>
                              {message.subject}
                            </p>
                          )}
                          
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {message.content}
                          </p>

                          {message.attachments && message.attachments.length > 0 && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                              <Paperclip className="w-3 h-3" />
                              <span>{message.attachments.length} pièce(s) jointe(s)</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Reply className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Forward className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="sent" className="p-8 text-center text-gray-500">
              <Send className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">Messages envoyés</p>
              <p className="text-sm mt-1">Consultez vos messages envoyés</p>
            </TabsContent>

            <TabsContent value="drafts" className="p-8 text-center text-gray-500">
              <Archive className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">Brouillons</p>
              <p className="text-sm mt-1">Aucun brouillon enregistré</p>
            </TabsContent>

            <TabsContent value="trash" className="p-8 text-center text-gray-500">
              <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">Corbeille</p>
              <p className="text-sm mt-1">La corbeille est vide</p>
            </TabsContent>
          </Tabs>
        </Card>
    </div>
  );
};
