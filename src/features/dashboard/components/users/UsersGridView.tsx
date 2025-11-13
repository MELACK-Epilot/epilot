/**
 * Vue Cartes pour les Utilisateurs
 * Affichage moderne en grille avec avatars et actions
 */

import { motion } from 'framer-motion';
import {
  MoreVertical,
  Mail,
  Phone,
  Building2,
  Calendar,
  Shield,
  Edit,
  Trash2,
  Eye,
  Key,
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
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getStatusBadgeClass, getRoleBadgeClass } from '@/lib/colors';

interface UsersGridViewProps {
  users: User[];
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onResetPassword: (user: User) => void;
}

export const UsersGridView = ({
  users,
  onView,
  onEdit,
  onDelete,
  onResetPassword,
}: UsersGridViewProps) => {
  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Shield className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg font-medium">Aucun utilisateur trouvé</p>
          <p className="text-gray-400 text-sm mt-2">
            Ajustez vos filtres ou créez un nouvel utilisateur
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {users.map((user, index) => (
        <motion.div
          key={user.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden">
            {/* Barre de statut colorée en haut */}
            <div
              className={`h-1 ${
                user.status === 'active'
                  ? 'bg-green-500'
                  : user.status === 'suspended'
                  ? 'bg-red-500'
                  : 'bg-gray-400'
              }`}
            />

            <CardContent className="p-6">
              {/* Header avec Avatar et Actions */}
              <div className="flex items-start justify-between mb-4">
                <UserAvatar
                  firstName={user.firstName}
                  lastName={user.lastName}
                  avatar={user.avatar}
                  size="xl"
                  status={user.status}
                />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
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
                      Réinitialiser mot de passe
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(user)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Nom et Rôle */}
              <div className="mb-4">
                <h3 className="font-bold text-lg text-gray-900 mb-1">
                  {user.firstName} {user.lastName}
                </h3>
                <Badge className={getRoleBadgeClass(user.role)}>
                  {user.role === 'super_admin'
                    ? 'Super Admin'
                    : user.role === 'admin_groupe'
                    ? 'Admin Groupe'
                    : user.role === 'admin_ecole'
                    ? 'Admin École'
                    : user.role}
                </Badge>
              </div>

              {/* Informations de Contact */}
              <div className="space-y-2 mb-4">
                {user.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{user.email}</span>
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{user.phone}</span>
                  </div>
                )}
                {user.schoolGroupName && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{user.schoolGroupName}</span>
                  </div>
                )}
              </div>

              {/* Footer avec Statut et Date */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <Badge className={getStatusBadgeClass(user.status)}>
                  {user.status === 'active'
                    ? 'Actif'
                    : user.status === 'inactive'
                    ? 'Inactif'
                    : 'Suspendu'}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: fr })}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
