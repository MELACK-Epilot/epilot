/**
 * Vue Profils - Permissions & Modules
 * Gestion des profils prédéfinis d'assignation
 * @module ProfilesPermissionsView
 */

import { useState } from 'react';
import { UserCog, Plus, Edit, Trash2, Copy, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ProfilesPermissionsViewProps {
  onRefresh: () => void;
}

export const ProfilesPermissionsView = ({ onRefresh }: ProfilesPermissionsViewProps) => {
  // Profils exemples (à remplacer par vraies données)
  const [profiles] = useState([
    {
      id: '1',
      name: 'Enseignant Standard',
      description: 'Accès aux modules pédagogiques de base',
      role_suggestion: 'enseignant',
      modules_count: 8,
      is_default: true,
      color: '#F59E0B'
    },
    {
      id: '2',
      name: 'Comptable Complet',
      description: 'Tous les modules financiers et comptables',
      role_suggestion: 'comptable',
      modules_count: 6,
      is_default: true,
      color: '#10B981'
    },
    {
      id: '3',
      name: 'Proviseur',
      description: 'Accès complet à tous les modules',
      role_suggestion: 'proviseur',
      modules_count: 47,
      is_default: true,
      color: '#8B5CF6'
    }
  ]);

  const handleCreateProfile = () => {
    toast.info('Création de profil', {
      description: 'Fonctionnalité disponible prochainement'
    });
  };

  const handleEditProfile = (profileId: string) => {
    toast.info('Édition de profil', {
      description: 'Fonctionnalité disponible prochainement'
    });
  };

  const handleDeleteProfile = (profileId: string) => {
    toast.info('Suppression de profil', {
      description: 'Fonctionnalité disponible prochainement'
    });
  };

  const handleApplyProfile = (profileId: string) => {
    toast.info('Application de profil', {
      description: 'Fonctionnalité disponible prochainement'
    });
  };

  return (
    <div className="space-y-4">
      {/* Info */}
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-purple-900 mb-1">
              Profils d'Assignation
            </p>
            <p className="text-xs text-purple-700">
              Créez des templates pour assigner rapidement les mêmes modules à plusieurs utilisateurs
            </p>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Profils disponibles ({profiles.length})
        </h3>
        <Button onClick={handleCreateProfile} className="gap-2 bg-[#2A9D8F] hover:bg-[#238276]">
          <Plus className="h-4 w-4" />
          Créer un profil
        </Button>
      </div>

      {/* Liste profils */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((profile) => (
          <Card key={profile.id} className="p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${profile.color}20` }}
              >
                <UserCog className="h-6 w-6" style={{ color: profile.color }} />
              </div>
              {profile.is_default && (
                <Badge variant="secondary" className="text-xs">
                  Par défaut
                </Badge>
              )}
            </div>

            <h4 className="font-semibold text-gray-900 mb-1">{profile.name}</h4>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {profile.description}
            </p>

            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="text-xs">
                {profile.modules_count} modules
              </Badge>
              <Badge variant="outline" className="text-xs">
                {profile.role_suggestion}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleApplyProfile(profile.id)}
                className="flex-1"
              >
                <Copy className="h-3 w-3 mr-1" />
                Appliquer
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEditProfile(profile.id)}
              >
                <Edit className="h-3 w-3" />
              </Button>
              {!profile.is_default && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteProfile(profile.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Message si vide */}
      {profiles.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <UserCog className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun profil créé
            </h3>
            <p className="text-gray-600 mb-4">
              Créez votre premier profil pour gagner du temps
            </p>
            <Button onClick={handleCreateProfile} className="bg-[#2A9D8F] hover:bg-[#238276]">
              <Plus className="h-4 w-4 mr-2" />
              Créer un profil
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
