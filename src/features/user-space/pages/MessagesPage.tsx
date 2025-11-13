/**
 * Page Messagerie pour l'espace Proviseur
 * Design moderne inspiré de Slack/Teams
 * React 19 Best Practices
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Send,
  Search,
  Plus,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useCurrentUser } from '../hooks/useCurrentUser';

export const MessagesPage = () => {
  const { data: user } = useCurrentUser();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  // Données mockées
  const conversations = [
    {
      id: '1',
      name: 'Marie Dupont',
      role: 'Enseignante',
      lastMessage: 'Merci pour votre retour !',
      time: '10:30',
      unread: 2,
      online: true,
    },
    {
      id: '2',
      name: 'Jean Martin',
      role: 'CPE',
      lastMessage: 'Réunion à 14h ?',
      time: 'Hier',
      unread: 0,
      online: false,
    },
    {
      id: '3',
      name: 'Sophie Bernard',
      role: 'Comptable',
      lastMessage: 'Les documents sont prêts',
      time: '15/11',
      unread: 1,
      online: true,
    },
  ];

  return (
    <div className="h-[calc(100vh-8rem)]">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-[#2A9D8F]" />
          Messagerie
        </h1>
        <p className="text-gray-600 mt-1">
          Communiquez avec votre équipe
        </p>
      </motion.div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100%-6rem)]">
        {/* Liste des conversations */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-12 lg:col-span-4"
        >
          <Card className="h-full flex flex-col rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50/50">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">Messages</h2>
                <Button size="icon" variant="ghost" className="rounded-xl">
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  className="pl-10 bg-white rounded-xl"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conv, index) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                    selectedConversation === conv.id
                      ? 'bg-[#2A9D8F]/5 border-l-4 border-l-[#2A9D8F]'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-to-br from-[#2A9D8F] to-[#1D3557] text-white">
                          {conv.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {conv.online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {conv.name}
                        </p>
                        <span className="text-xs text-gray-500">{conv.time}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{conv.role}</p>
                      <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                    </div>
                    {conv.unread > 0 && (
                      <Badge className="bg-[#2A9D8F] text-white rounded-full">
                        {conv.unread}
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Zone de conversation */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-12 lg:col-span-8"
        >
          <Card className="h-full flex flex-col rounded-2xl overflow-hidden">
            {selectedConversation ? (
              <>
                {/* Header conversation */}
                <div className="p-4 border-b border-gray-200 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-[#2A9D8F] to-[#1D3557] text-white">
                          MD
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900">Marie Dupont</p>
                        <p className="text-xs text-green-600">En ligne</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost" className="rounded-xl">
                        <Phone className="h-5 w-5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="rounded-xl">
                        <Video className="h-5 w-5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="rounded-xl">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
                  <div className="flex justify-start">
                    <div className="max-w-xs bg-white rounded-2xl rounded-tl-sm p-3 shadow-sm">
                      <p className="text-sm text-gray-900">
                        Bonjour, j'ai besoin de votre aide pour organiser la réunion.
                      </p>
                      <span className="text-xs text-gray-500 mt-1 block">10:25</span>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-xs bg-gradient-to-br from-[#2A9D8F] to-[#238b7e] rounded-2xl rounded-tr-sm p-3 shadow-sm">
                      <p className="text-sm text-white">
                        Bien sûr ! Je suis disponible cet après-midi.
                      </p>
                      <span className="text-xs text-white/80 mt-1 block">10:28</span>
                    </div>
                  </div>
                </div>

                {/* Input message */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" className="rounded-xl">
                      <Paperclip className="h-5 w-5" />
                    </Button>
                    <Input
                      placeholder="Écrivez votre message..."
                      className="flex-1 rounded-xl"
                    />
                    <Button size="icon" variant="ghost" className="rounded-xl">
                      <Smile className="h-5 w-5" />
                    </Button>
                    <Button className="bg-gradient-to-r from-[#2A9D8F] to-[#238b7e] rounded-xl">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Sélectionnez une conversation</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Choisissez un contact pour commencer à discuter
                  </p>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
