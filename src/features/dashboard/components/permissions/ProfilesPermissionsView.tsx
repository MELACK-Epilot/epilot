/**
 * Vue Profils - Permissions & Modules
 * Gestion des profils prédéfinis d'assignation
 * @module ProfilesPermissionsView
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCog, Plus, Edit, Trash2, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAccessProfiles } from '../../hooks/useAccessProfiles';
import { ProfileFormDialog } from './ProfileFormDialog';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

interface ProfilesPermissionsViewProps {
  onRefresh: () => void;
}

// Fonction pour générer une couleur cohérente à partir d'une chaîne
const stringToColor = (str: string) => {
  const colors = [
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#8B5CF6', // Violet
    '#3B82F6', // Blue
    '#EC4899', // Pink
    '#EF4444', // Red
    '#06B6D4', // Cyan
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const ProfilesPermissionsView = ({ onRefresh }: ProfilesPermissionsViewProps) => {
  const queryClient = useQueryClient();
  const { data: profiles, isLoading } = useAccessProfiles();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);

  const handleCreateProfile = () => {
    setSelectedProfile(null);
    setIsDialogOpen(true);
  };

  const handleEditProfile = (profile: any) => {
    setSelectedProfile(profile);
    setIsDialogOpen(true);
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce profil ?')) return;

    try {
      const { error } = await supabase
        .from('access_profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['access-profiles'] });
      toast.success('Profil supprimé avec succès');
      onRefresh(); // Refresh parent if needed
    } catch (error: any) {
      toast.error('Erreur lors de la suppression', {
        description: error.message
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/50 rounded-lg">
              <Info className="h-5 w-5 text-purple-600 flex-shrink-0" />
            </div>
            <div>
              <p className="text-sm font-bold text-purple-900 mb-1">
                Profils d'Assignation
              </p>
              <p className="text-xs text-purple-700 leading-relaxed">
                Créez des modèles pour standardiser les accès. Chaque profil définit un ensemble de permissions 
                qui sera automatiquement appliqué aux utilisateurs correspondants.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          Profils disponibles
          <Badge variant="secondary" className="ml-2">{profiles?.length || 0}</Badge>
        </h3>
        <Button onClick={handleCreateProfile} className="gap-2 bg-[#2A9D8F] hover:bg-[#238276] shadow-sm hover:shadow-md transition-all">
          <Plus className="h-4 w-4" />
          Créer un profil
        </Button>
      </div>

      {/* Liste profils */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {profiles?.map((profile: any, index: number) => {
            const color = stringToColor(profile.code || profile.id);
            return (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-5 hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-[#2A9D8F] group relative overflow-hidden">
                  {/* Color stripe */}
                  <div className="absolute top-0 left-0 w-1 h-full transition-all" style={{ backgroundColor: color }} />
                  
                  <div className="flex items-start justify-between mb-3 pl-2">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      <UserCog className="h-6 w-6" style={{ color: color }} />
                    </div>
                    {['proviseur', 'enseignant', 'comptable'].some(r => profile.code.includes(r)) && (
                      <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                        Système
                      </Badge>
                    )}
                  </div>

                  <div className="pl-2">
                    <h4 className="font-bold text-gray-900 mb-1 text-lg">{profile.name_fr}</h4>
                    <p className="text-xs font-mono text-gray-400 mb-2">{profile.code}</p>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
                      {profile.description || 'Aucune description'}
                    </p>

                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="outline" className="text-xs bg-gray-50/50">
                        {Object.keys(profile.permissions || {}).length > 0 ? 'Configuré' : 'À configurer'}
                      </Badge>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditProfile(profile)}
                        className="flex-1 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteProfile(profile.id)}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Message si vide */}
      {(!profiles || profiles.length === 0) && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200"
        >
          <UserCog className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun profil configuré
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Commencez par créer des profils pour définir les rôles et les accès de vos utilisateurs.
          </p>
          <Button onClick={handleCreateProfile} className="bg-[#2A9D8F] hover:bg-[#238276]">
            <Plus className="h-4 w-4 mr-2" />
            Créer un profil
          </Button>
        </motion.div>
      )}

      <ProfileFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        profileToEdit={selectedProfile}
      />
    </div>
  );
};
