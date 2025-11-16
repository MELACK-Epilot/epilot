/**
 * Page Réseau des Écoles
 * Social feed pour les écoles du groupe
 */

import { useState } from 'react';
import { Network, Users, MessageSquare, Heart, MessageCircle, Share2, Send, Image as ImageIcon, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ContactSchoolsModal } from '../components/modals/ContactSchoolsModal';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { motion } from 'framer-motion';
import { StatsCard } from '../components/StatsCard';

export const SchoolNetworkPage = () => {
  const { data: user } = useCurrentUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPost, setNewPost] = useState('');

  // Mock data
  const posts = [
    {
      id: '1',
      author: 'Marie Dupont',
      school: 'École Primaire A',
      avatar: 'MD',
      content: 'Excellente journée pédagogique aujourd’hui ! Merci à tous les participants.',
      timestamp: '2025-01-15T10:30:00',
      likes: 12,
      comments: 3,
      shares: 1,
    },
    {
      id: '2',
      author: 'Jean Martin',
      school: 'École Secondaire B',
      avatar: 'JM',
      content: 'Quelqu’un aurait-il des ressources sur l’enseignement des mathématiques en 6ème ?',
      timestamp: '2025-01-14T15:20:00',
      likes: 8,
      comments: 5,
      shares: 2,
    },
  ];

  const handlePostSubmit = () => {
    if (newPost.trim()) {
      // TODO: Envoyer le post
      setNewPost('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Network className="h-6 w-6 text-white" />
            </div>
            Réseau des Écoles
          </h1>
          <p className="text-gray-600 mt-1">
            Échangez avec les autres établissements du groupe
          </p>
        </div>

        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Contacter les écoles
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Écoles du réseau"
          value={8}
          subtitle="Établissements connectés"
          icon={Network}
          color="from-orange-500 to-orange-600"
          delay={0}
        />

        <StatsCard
          title="Membres actifs"
          value={156}
          subtitle="Utilisateurs du réseau"
          icon={Users}
          color="from-blue-500 to-blue-600"
          delay={0.1}
        />

        <StatsCard
          title="Publications"
          value={342}
          subtitle="Posts partagés"
          icon={MessageSquare}
          color="from-green-500 to-green-600"
          delay={0.2}
        />
      </div>

      {/* Nouvelle publication */}
      <Card className="p-6">
        <div className="flex gap-4">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-orange-100 text-orange-600">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="Partagez quelque chose avec le réseau..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <div className="flex items-center justify-between mt-3">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Photo
                </Button>
                <Button variant="ghost" size="sm">
                  <Smile className="h-4 w-4 mr-2" />
                  Emoji
                </Button>
              </div>
              <Button 
                onClick={handlePostSubmit}
                disabled={!newPost.trim()}
                className="bg-gradient-to-r from-orange-500 to-orange-600"
              >
                <Send className="h-4 w-4 mr-2" />
                Publier
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Feed des publications */}
      <div className="space-y-4">
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow">
              {/* Header du post */}
              <div className="flex items-start gap-4 mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-orange-100 text-orange-600">
                    {post.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{post.author}</h4>
                  <p className="text-sm text-gray-600">
                    {post.school} • {new Date(post.timestamp).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              {/* Contenu */}
              <p className="text-gray-700 mb-4">{post.content}</p>

              {/* Actions */}
              <div className="flex items-center gap-6 pt-4 border-t">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-red-500">
                  <Heart className="h-4 w-4 mr-2" />
                  {post.likes}
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-500">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {post.comments}
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-green-500">
                  <Share2 className="h-4 w-4 mr-2" />
                  {post.shares}
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      <ContactSchoolsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        schoolName={user?.schoolGroupId || ''}
        schoolId={user?.schoolId || ''}
      />
    </div>
  );
};
