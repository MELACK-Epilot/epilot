/**
 * Page Classes pour l'espace Proviseur
 * Gestion des classes de l'école
 * React 19 Best Practices + Temps Réel
 * 
 * @module ClassesPage
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Users,
  UserCheck,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrentUser } from '../hooks/useCurrentUser';

/**
 * Interface pour une classe
 */
interface ClassData {
  id: string;
  name: string;
  level: string;
  students: number;
  capacity: number;
  teacher: string;
  room: string;
  schedule: string;
}

/**
 * Carte de classe
 */
const ClassCard = ({ classData }: { classData: ClassData }) => {
  const occupancyRate = (classData.students / classData.capacity) * 100;
  const isNearCapacity = occupancyRate >= 90;

  return (
    <Card className="p-6 hover:shadow-xl transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg group-hover:scale-110 transition-transform duration-200">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{classData.name}</h3>
            <p className="text-sm text-gray-500">{classData.level}</p>
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
              Voir détails
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
        {/* Effectif */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>Effectif</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">
              {classData.students}/{classData.capacity}
            </span>
            {isNearCapacity && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                Presque pleine
              </Badge>
            )}
          </div>
        </div>

        {/* Barre de progression */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              isNearCapacity 
                ? 'bg-gradient-to-r from-orange-500 to-red-500'
                : 'bg-gradient-to-r from-blue-500 to-blue-600'
            }`}
            style={{ width: `${occupancyRate}%` }}
          />
        </div>

        {/* Enseignant */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <UserCheck className="h-4 w-4" />
            <span>Enseignant</span>
          </div>
          <span className="font-medium text-gray-900">{classData.teacher}</span>
        </div>

        {/* Salle */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Salle</span>
          <Badge variant="outline">{classData.room}</Badge>
        </div>
      </div>

      <Button 
        className="w-full mt-4 bg-gradient-to-r from-[#2A9D8F] to-[#238b7e]"
        size="sm"
      >
        Voir la classe
      </Button>
    </Card>
  );
};

/**
 * Page Classes
 */
export const ClassesPage = () => {
  const { data: user } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');

  // Données mockées
  const classes = useMemo<ClassData[]>(() => [
    {
      id: '1',
      name: '6ème A',
      level: 'Collège',
      students: 35,
      capacity: 40,
      teacher: 'M. Dupont',
      room: 'C-101',
      schedule: 'Lun-Ven 8h-15h',
    },
    {
      id: '2',
      name: '6ème B',
      level: 'Collège',
      students: 38,
      capacity: 40,
      teacher: 'Mme Martin',
      room: 'C-102',
      schedule: 'Lun-Ven 8h-15h',
    },
    {
      id: '3',
      name: '5ème A',
      level: 'Collège',
      students: 32,
      capacity: 40,
      teacher: 'M. Bernard',
      room: 'C-201',
      schedule: 'Lun-Ven 8h-15h',
    },
    {
      id: '4',
      name: 'Terminale S',
      level: 'Lycée',
      students: 28,
      capacity: 35,
      teacher: 'M. Dubois',
      room: 'L-301',
      schedule: 'Lun-Ven 8h-17h',
    },
  ], []);

  // Statistiques
  const stats = useMemo(() => ({
    totalClasses: classes.length,
    totalStudents: classes.reduce((sum, c) => sum + c.students, 0),
    averageOccupancy: Math.round(
      (classes.reduce((sum, c) => sum + (c.students / c.capacity) * 100, 0) / classes.length)
    ),
  }), [classes]);

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
            <BookOpen className="h-8 w-8 text-[#2A9D8F]" />
            Classes
          </h1>
          <p className="text-gray-600 mt-1">
            Gestion des classes de {user?.school?.name || 'votre école'}
          </p>
        </div>
        <Button className="gap-2 bg-gradient-to-r from-[#2A9D8F] to-[#238b7e]">
          <Plus className="h-4 w-4" />
          Nouvelle classe
        </Button>
      </motion.div>

      {/* Statistiques */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total classes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalClasses}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total élèves</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
              <UserCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Taux d'occupation</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageOccupancy}%</p>
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
              placeholder="Rechercher une classe..."
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

      {/* Liste des classes */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {classes.map((classData, index) => (
          <motion.div
            key={classData.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <ClassCard classData={classData} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};
