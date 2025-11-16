import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStaff } from '../hooks/useStaff';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Users,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  MapPin,
  Award,
  Calendar,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Download,
  Upload,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  department: string;
  status: 'active' | 'inactive' | 'on-leave';
  joinDate: Date;
  avatar?: string;
}

export const StaffManagementPage = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const { 
    staff = [], 
    isLoading, 
    error,
    stats,
    deleteStaff,
    isDeleting
  } = useStaff();

  const roles = [
    { value: 'all', label: 'Tous les rôles' },
    { value: 'Proviseur', label: 'Proviseur' },
    { value: 'Enseignant', label: 'Enseignant' },
    { value: 'CPE', label: 'CPE' },
    { value: 'Comptable', label: 'Comptable' },
    { value: 'Surveillant', label: 'Surveillant' },
  ];

  const statusOptions = [
    { value: 'all', label: 'Tous les statuts', color: 'bg-gray-100 text-gray-800' },
    { value: 'active', label: 'Actif', color: 'bg-green-100 text-green-800' },
    { value: 'inactive', label: 'Inactif', color: 'bg-red-100 text-red-800' },
    { value: 'on-leave', label: 'En congé', color: 'bg-yellow-100 text-yellow-800' },
  ];

  const getStatusColor = (status: string) => {
    const option = statusOptions.find(s => s.value === status);
    return option?.color || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const option = statusOptions.find(s => s.value === status);
    return option?.label || status;
  };

  // Gestion du chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Gestion des erreurs
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur de chargement</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const filteredStaff = staff.filter(member => {
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
    const matchesSearch = 
      fullName.includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || member.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || member.status === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleAction = (action: string, memberName: string) => {
    toast({
      title: action,
      description: `Action effectuée pour ${memberName}`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="h-8 w-8 text-[#2A9D8F]" />
              Gestion du Personnel
            </h1>
            <p className="text-gray-600 mt-1">Gérez les membres du personnel de l'école</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button className="bg-gradient-to-r from-[#2A9D8F] to-[#238b7e] hover:from-[#238b7e] hover:to-[#1f7a6f] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un membre
            </Button>
          </div>
        </motion.div>

        {/* Statistiques */}
        <div className="grid grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <Users className="h-8 w-8 text-blue-600 mb-3" />
              <div className="text-3xl font-bold text-blue-600">{stats?.total || 0}</div>
              <div className="text-sm text-gray-600">Total Personnel</div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <UserCheck className="h-8 w-8 text-green-600 mb-3" />
              <div className="text-3xl font-bold text-green-600">
                {stats?.active || 0}
              </div>
              <div className="text-sm text-gray-600">Actifs</div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <Calendar className="h-8 w-8 text-yellow-600 mb-3" />
              <div className="text-3xl font-bold text-yellow-600">
                {stats?.onLeave || 0}
              </div>
              <div className="text-sm text-gray-600">En congé</div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <Award className="h-8 w-8 text-purple-600 mb-3" />
              <div className="text-3xl font-bold text-purple-600">
                {stats?.byRole?.enseignant || 0}
              </div>
              <div className="text-sm text-gray-600">Enseignants</div>
            </Card>
          </motion.div>
        </div>

        {/* Filtres */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un membre du personnel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {roles.map((role) => (
                  <Button
                    key={role.value}
                    variant={selectedRole === role.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedRole(role.value)}
                    className={selectedRole === role.value ? 'bg-[#2A9D8F]' : ''}
                  >
                    {role.label}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                {statusOptions.map((status) => (
                  <Badge
                    key={status.value}
                    className={`cursor-pointer px-3 py-1 ${
                      selectedStatus === status.value
                        ? 'bg-[#2A9D8F] text-white border-[#2A9D8F]'
                        : status.color
                    }`}
                    onClick={() => setSelectedStatus(status.value)}
                  >
                    {status.label}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Liste du personnel */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#2A9D8F] to-[#238b7e] rounded-full flex items-center justify-center">
                      {member.avatar ? (
                        <img src={member.avatar} alt={`${member.first_name} ${member.last_name}`} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-white font-bold text-lg">
                          {member.first_name[0]}{member.last_name[0]}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{member.first_name} {member.last_name}</h3>
                      <p className="text-sm text-gray-600">{member.role}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleAction('Modifier', member.name)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction('Contacter', member.name)}>
                        <Mail className="h-4 w-4 mr-2" />
                        Contacter
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          if (confirm(`Êtes-vous sûr de vouloir supprimer ${member.first_name} ${member.last_name} ?`)) {
                            deleteStaff(member.id);
                          }
                        }}
                        className="text-red-600"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4 text-[#2A9D8F]" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4 text-[#2A9D8F]" />
                    <span>{member.phone}</span>
                  </div>
                  {member.school_id && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-[#2A9D8F]" />
                      <span>École assignée</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4 text-[#2A9D8F]" />
                    <span>Depuis {new Date(member.created_at).getFullYear()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <Badge className={getStatusColor(member.status)}>
                    {getStatusLabel(member.status)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAction('Voir le profil', member.name)}
                    className="text-[#2A9D8F] hover:bg-[#2A9D8F]/10"
                  >
                    Voir profil
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <Card className="p-12 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucun membre trouvé</h3>
            <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
          </Card>
        )}
      </div>
    </div>
  );
};
