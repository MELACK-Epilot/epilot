/**
 * Page Élèves pour l'espace Proviseur
 * Gestion des élèves de l'école
 * React 19 Best Practices + Temps Réel
 * 
 * @module StudentsPage
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  UserPlus,
  Search,
  Filter,
  Download,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  BookOpen,
  Calendar,
  TrendingUp,
  Users,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCurrentUser } from '../hooks/useCurrentUser';

/**
 * Interface pour un élève
 */
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  class: string;
  level: string;
  enrollmentDate: string;
  status: 'active' | 'suspended' | 'graduated';
  parentPhone: string;
  averageGrade?: number;
}

/**
 * Carte d'élève
 */
const StudentCard = ({ student }: { student: Student }) => {
  const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();
  
  const statusConfig = {
    active: { label: 'Actif', color: 'bg-green-100 text-green-700' },
    suspended: { label: 'Suspendu', color: 'bg-red-100 text-red-700' },
    graduated: { label: 'Diplômé', color: 'bg-blue-100 text-blue-700' },
  };

  return (
    <Card className="p-6 hover:shadow-xl transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 border-2 border-purple-500">
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {student.firstName} {student.lastName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <BookOpen className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">{student.class}</span>
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
        {/* Statut et niveau */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {student.level}
          </Badge>
          <Badge className={statusConfig[student.status].color}>
            {statusConfig[student.status].label}
          </Badge>
        </div>

        {/* Moyenne */}
        {student.averageGrade && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Moyenne générale</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">
                {student.averageGrade.toFixed(1)}/20
              </span>
              {student.averageGrade >= 10 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
              )}
            </div>
          </div>
        )}

        {/* Contact parent */}
        <div className="text-sm text-gray-600">
          <p className="mb-1">Contact parent :</p>
          <p className="font-medium text-gray-900">{student.parentPhone}</p>
        </div>

        {/* Date d'inscription */}
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>
              Inscrit le {new Date(student.enrollmentDate).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>
      </div>

      <Button 
        className="w-full mt-4 bg-gradient-to-r from-purple-500 to-purple-600"
        size="sm"
      >
        Voir le dossier
      </Button>
    </Card>
  );
};

/**
 * Page Élèves
 */
export const StudentsPage = () => {
  const { data: user } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Données mockées
  const students = useMemo<Student[]>(() => [
    {
      id: '1',
      firstName: 'Alice',
      lastName: 'Dupont',
      class: '6ème A',
      level: 'Collège',
      enrollmentDate: '2023-09-01',
      status: 'active',
      parentPhone: '+237 6 XX XX XX XX',
      averageGrade: 14.5,
    },
    {
      id: '2',
      firstName: 'Bob',
      lastName: 'Martin',
      class: '6ème A',
      level: 'Collège',
      enrollmentDate: '2023-09-01',
      status: 'active',
      parentPhone: '+237 6 XX XX XX XX',
      averageGrade: 12.3,
    },
    {
      id: '3',
      firstName: 'Charlie',
      lastName: 'Bernard',
      class: '5ème A',
      level: 'Collège',
      enrollmentDate: '2022-09-01',
      status: 'active',
      parentPhone: '+237 6 XX XX XX XX',
      averageGrade: 15.8,
    },
    {
      id: '4',
      firstName: 'Diana',
      lastName: 'Dubois',
      class: 'Terminale S',
      level: 'Lycée',
      enrollmentDate: '2020-09-01',
      status: 'active',
      parentPhone: '+237 6 XX XX XX XX',
      averageGrade: 16.2,
    },
    {
      id: '5',
      firstName: 'Ethan',
      lastName: 'Moreau',
      class: '6ème B',
      level: 'Collège',
      enrollmentDate: '2023-09-01',
      status: 'active',
      parentPhone: '+237 6 XX XX XX XX',
      averageGrade: 11.5,
    },
    {
      id: '6',
      firstName: 'Fiona',
      lastName: 'Laurent',
      class: '5ème A',
      level: 'Collège',
      enrollmentDate: '2022-09-01',
      status: 'active',
      parentPhone: '+237 6 XX XX XX XX',
      averageGrade: 13.7,
    },
  ], []);

  // Statistiques
  const stats = useMemo(() => {
    const activeStudents = students.filter(s => s.status === 'active');
    const averageGrade = activeStudents.reduce((sum, s) => sum + (s.averageGrade || 0), 0) / activeStudents.length;
    
    return {
      total: students.length,
      active: activeStudents.length,
      averageGrade: averageGrade.toFixed(1),
      newThisYear: students.filter(s => 
        new Date(s.enrollmentDate).getFullYear() === new Date().getFullYear()
      ).length,
    };
  }, [students]);

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
            <GraduationCap className="h-8 w-8 text-purple-600" />
            Élèves
          </h1>
          <p className="text-gray-600 mt-1">
            Gestion des élèves de {user?.school?.name || 'votre école'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-purple-500 to-purple-600">
            <UserPlus className="h-4 w-4" />
            Nouvel élève
          </Button>
        </div>
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
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total élèves</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
              <Users className="h-6 w-6 text-white" />
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
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Moyenne générale</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageGrade}/20</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Nouveaux 2024</p>
              <p className="text-2xl font-bold text-gray-900">{stats.newThisYear}</p>
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
              placeholder="Rechercher un élève..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Toutes les classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les classes</SelectItem>
              <SelectItem value="6eme">6ème</SelectItem>
              <SelectItem value="5eme">5ème</SelectItem>
              <SelectItem value="terminale">Terminale</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Plus de filtres
          </Button>
        </div>
      </Card>

      {/* Liste des élèves */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {students.map((student, index) => (
          <motion.div
            key={student.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <StudentCard student={student} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};
