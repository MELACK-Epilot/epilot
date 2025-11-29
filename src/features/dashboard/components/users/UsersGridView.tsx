/**
 * Vue Cartes pour les Utilisateurs - Version SaaS Moderne
 * Affichage en grille avec design premium
 */

import { motion } from 'framer-motion';
import {
  MoreVertical,
  Mail,
  GraduationCap,
  Calendar,
  Shield,
  Edit,
  Trash2,
  Eye,
  Key,
  Briefcase,
  Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '../UserAvatar';
import type { User } from '../../types/dashboard.types';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface UsersGridViewProps {
  users: User[];
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onResetPassword: (user: User) => void;
}

const getRoleConfig = (role: string) => {
  const configs: Record<string, { label: string; color: string; bg: string }> = {
    super_admin: { label: 'Super Admin', color: 'text-purple-700', bg: 'bg-purple-100' },
    admin_groupe: { label: 'Admin Groupe', color: 'text-blue-700', bg: 'bg-blue-100' },
    proviseur: { label: 'Proviseur', color: 'text-indigo-700', bg: 'bg-indigo-100' },
    directeur: { label: 'Directeur', color: 'text-cyan-700', bg: 'bg-cyan-100' },
    directeur_etudes: { label: 'Dir. Études', color: 'text-teal-700', bg: 'bg-teal-100' },
    comptable: { label: 'Comptable', color: 'text-emerald-700', bg: 'bg-emerald-100' },
    secretaire: { label: 'Secrétaire', color: 'text-amber-700', bg: 'bg-amber-100' },
    enseignant: { label: 'Enseignant', color: 'text-orange-700', bg: 'bg-orange-100' },
    surveillant: { label: 'Surveillant', color: 'text-rose-700', bg: 'bg-rose-100' },
    eleve: { label: 'Élève', color: 'text-sky-700', bg: 'bg-sky-100' },
    parent: { label: 'Parent', color: 'text-violet-700', bg: 'bg-violet-100' },
  };
  return configs[role] || { label: role, color: 'text-gray-700', bg: 'bg-gray-100' };
};

const getProfileLabel = (code: string | null | undefined): string => {
  if (!code) return '';
  const labels: Record<string, string> = {
    chef_etablissement: "Chef d'Établissement",
    financier_sans_suppression: 'Financier',
    administratif_basique: 'Administratif',
    enseignant_saisie_notes: 'Enseignant',
    parent_consultation: 'Parent',
    eleve_consultation: 'Élève',
  };
  return labels[code] || code;
};

export const UsersGridView = ({
  users,
  onView,
  onEdit,
  onDelete,
  onResetPassword,
}: UsersGridViewProps) => {
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-200">
        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mb-4">
          <Shield className="w-10 h-10 text-gray-400" />
        </div>
        <p className="text-gray-600 text-lg font-semibold">Aucun utilisateur trouvé</p>
        <p className="text-gray-400 text-sm mt-2">
          Ajustez vos filtres ou créez un nouvel utilisateur
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 auto-rows-fr">
      {users.map((user, index) => {
        const roleConfig = getRoleConfig(user.role);
        const profileLabel = getProfileLabel((user as any).accessProfileCode);

        return (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.03, duration: 0.3 }}
            className="h-full"
          >
            <Card 
              className="group relative overflow-hidden bg-white hover:shadow-2xl transition-all duration-300 cursor-pointer border-0 shadow-md h-full flex flex-col"
              onClick={() => onView(user)}
            >
              {/* Gradient Header */}
              <div className="h-16 bg-gradient-to-r from-[#1D3557] via-[#457B9D] to-[#1D3557] relative">
                {/* Status indicator */}
                <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ring-2 ring-white ${
                  user.status === 'active' ? 'bg-green-400' : 
                  user.status === 'suspended' ? 'bg-red-400' : 'bg-gray-400'
                }`} />
                
                {/* Actions Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 left-2 h-8 w-8 text-white/70 hover:text-white hover:bg-white/20"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onView(user)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Voir détails
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(user)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onResetPassword(user)}>
                      <Key className="w-4 h-4 mr-2" />
                      Réinitialiser MDP
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDelete(user)} className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Avatar - Overlapping header */}
              <div className="flex justify-center -mt-10 relative z-10">
                <div className="ring-4 ring-white rounded-full shadow-lg">
                  <UserAvatar
                    firstName={user.firstName}
                    lastName={user.lastName}
                    avatar={user.avatar}
                    size="xl"
                    status={user.status}
                  />
                </div>
              </div>

              <CardContent className="pt-3 pb-5 px-5 flex-1 flex flex-col">
                {/* Name & Role */}
                <div className="text-center mb-4">
                  <h3 className="font-bold text-lg text-gray-900 truncate">
                    {user.firstName} {user.lastName}
                  </h3>
                  <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                    <Badge className={`${roleConfig.bg} ${roleConfig.color} border-0 font-medium`}>
                      {roleConfig.label}
                    </Badge>
                    {profileLabel && (
                      <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
                        <Briefcase className="w-3 h-3 mr-1" />
                        {profileLabel}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4 flex-1">
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                    <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                  
                  {user.schoolName && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                      <GraduationCap className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="truncate text-xs">{user.schoolName}</span>
                    </div>
                  )}
                </div>

                {/* Footer Stats */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{format(new Date(user.createdAt), 'dd/MM/yy', { locale: fr })}</span>
                  </div>
                  
                  {user.lastLogin ? (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <Clock className="w-3 h-3" />
                      <span>
                        {formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true, locale: fr })}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Jamais connecté</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};
