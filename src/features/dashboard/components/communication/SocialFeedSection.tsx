/**
 * Section Social Feed
 * Groupe général des admins de groupe scolaire avec Super Admin E-Pilot
 */

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  MessageCircle,
  Heart,
  ThumbsUp,
  Share2,
  MoreVertical,
  Image as ImageIcon,
  Video,
  FileText,
  Send,
  Pin,
  TrendingUp,
  Users,
  Calendar,
  MapPin,
  Paperclip,
  X,
  Upload
} from 'lucide-react';
import type { Post, SocialFeedStats, ReactionType } from '../../types/communication.types';

interface SocialFeedSectionProps {
  posts: Post[];
  stats: SocialFeedStats;
  isLoading: boolean;
  onCreatePost: () => void;
  onReact: (postId: string, reaction: ReactionType) => void;
  onComment?: (postId: string, content: string) => void;
}

export const SocialFeedSection = ({ 
  posts, 
  stats,
  isLoading,
  onCreatePost,
  onReact,
  onComment 
}: SocialFeedSectionProps) => {
  const [newPostContent, setNewPostContent] = useState('');
  const [attachments, setAttachments] = useState<Array<{ type: 'image' | 'video' | 'document'; file: File; preview?: string }>>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Nettoyage mémoire au unmount
  useEffect(() => {
    return () => {
      // Libérer toutes les URLs de preview
      attachments.forEach(att => {
        if (att.preview) {
          URL.revokeObjectURL(att.preview);
        }
      });
    };
  }, []);

  // Gestion des fichiers avec validation
  const handleFileSelect = (type: 'image' | 'video' | 'document', files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setUploadError(null);
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_FILES = 10;
    
    // Vérifier le nombre total de fichiers
    if (attachments.length + files.length > MAX_FILES) {
      setUploadError(`Maximum ${MAX_FILES} fichiers autorisés`);
      return;
    }
    
    const validFiles: Array<{ type: 'image' | 'video' | 'document'; file: File; preview?: string }> = [];
    const errors: string[] = [];
    
    Array.from(files).forEach(file => {
      // Validation taille
      if (file.size > MAX_SIZE) {
        errors.push(`${file.name} est trop volumineux (max 10MB)`);
        return;
      }
      
      // Validation type
      const validTypes: Record<string, string[]> = {
        image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        video: ['video/mp4', 'video/webm', 'video/ogg'],
        document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain']
      };
      
      if (!validTypes[type].includes(file.type)) {
        errors.push(`${file.name} : type de fichier non supporté`);
        return;
      }
      
      const attachment: { type: 'image' | 'video' | 'document'; file: File; preview?: string } = {
        type,
        file
      };
      
      // Créer preview pour les images
      if (type === 'image') {
        attachment.preview = URL.createObjectURL(file);
      }
      
      validFiles.push(attachment);
    });
    
    if (errors.length > 0) {
      setUploadError(errors.join(', '));
    }
    
    if (validFiles.length > 0) {
      setAttachments(prev => [...prev, ...validFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const newAttachments = [...prev];
      // Libérer l'URL de preview si c'est une image
      if (newAttachments[index].preview) {
        URL.revokeObjectURL(newAttachments[index].preview!);
      }
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  };

  const handlePublish = async () => {
    if ((!newPostContent.trim() && attachments.length === 0) || isPublishing) return;
    
    setIsPublishing(true);
    setUploadError(null);
    
    try {
      // TODO: Implémenter l'upload vers Supabase Storage
      // const uploadedFiles = await uploadToSupabase(attachments);
      // await createPost({ content: newPostContent, attachments: uploadedFiles });
      
      console.log('Publication:', { content: newPostContent, attachments });
      
      // Simuler délai réseau
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Libérer les URLs de preview
      attachments.forEach(att => {
        if (att.preview) {
          URL.revokeObjectURL(att.preview);
        }
      });
      
      onCreatePost();
      setNewPostContent('');
      setAttachments([]);
    } catch (error) {
      console.error('Erreur publication:', error);
      setUploadError('Erreur lors de la publication. Veuillez réessayer.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Stats cards
  const statsCards = [
    { 
      label: 'Publications', 
      value: stats.totalPosts, 
      icon: MessageCircle, 
      gradient: 'from-[#1D3557] to-[#457B9D]'
    },
    { 
      label: 'Commentaires', 
      value: stats.totalComments, 
      icon: MessageCircle, 
      gradient: 'from-[#2A9D8F] to-[#1d7a6f]'
    },
    { 
      label: 'Réactions', 
      value: stats.totalReactions, 
      icon: Heart, 
      gradient: 'from-[#E63946] to-[#c72030]'
    },
    { 
      label: 'Membres actifs', 
      value: stats.activeMembers, 
      icon: Users, 
      gradient: 'from-[#E9C46A] to-[#d4a84f]'
    },
  ];

  const getPostTypeConfig = (type: string) => {
    const configs = {
      announcement: { label: 'Annonce', icon: TrendingUp, color: 'bg-blue-100 text-blue-700' },
      discussion: { label: 'Discussion', icon: MessageCircle, color: 'bg-green-100 text-green-700' },
      poll: { label: 'Sondage', icon: TrendingUp, color: 'bg-purple-100 text-purple-700' },
      event: { label: 'Événement', icon: Calendar, color: 'bg-orange-100 text-orange-700' },
    };
    return configs[type as keyof typeof configs] || configs.discussion;
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now.getTime() - postDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return postDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  };

  const reactionIcons: Record<ReactionType, { icon: any; label: string; color: string }> = {
    like: { icon: ThumbsUp, label: 'J\'aime', color: 'text-blue-600' },
    love: { icon: Heart, label: 'Adore', color: 'text-red-600' },
    celebrate: { icon: TrendingUp, label: 'Bravo', color: 'text-green-600' },
    support: { icon: Heart, label: 'Soutien', color: 'text-purple-600' },
    insightful: { icon: TrendingUp, label: 'Instructif', color: 'text-orange-600' },
  };

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
      {/* Stats Cards */}
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

      {/* Create Post Card */}
      <Card className="p-6 bg-gradient-to-br from-white to-gray-50/50 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1D3557] to-[#457B9D] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-md">
              SA
            </div>
            <div className="flex-1">
              <Textarea
                placeholder="Partagez une annonce, une idée ou une question avec la communauté..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                disabled={isPublishing}
                className="min-h-[100px] resize-none border-gray-200 focus:border-[#2A9D8F] focus:ring-[#2A9D8F] bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Contenu de la publication"
              />
              
              {/* Message d'erreur */}
              {uploadError && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <X className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{uploadError}</p>
                  <button
                    onClick={() => setUploadError(null)}
                    className="ml-auto text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              {/* Aperçu des fichiers attachés */}
              {attachments.length > 0 && (
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                  {attachments.map((attachment, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                        {attachment.type === 'image' && attachment.preview ? (
                          <img 
                            src={attachment.preview} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                        ) : attachment.type === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1D3557] to-[#457B9D]">
                            <Video className="w-8 h-8 text-white" />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2A9D8F] to-[#1d7a6f]">
                            <FileText className="w-8 h-8 text-white" />
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-[#E63946] hover:bg-[#c72030] text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-1 left-1 right-1 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded truncate">
                        {attachment.file.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-2">
                  {/* Input caché pour images */}
                  <Input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelect('image', e.target.files)}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isPublishing}
                    className="hover:bg-[#1D3557] hover:text-white hover:border-[#1D3557] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Ajouter une image"
                  >
                    <ImageIcon className="w-4 h-4 mr-1" />
                    Image
                  </Button>

                  {/* Input caché pour vidéos */}
                  <Input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelect('video', e.target.files)}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isPublishing}
                    className="hover:bg-[#1D3557] hover:text-white hover:border-[#1D3557] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Ajouter une vidéo"
                  >
                    <Video className="w-4 h-4 mr-1" />
                    Vidéo
                  </Button>

                  {/* Input caché pour fichiers */}
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelect('document', e.target.files)}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isPublishing}
                    className="hover:bg-[#1D3557] hover:text-white hover:border-[#1D3557] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Ajouter un fichier"
                  >
                    <Paperclip className="w-4 h-4 mr-1" />
                    Fichier
                  </Button>
                </div>
                <Button 
                  onClick={handlePublish}
                  disabled={(!newPostContent.trim() && attachments.length === 0) || isPublishing}
                  className="bg-gradient-to-r from-[#2A9D8F] to-[#1d7a6f] hover:from-[#1D3557] hover:to-[#0d1f3d] text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Publier la publication"
                >
                  {isPublishing ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Publication...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Publier
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">Aucune publication</p>
              <p className="text-sm mt-1">Soyez le premier à publier quelque chose !</p>
            </div>
          </Card>
        ) : (
          posts.map((post) => {
            const typeConfig = getPostTypeConfig(post.type);
            const TypeIcon = typeConfig.icon;
            const totalReactions = post.reactions.length;
            const totalComments = post.comments.length;

            return (
                <Card key={post.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  {/* Post Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {post.authorAvatar ? (
                          <img 
                            src={post.authorAvatar} 
                            alt={post.authorName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#1D3557] flex items-center justify-center text-white font-semibold text-sm">
                            {post.authorName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Author Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900">{post.authorName}</h3>
                              <Badge variant="outline" className="text-xs">
                                {post.authorRole}
                              </Badge>
                              {post.authorSchoolGroup && (
                                <span className="text-xs text-gray-500">• {post.authorSchoolGroup}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">{getTimeAgo(post.createdAt)}</span>
                              {post.isEdited && (
                                <span className="text-xs text-gray-400">• Modifié</span>
                              )}
                              <Badge className={typeConfig.color}>
                                <TypeIcon className="w-3 h-3 mr-1" />
                                {typeConfig.label}
                              </Badge>
                              {post.isPinned && (
                                <Badge className="bg-yellow-100 text-yellow-700">
                                  <Pin className="w-3 h-3 mr-1" />
                                  Épinglé
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="px-6 pb-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>

                    {/* Event Info */}
                    {post.event && (
                      <Card className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-orange-100/50 border-orange-200">
                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-gray-900">{post.event.title}</h4>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(post.event.date).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {post.event.location}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Poll - Couleurs officielles E-Pilot */}
                    {post.poll && (
                      <Card className="mt-4 p-5 bg-gradient-to-br from-[#E9C46A]/10 via-white to-[#E9C46A]/5 border-2 border-[#E9C46A]/30 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E9C46A] to-[#d4a84f] flex items-center justify-center flex-shrink-0 shadow-md">
                            <TrendingUp className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-lg">{post.poll.question}</h4>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Se termine le {new Date(post.poll.endsAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {post.poll.options.map((option, index) => {
                            const totalVotes = post.poll!.options.reduce((sum, opt) => sum + opt.votes, 0);
                            const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                            
                            // Couleurs alternées E-Pilot
                            const gradients = [
                              'from-[#1D3557] to-[#457B9D]',
                              'from-[#2A9D8F] to-[#1d7a6f]',
                              'from-[#E9C46A] to-[#d4a84f]',
                              'from-[#E63946] to-[#c72030]'
                            ];
                            const gradient = gradients[index % gradients.length];
                            
                            return (
                              <button
                                key={option.id}
                                onClick={() => console.log('Vote pour:', option.id)}
                                className="w-full text-left p-4 rounded-xl bg-white hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all border-2 border-gray-200 hover:border-[#E9C46A] hover:shadow-md group"
                                aria-label={`Voter pour ${option.text} - ${percentage.toFixed(0)}% des votes`}
                                role="radio"
                                aria-checked={false}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-semibold text-gray-900 group-hover:text-[#1D3557] transition-colors">{option.text}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-600">{option.votes} vote{option.votes > 1 ? 's' : ''}</span>
                                    <Badge className={`bg-gradient-to-r ${gradient} text-white border-0 text-xs px-2`}>
                                      {percentage.toFixed(0)}%
                                    </Badge>
                                  </div>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                                  <div 
                                    className={`bg-gradient-to-r ${gradient} h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden`}
                                    style={{ width: `${percentage}%` }}
                                  >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {post.poll.options.reduce((sum, opt) => sum + opt.votes, 0)} participant{post.poll.options.reduce((sum, opt) => sum + opt.votes, 0) > 1 ? 's' : ''}
                          </p>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs hover:bg-[#E9C46A] hover:text-white hover:border-[#E9C46A] transition-colors"
                            aria-label="Participer au sondage"
                          >
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Voter
                          </Button>
                        </div>
                      </Card>
                    )}

                    {/* Attachments */}
                    {post.attachments && post.attachments.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {post.attachments.map((attachment) => (
                          <div key={attachment.id} className="relative group">
                            {attachment.type === 'image' && (
                              <img 
                                src={attachment.url} 
                                alt={attachment.name}
                                className="w-full h-48 object-cover rounded-lg"
                              />
                            )}
                            {attachment.type === 'video' && (
                              <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Video className="w-12 h-12 text-gray-400" />
                              </div>
                            )}
                            {attachment.type === 'document' && (
                              <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-12 h-12 text-gray-400" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reactions & Comments Summary */}
                  {(totalReactions > 0 || totalComments > 0) && (
                    <div className="px-6 pb-3 flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        {totalReactions > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="flex -space-x-1">
                              {Object.entries(
                                post.reactions.reduce((acc, r) => {
                                  acc[r.type] = (acc[r.type] || 0) + 1;
                                  return acc;
                                }, {} as Record<string, number>)
                              ).slice(0, 3).map(([type]) => {
                                const ReactionIcon = reactionIcons[type as ReactionType].icon;
                                const color = reactionIcons[type as ReactionType].color;
                                return (
                                  <div key={type} className="w-5 h-5 rounded-full bg-white flex items-center justify-center border border-gray-200">
                                    <ReactionIcon className={`w-3 h-3 ${color}`} />
                                  </div>
                                );
                              })}
                            </div>
                            <span>{totalReactions}</span>
                          </div>
                        )}
                      </div>
                      {totalComments > 0 && (
                        <span>{totalComments} commentaire{totalComments > 1 ? 's' : ''}</span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="border-t border-gray-100 px-6 py-2">
                    <div className="flex items-center justify-around">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="flex-1 hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => onReact(post.id, 'like')}
                      >
                        <ThumbsUp className="w-4 h-4 mr-2" />
                        J'aime
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="flex-1 hover:bg-green-50 hover:text-green-600"
                        onClick={() => onComment && onComment(post.id, '')}
                        aria-label="Commenter la publication"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Commenter
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="flex-1 hover:bg-purple-50 hover:text-purple-600"
                        onClick={() => console.log('Partager:', post.id)}
                        aria-label="Partager la publication"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Partager
                      </Button>
                    </div>
                  </div>

                  {/* Comments Section */}
                  {post.comments.length > 0 && (
                    <div className="border-t border-gray-100 px-6 py-4 bg-gray-50/50">
                      <div className="space-y-3">
                        {post.comments.slice(0, 2).map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2A9D8F] to-[#1D3557] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                              {comment.userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-sm text-gray-900">{comment.userName}</span>
                                  <Badge variant="outline" className="text-xs">{comment.userRole}</Badge>
                                  <span className="text-xs text-gray-500">
                                    {getTimeAgo(comment.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">{comment.content}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {post.comments.length > 2 && (
                          <Button variant="ghost" size="sm" className="text-[#2A9D8F] hover:text-[#1D3557]">
                            Voir les {post.comments.length - 2} autres commentaires
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
