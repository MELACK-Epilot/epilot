import { useState } from 'react';
import { motion } from 'framer-motion';
import { useClasses } from '../hooks/useClasses';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  BookOpen,
  Users,
  GraduationCap,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  MoreVertical,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';

interface ClassData {
  id: string;
  name: string;
  level: string;
  students: number;
  capacity: number;
  teacher: string;
  room: string;
  schedule: string;
  average: number;
  attendance: number;
  subjects: number;
}

export const ClassesManagementPage = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');

  const { 
    classes = [], 
    isLoading, 
    error,
    stats,
    deleteClass,
    isDeleting
  } = useClasses();

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

  const oldClasses = [
    {
      id: '1',
      name: '6ème A',
      level: '6ème',
      students: 35,
      capacity: 40,
      teacher: 'Dr. Marie Kouam',
      room: 'Salle 101',
      schedule: 'Lun-Ven 8h-16h',
      average: 14.2,
      attendance: 95,
      subjects: 12,
    },
    {
      id: '2',
      name: '6ème B',
      level: '6ème',
      students: 32,
      capacity: 40,
      teacher: 'Jean-Paul Mbarga',
      room: 'Salle 102',
      schedule: 'Lun-Ven 8h-16h',
      average: 13.8,
      attendance: 92,
      subjects: 12,
    },
    {
      id: '3',
      name: '5ème A',
      level: '5ème',
      students: 38,
      capacity: 40,
      teacher: 'Sophie Atangana',
      room: 'Salle 201',
      schedule: 'Lun-Ven 8h-16h',
      average: 13.5,
      attendance: 94,
      subjects: 13,
    },
    {
      id: '4',
      name: '5ème B',
      level: '5ème',
      students: 36,
      capacity: 40,
      teacher: 'Pierre Nkomo',
      room: 'Salle 202',
      schedule: 'Lun-Ven 8h-16h',
      average: 14.0,
      attendance: 93,
      subjects: 13,
    },
    {
      id: '5',
      name: '4ème A',
      level: '4ème',
      students: 34,
      capacity: 40,
      teacher: 'Aminata Diallo',
      room: 'Salle 301',
      schedule: 'Lun-Ven 8h-16h',
      average: 13.2,
      attendance: 91,
      subjects: 14,
    },
    {
      id: '6',
      name: '4ème B',
      level: '4ème',
      students: 30,
      capacity: 40,
      teacher: 'Thomas Biya',
      room: 'Salle 302',
      schedule: 'Lun-Ven 8h-16h',
      average: 13.9,
      attendance: 96,
      subjects: 14,
    },
  ]);

  const levels = [
    { value: 'all', label: 'Tous les niveaux' },
    { value: '6ème', label: '6ème' },
    { value: '5ème', label: '5ème' },
    { value: '4ème', label: '4ème' },
    { value: '3ème', label: '3ème' },
  ];

  const filteredClasses = classes.filter(classData => {
    const matchesSearch = 
      classData.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classData.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classData.room.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || classData.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const totalStudents = classes.reduce((acc, c) => acc + c.students, 0);
  const totalCapacity = classes.reduce((acc, c) => acc + c.capacity, 0);
  const averageAttendance = Math.round(classes.reduce((acc, c) => acc + c.attendance, 0) / classes.length);
  const averageGrade = (classes.reduce((acc, c) => acc + c.average, 0) / classes.length).toFixed(1);

  const handleAction = (action: string, className: string) => {
    toast({
      title: action,
      description: `Action effectuée pour la classe ${className}`,
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
              <BookOpen className="h-8 w-8 text-[#2A9D8F]" />
              Gestion des Classes
            </h1>
            <p className="text-gray-600 mt-1">Gérez toutes les classes de l'établissement</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtrer
            </Button>
            <Button className="bg-gradient-to-r from-[#2A9D8F] to-[#238b7e] hover:from-[#238b7e] hover:to-[#1f7a6f] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle classe
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
              <BookOpen className="h-8 w-8 text-blue-600 mb-3" />
              <div className="text-3xl font-bold text-blue-600">{classes.length}</div>
              <div className="text-sm text-gray-600">Classes Totales</div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <Users className="h-8 w-8 text-green-600 mb-3" />
              <div className="text-3xl font-bold text-green-600">{totalStudents}</div>
              <div className="text-sm text-gray-600">Élèves Inscrits</div>
              <div className="text-xs text-gray-500 mt-1">{totalCapacity} places disponibles</div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <Calendar className="h-8 w-8 text-purple-600 mb-3" />
              <div className="text-3xl font-bold text-purple-600">{averageAttendance}%</div>
              <div className="text-sm text-gray-600">Présence Moyenne</div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <Award className="h-8 w-8 text-orange-600 mb-3" />
              <div className="text-3xl font-bold text-orange-600">{averageGrade}/20</div>
              <div className="text-sm text-gray-600">Moyenne Générale</div>
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
                  placeholder="Rechercher une classe, enseignant ou salle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {levels.map((level) => (
                  <Button
                    key={level.value}
                    variant={selectedLevel === level.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedLevel(level.value)}
                    className={selectedLevel === level.value ? 'bg-[#2A9D8F]' : ''}
                  >
                    {level.label}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Liste des classes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map((classData, index) => {
            const occupancyRate = Math.round((classData.students / classData.capacity) * 100);
            const occupancyColor = 
              occupancyRate >= 90 ? 'text-red-600' :
              occupancyRate >= 75 ? 'text-orange-600' :
              'text-green-600';

            return (
              <motion.div
                key={classData.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <Card className="p-6 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#2A9D8F] to-[#238b7e] rounded-xl flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{classData.name}</h3>
                        <Badge className="bg-blue-100 text-blue-800 mt-1">
                          {classData.level}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleAction('Voir détails', classData.name)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction('Modifier', classData.name)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleAction('Supprimer', classData.name)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Effectif */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Effectif</span>
                      <span className={`text-sm font-bold ${occupancyColor}`}>
                        {occupancyRate}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#2A9D8F]" />
                      <span className="text-lg font-bold text-gray-900">
                        {classData.students}/{classData.capacity}
                      </span>
                      <span className="text-sm text-gray-600">élèves</span>
                    </div>
                  </div>

                  {/* Informations */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <GraduationCap className="h-4 w-4 text-[#2A9D8F]" />
                      <span className="truncate">{classData.teacher}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-[#2A9D8F]" />
                      <span>{classData.room}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4 text-[#2A9D8F]" />
                      <span>{classData.schedule}</span>
                    </div>
                  </div>

                  {/* Statistiques */}
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-lg font-bold text-[#2A9D8F]">{classData.average}</div>
                      <div className="text-xs text-gray-600">Moyenne</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{classData.attendance}%</div>
                      <div className="text-xs text-gray-600">Présence</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">{classData.subjects}</div>
                      <div className="text-xs text-gray-600">Matières</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <Button
                    onClick={() => handleAction('Voir la classe', classData.name)}
                    className="w-full mt-4 bg-gradient-to-r from-[#2A9D8F] to-[#238b7e] hover:from-[#238b7e] hover:to-[#1f7a6f] text-white"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Voir la classe
                  </Button>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {filteredClasses.length === 0 && (
          <Card className="p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucune classe trouvée</h3>
            <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
          </Card>
        )}
      </div>
    </div>
  );
};
