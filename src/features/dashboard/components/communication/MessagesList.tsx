/**
 * Liste des messages avec interactions
 */

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Mail,
  MailOpen,
  User,
  Calendar,
  Trash2,
  Reply,
  Eye,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Message {
  id: string;
  subject: string;
  content: string;
  senderName: string;
  senderAvatar?: string;
  senderRole: string;
  senderSchoolGroupName?: string;
  senderSchoolGroupCode?: string;
  senderSchoolGroupCity?: string;
  sentAt: string;
  isRead: boolean;
  priority: 'normal' | 'high' | 'urgent';
  messageType: 'direct' | 'broadcast';
}

interface MessagesListProps {
  messages: Message[];
  isLoading: boolean;
  onMessageClick: (message: Message) => void;
  onReply: (message: Message) => void;
  onDelete: (messageId: string) => void;
  selectedMessages?: string[];
  onToggleSelection?: (messageId: string) => void;
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

export const MessagesList = ({
  messages,
  isLoading,
  onMessageClick,
  onReply,
  onDelete,
  selectedMessages = [],
  onToggleSelection,
}: MessagesListProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A9D8F]"></div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <Card className="p-8 text-center border-0 shadow-sm">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-10 h-10 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun message</h3>
        <p className="text-gray-500">Vous n'avez pas encore de messages</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => {
        const priorityColors = {
          normal: 'bg-gray-100 text-gray-700',
          high: 'bg-orange-100 text-orange-700',
          urgent: 'bg-red-100 text-red-700',
        };

        return (
          <motion.div
            key={message.id}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <Card
              className={`p-4 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group ${
                !message.isRead ? 'bg-blue-50 border-l-4 border-l-[#2A9D8F]' : ''
              }`}
              onClick={() => onMessageClick(message)}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                {onToggleSelection && (
                  <div className="flex-shrink-0 pt-1">
                    <Checkbox 
                      checked={selectedMessages.includes(message.id)}
                      onCheckedChange={() => onToggleSelection(message.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="border-gray-400"
                    />
                  </div>
                )}

                {/* Avatar */}
                <div className="flex-shrink-0">
                  {message.senderAvatar ? (
                    <img
                      src={message.senderAvatar}
                      alt={message.senderName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1D3557] to-[#2A9D8F] flex items-center justify-center text-white font-semibold">
                      {message.senderName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold text-gray-900 line-clamp-1 ${!message.isRead ? 'font-bold' : ''}`}>
                          {message.subject}
                        </h3>
                        {!message.isRead && (
                          <Badge className="bg-[#2A9D8F] text-white text-xs">Nouveau</Badge>
                        )}
                        {message.messageType === 'broadcast' && (
                          <Badge variant="outline" className="text-xs">Broadcast</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {message.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {message.isRead ? (
                        <MailOpen className="w-5 h-5 text-gray-400" />
                      ) : (
                        <Mail className="w-5 h-5 text-[#2A9D8F]" />
                      )}
                      <Badge className={priorityColors[message.priority]}>
                        {message.priority === 'urgent' ? 'Urgent' : message.priority === 'high' ? 'Important' : 'Normal'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    {/* Ligne 1: Nom + Rôle */}
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1 text-gray-700">
                        <User className="w-3 h-3" />
                        <span className="font-semibold">{message.senderName}</span>
                      </div>
                      {message.senderRole && (
                        <Badge variant="outline" className="text-xs px-2 py-0">
                          {message.senderRole}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Ligne 2: Groupe Scolaire + Date */}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {message.senderSchoolGroupName && (
                        <div className="flex items-center gap-1">
                          <span>📍</span>
                          <span className="font-medium text-gray-600">{message.senderSchoolGroupName}</span>
                          {message.senderSchoolGroupCity && (
                            <span className="text-gray-400">• {message.senderSchoolGroupCity}</span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{format(new Date(message.sentAt), 'dd MMM HH:mm', { locale: fr })}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMessageClick(message); }}>
                      <Eye className="w-4 h-4 mr-2" />
                      Lire
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onReply(message); }}>
                      <Reply className="w-4 h-4 mr-2" />
                      Répondre
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(message.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};
