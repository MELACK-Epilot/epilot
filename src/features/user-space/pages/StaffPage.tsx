/**
 * Page Personnel pour l'espace Proviseur
 * Gestion du personnel de l'école
 * React 19 Best Practices + Temps Réel
 * 
 * @module StaffPage
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Mail,
  Phone,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Award,
  Briefcase,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrentUser } from '../hooks/useCurrentUser';

/**
 * Interface pour un membre du personnel
 */
interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  phone: string;
  department: string;
  status: 'active' | 'inactive' | 'on_leave';
  joinDate: string;
}

/**
 * Carte de membre du personnel
 */
const StaffCard = ({ member }: { member: StaffMember }) => {
  const initials = `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();
  
  const statusConfig = {
    active: { label: 'Actif', color: 'bg-green-100 text-green-700' },
    inactive: { label: 'Inactif', color: 'bg-gray-100 text-gray-700' },
    on_leave: { label: 'En congé', color: 'bg-orange-100 text-orange-700' },
  };

  const roleConfig: Record<string, { icon: any; color: string }> = {
    enseignant: { icon: Award, color: 'from-blue-500 to-blue-600' },
    cpe: { icon: Briefcase, color: 'from-purple-500 to-purple-600' },
    secretaire: { icon: Briefcase, color: 'from-pink-500 to-pink-600' },
    comptable: { icon: Briefcase, color: 'from-green-500 to-green-600' },
  };

  const config = roleConfig[member.role] || { icon: Briefcase, color: 'from-gray-500 to-gray-600' };
  const Icon = config.icon;

  return (
    <Card className="p-6 hover:shadow-xl transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 border-2 border-[#2A9D8F]">
            <AvatarFallback className="bg-gradient-to-br from-[#2A9D8F] to-[#238b7e] text-white font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {member.firstName} {member.lastName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Icon className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600 capitalize">
                {member.role.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Eye className="h-4 w-4 mr-2" />
              Voir profil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-3">
        {/* Département */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {member.department}
          </Badge>
          <Badge className={statusConfig[member.status].color}>
            {statusConfig[member.status].label}
          </Badge>
        </div>

        {/* Contact */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{member.email}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="h-4 w-4 flex-shrink-0" />
            <span>{member.phone}</span>
          </div>
        </div>

        {/* Date d'embauche */}
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Membre depuis {new Date(member.joinDate).toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>

      <Button 
        className="w-full mt-4 bg-gradient-to-r from-[#2A9D8F] to-[#238b7e]"
        size="sm"
      >
        Voir le profil
      </Button>
    </Card>
  );
};

/**
 * Page Personnel
 */
export const StaffPage = () => {
  const { data: user } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState('');

  // Données mockées
  const staff = useMemo<StaffMember[]>(() => [
    {
      id: '1',
      firstName: 'Jean',
      lastName: 'Dupont',
      role: 'enseignant',
      email: 'jean.dupont@ecole.com',
      phone: '+237 6 XX XX XX XX',
      department: 'Mathématiques',
      status: 'active',
      joinDate: '2023-09-01',
    },
    {
      id: '2',
      firstName: 'Marie',
      lastName: 'Martin',
      role: 'cpe',
      email: 'marie.martin@ecole.com',
      phone: '+237 6 XX XX XX XX',
      department: 'Vie scolaire',
      status: 'active',
      joinDate: '2023-09-01',
    },
    {
      id: '3',
      firstName: 'Pierre',
      lastName: 'Bernard',
      role: 'enseignant',
      email: 'pierre.bernard@ecole.com',
      phone: '+237 6 XX XX XX XX',
      department: 'Français',
      status: 'on_leave',
      joinDate: '2022-09-01',
    },
    {
      id: '4',
      firstName: 'Sophie',
      lastName: 'Dubois',
      role: 'secretaire',
      email: 'sophie.dubois@ecole.com',
      phone: '+237 6 XX XX XX XX',
      department: 'Administration',
      status: 'active',
      joinDate: '2023-01-15',
    },
  ], []);

  // Statistiques
  const stats = useMemo(() => {
    const byRole = staff.reduce((acc, member) => {
      acc[member.role] = (acc[member.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: staff.length,
      active: staff.filter(m => m.status === 'active').length,
      byRole,
    };
  }, [staff]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="h-8 w-8 text-[#2A9D8F]" />
            Personnel
          </h1>
          <p className="text-gray-600 mt-1">
            Gestion du personnel de {user?.school?.name || 'votre école'}
          </p>
        </div>
        <Button className="gap-2 bg-gradient-to-r from-[#2A9D8F] to-[#238b7e]">
          <UserPlus className="h-4 w-4" />
          Ajouter un membre
        </Button>
      </motion.div>

      {/* Statistiques */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#2A9D8F] to-[#238b7e] shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Actifs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Enseignants</p>
              <p className="text-2xl font-bold text-gray-900">{stats.byRole.enseignant || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Administratif</p>
              <p className="text-2xl font-bold text-gray-900">
                {(stats.byRole.cpe || 0) + (stats.byRole.secretaire || 0)}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Filtres */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher un membre du personnel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtrer
          </Button>
        </div>
      </Card>

      {/* Liste du personnel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {staff.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <StaffCard member={member} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};
