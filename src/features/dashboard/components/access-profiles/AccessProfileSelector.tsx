/**
 * Composant de sélection de profil d'accès
 * Interface simple et claire pour choisir un profil lors de l'assignation
 * @module AccessProfileSelector
 */

import React from 'react';
import { Check, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccessProfiles } from '../../hooks/useAccessProfiles';
import type { AccessProfile } from '@/stores/access-profiles.store';

interface AccessProfileSelectorProps {
  selectedProfileCode: string | null;
  onSelectProfile: (code: string) => void;
  className?: string;
}

export const AccessProfileSelector: React.FC<AccessProfileSelectorProps> = ({
  selectedProfileCode,
  onSelectProfile,
  className,
}) => {
  const { data: profiles, isLoading } = useAccessProfiles();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-20 bg-gray-100 animate-pulse rounded-lg" />
        <div className="h-20 bg-gray-100 animate-pulse rounded-lg" />
        <div className="h-20 bg-gray-100 animate-pulse rounded-lg" />
      </div>
    );
  }

  const profilesList = profiles || [];

  if (profilesList.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Info className="h-8 w-8 mx-auto mb-2" />
        <p>Aucun profil d'accès disponible</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Info className="h-4 w-4 text-blue-600" />
        <p className="text-sm text-gray-600">
          Sélectionnez le profil d'accès à appliquer au module
        </p>
      </div>

      {profilesList.map((profile: AccessProfile) => (
        <ProfileCard
          key={profile.code}
          profile={profile}
          isSelected={selectedProfileCode === profile.code}
          onSelect={() => onSelectProfile(profile.code)}
        />
      ))}
    </div>
  );
};

interface ProfileCardProps {
  profile: AccessProfile;
  isSelected: boolean;
  onSelect: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, isSelected, onSelect }) => {
  const scope = profile.permissions.scope;
  
  // Couleurs par profil
  const getProfileColor = (code: string) => {
    switch (code) {
      case 'chef_etablissement':
        return 'border-green-500 bg-green-50 hover:bg-green-100';
      case 'financier_sans_suppression':
        return 'border-yellow-500 bg-yellow-50 hover:bg-yellow-100';
      case 'administratif_basique':
        return 'border-pink-500 bg-pink-50 hover:bg-pink-100';
      case 'enseignant_saisie_notes':
        return 'border-orange-500 bg-orange-50 hover:bg-orange-100';
      case 'parent_consultation':
        return 'border-cyan-500 bg-cyan-50 hover:bg-cyan-100';
      case 'eleve_consultation':
        return 'border-lime-500 bg-lime-50 hover:bg-lime-100';
      default:
        return 'border-gray-500 bg-gray-50 hover:bg-gray-100';
    }
  };

  // Icône par scope
  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case 'TOUTE_LECOLE':
        return '🏫';
      case 'SES_CLASSES_ET_MATIERES':
        return '📚';
      case 'SES_ENFANTS_UNIQUEMENT':
        return '👨‍👩‍👧';
      case 'LUI_MEME_UNIQUEMENT':
        return '👤';
      default:
        return '📋';
    }
  };

  // Label scope
  const getScopeLabel = (scope: string) => {
    switch (scope) {
      case 'TOUTE_LECOLE':
        return 'Toute l\'école';
      case 'SES_CLASSES_ET_MATIERES':
        return 'Ses classes et matières';
      case 'SES_ENFANTS_UNIQUEMENT':
        return 'Ses enfants uniquement';
      case 'LUI_MEME_UNIQUEMENT':
        return 'Lui-même uniquement';
      default:
        return scope;
    }
  };

  // Permissions résumées
  const getPermissionsSummary = (profile: AccessProfile) => {
    const perms = [];
    
    if (profile.permissions.pedagogie.read) perms.push('📖 Pédagogie');
    if (profile.permissions.vie_scolaire.read) perms.push('🎯 Vie scolaire');
    if (profile.permissions.administration.read) perms.push('📋 Administration');
    if (profile.permissions.finances.read) perms.push('💰 Finances');
    
    return perms;
  };

  const permissions = getPermissionsSummary(profile);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left p-4 rounded-lg border-2 transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        isSelected
          ? 'border-blue-600 bg-blue-50 shadow-md'
          : `${getProfileColor(profile.code)} border-gray-200`
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Nom du profil */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{getScopeIcon(scope)}</span>
            <h3 className={cn(
              'font-semibold text-base',
              isSelected ? 'text-blue-900' : 'text-gray-900'
            )}>
              {profile.name_fr}
            </h3>
          </div>

          {/* Description */}
          {profile.description && (
            <p className="text-sm text-gray-600 mb-3">
              {profile.description}
            </p>
          )}

          {/* Scope */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-gray-500">Portée:</span>
            <span className="text-xs font-semibold text-gray-700">
              {getScopeLabel(scope)}
            </span>
          </div>

          {/* Permissions */}
          <div className="flex flex-wrap gap-2">
            {permissions.map((perm, index) => (
              <span
                key={index}
                className={cn(
                  'text-xs px-2 py-1 rounded-full',
                  isSelected
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                )}
              >
                {perm}
              </span>
            ))}
          </div>
        </div>

        {/* Checkmark si sélectionné */}
        {isSelected && (
          <div className="ml-4">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <Check className="h-4 w-4 text-white" />
            </div>
          </div>
        )}
      </div>
    </button>
  );
};
