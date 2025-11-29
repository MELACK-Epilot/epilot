/**
 * Carte de profil pour la vue grille
 * Composant pure UI
 */

import { motion } from 'framer-motion';
import { UserCog, Check, Users, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ProfileActionsMenu } from './ProfileActionsMenu';
import { 
  getRoleColor, 
  countActiveModules, 
  calculatePowerLevel 
} from '@/features/dashboard/utils/profile-colors.utils';

interface ProfileCardProps {
  profile: {
    id: string;
    code: string;
    name_fr: string;
    description?: string | null;
    permissions?: Record<string, unknown> | null;
  };
  userCount: number;
  moduleCount?: number;
  index: number;
  onEdit: () => void;
  onAssign: () => void;
  onViewUsers: () => void;
  onDelete: () => void;
}

export const ProfileCard = ({
  profile,
  userCount,
  moduleCount = 0,
  index,
  onEdit,
  onAssign,
  onViewUsers,
  onDelete,
}: ProfileCardProps) => {
  const colors = getRoleColor(profile.code);
  // Toujours calculer depuis les permissions JSON (source de vérité)
  const permissionsFromJson = countActiveModules(profile.permissions as Record<string, unknown> | null);
  // Utiliser moduleCount si fourni et > 0, sinon fallback sur JSON
  const permissionsCount = moduleCount > 0 ? moduleCount : permissionsFromJson;
  const powerLevel = calculatePowerLevel(permissionsCount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card 
        className={`h-full flex flex-col relative overflow-hidden border-t-4 ${colors.border} hover:shadow-xl transition-all duration-300 group bg-white cursor-pointer`}
        onClick={onEdit}
      >
        {/* Header */}
        <div className="p-5 pb-0 flex justify-between items-start">
          <div className={`w-12 h-12 rounded-2xl ${colors.icon} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
            <UserCog className={`h-6 w-6 ${colors.text}`} />
          </div>
          
          <ProfileActionsMenu
            onConfigureAccess={onEdit}
            onAssignUsers={onAssign}
            onEditInfo={onEdit}
            onViewUsers={onViewUsers}
            onDelete={onDelete}
          />
        </div>

        {/* Content */}
        <div className="px-5 flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-[#1D3557] transition-colors">
            {profile.name_fr}
          </h3>
          <p className="text-xs font-mono text-gray-400 mb-3 bg-gray-50 inline-block px-2 py-1 rounded">
            {profile.code}
          </p>
          <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem] mb-4">
            {profile.description || "Définit les accès et restrictions pour ce rôle."}
          </p>
        </div>

        {/* Footer */}
        <div className="p-5 pt-0 mt-auto">
          <div className="space-y-3">
            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 font-medium">Niveau d'accès</span>
                <span className={`${colors.text} font-bold`}>{permissionsCount} modules</span>
              </div>
              <Progress value={powerLevel} className="h-1.5 bg-gray-200" indicatorClassName={colors.progress} />
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
              {permissionsCount > 0 ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                  <Check className="h-3 w-3" /> Configuré
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
                  En attente
                </Badge>
              )}
              
              {/* User Count */}
              <div 
                className="ml-auto flex items-center text-xs text-gray-500 gap-1 hover:text-[#1D3557] cursor-pointer transition-colors" 
                title={`${userCount} utilisateurs actifs avec ce rôle`}
                onClick={(e) => {
                  e.stopPropagation();
                  onViewUsers();
                }}
              >
                <Users className="h-3 w-3" />
                <span className="font-medium">{userCount} util.</span>
                <ExternalLink className="h-3 w-3 ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </div>
         
        {/* Hover Effect */}
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#1D3557]/10 rounded-xl pointer-events-none transition-all duration-300" />
      </Card>
    </motion.div>
  );
};
