/**
 * Onglet Vue d'ensemble
 * @module user-details/tabs/OverviewTab
 */

import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User as UserIcon, Building2, UserCog, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getRoleLabel, getProfileLabel } from '../utils';
import type { User } from '../../../../types/dashboard.types';

interface OverviewTabProps {
  user: User;
  profiles: Array<{ code: string; name_fr: string }>;
  canManageUser: boolean;
  isAdminRole: boolean;
  onProfileChange: (profileCode: string) => void;
  isUpdating: boolean;
}

export const OverviewTab = ({
  user,
  profiles,
  canManageUser,
  isAdminRole,
  onProfileChange,
  isUpdating,
}: OverviewTabProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Personal Info */}
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-blue-600" />
            Informations Personnelles
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Téléphone</span>
              <span className="font-medium">{user.phone || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Genre</span>
              <span className="font-medium">
                {user.gender === 'M' ? 'Masculin' : user.gender === 'F' ? 'Féminin' : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date de naissance</span>
              <span className="font-medium">
                {user.dateOfBirth
                  ? format(new Date(user.dateOfBirth), 'dd MMM yyyy', { locale: fr })
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Créé le</span>
              <span className="font-medium">
                {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: fr })}
              </span>
            </div>
          </div>
        </div>

        {/* Organization */}
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-600" />
            Organisation
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Groupe Scolaire</span>
              <span className="font-medium">{user.schoolGroupName || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">École</span>
              <span className="font-medium">{user.schoolName || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Rôle</span>
              <Badge variant="outline">{getRoleLabel(user.role)}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Profil d'accès</span>
              <Badge variant="secondary">{getProfileLabel(user.accessProfileCode)}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Profile Change */}
      {canManageUser && !isAdminRole && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h4 className="font-medium text-amber-900 mb-3 flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            Changer le profil d'accès
          </h4>
          <div className="flex items-center gap-3">
            <Select
              value={user.accessProfileCode || 'none'}
              onValueChange={onProfileChange}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-64 bg-white">
                <SelectValue placeholder="Sélectionner un profil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun profil</SelectItem>
                {profiles.map((p) => (
                  <SelectItem key={p.code} value={p.code}>
                    {p.name_fr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-amber-600" />}
            <span className="text-sm text-amber-700">
              Les modules seront synchronisés automatiquement
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
