/**
 * Page de Gestion des Élèves pour le Proviseur
 * Vue complète des élèves par niveau avec statistiques
 * @module StudentsManagement
 */

import { useState, useMemo, useEffect } from 'react';
import { 
  GraduationCap,
  Users, 
  Search, 
  Download,
  TrendingUp,
  RefreshCw,
  Eye,
  BookOpen,
  Award,
  Calendar,
  MapPin
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/features/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

// Types
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  classId?: string;
  className?: string;
  levelId?: string;
  levelName?: string;
  status: string;
  enrollmentDate?: string;
  parentPhone?: string;
  parentEmail?: string;
}

interface LevelStats {
  levelId: string;
  levelName: string;
  levelColor: string;
  studentsCount: number;
  classesCount: number;
  averageAge?: number;
}

// Composant KPI Card
const StatsCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color,
  trend 
}: { 
  title: string; 
  value: number | string; 
  subtitle: string; 
  icon: any; 
  color: string;
  trend?: 'up' | 'down' | 'stable';
}) => (
  <Card className="p-6 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
    <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-10 rounded-full -mr-16 -mt-16`}></div>
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        {trend && (
          <TrendingUp className={`h-4 w-4 ${trend === 'up' ? 'text-green-500' : 'text-gray-400'}`} />
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  </Card>
);

// Composant Badge de niveau
const LevelBadge = ({ levelName, color }: { levelName: string; color?: string }) => {
  const levelColors: Record<string, string> = {
    'Préscolaire': 'bg-blue-100 text-blue-800',
    'Primaire': 'bg-green-100 text-green-800',
    'Collège': 'bg-yellow-100 text-yellow-800',
    'Lycée': 'bg-red-100 text-red-800',
  };

  const badgeColor = levelColors[levelName] || 'bg-gray-100 text-gray-800';
  
  return (
    <Badge className={`${badgeColor} font-medium`}>
      {levelName}
    </Badge>
  );
};

// Composant Principal
export const StudentsManagement = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [levelStats, setLevelStats] = useState<LevelStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  // Charger les élèves et statistiques
  const loadStudents = async () => {
    if (!user?.schoolId) {
      setError('Aucune école associée');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Charger les niveaux scolaires
      const { data: levelsData, error: levelsError } = await supabase
        .from('school_levels')
        .select('id, name, color')
        .eq('school_group_id', user.schoolGroupId || '')
        .eq('status', 'active');

      if (levelsError) throw levelsError;
      
      if (!levelsData || levelsData.length === 0) {
        setError('Aucun niveau scolaire trouvé');
        setIsLoading(false);
        return;
      }

      // Charger les élèves
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name,
          date_of_birth,
          gender,
          status,
          enrollment_date,
          parent_phone,
          parent_email,
          class_id,
          school_level_id,
          classes(
            id,
            name
          ),
          school_levels(
            id,
            name,
            color
          )
        `)
        .eq('school_id', user.schoolId)
        .order('last_name', { ascending: true });

      if (studentsError) throw studentsError;

      // Transformer les données élèves
      const studentsFormatted: Student[] = (studentsData || []).map((student: any) => ({
        id: student.id,
        firstName: student.first_name || '',
        lastName: student.last_name || '',
        dateOfBirth: student.date_of_birth,
        gender: student.gender,
        classId: student.class_id,
        className: student.classes?.name,
        levelId: student.school_level_id,
        levelName: student.school_levels?.name,
        status: student.status,
        enrollmentDate: student.enrollment_date,
        parentPhone: student.parent_phone,
        parentEmail: student.parent_email,
      }));

      setStudents(studentsFormatted);

      // Calculer les stats par niveau
      const stats: LevelStats[] = [];
      for (const level of levelsData) {
        const levelStudents = studentsFormatted.filter(s => s.levelId === level.id && s.status === 'active');
        
        // Compter les classes
        const { count: classesCount } = await supabase
          .from('classes')
          .select('*', { count: 'exact', head: true })
          .eq('school_level_id', level.id)
          .eq('status', 'active');

        stats.push({
          levelId: level.id,
          levelName: level.name,
          levelColor: level.color || 'bg-gray-500',
          studentsCount: levelStudents.length,
          classesCount: classesCount || 0,
        });
      }

      setLevelStats(stats);
    } catch (err: any) {
      console.error('Erreur chargement élèves:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [user?.schoolId]);

  // Statistiques globales
  const globalStats = useMemo(() => {
    const activeStudents = students.filter(s => s.status === 'active');
    const totalClasses = levelStats.reduce((sum, level) => sum + level.classesCount, 0);
    
    return {
      total: students.length,
      active: activeStudents.length,
      totalClasses,
      averagePerClass: totalClasses > 0 ? Math.round(activeStudents.length / totalClasses) : 0,
    };
  }, [students, levelStats]);

  // Filtrer les élèves
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = 
        student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesLevel = selectedLevel === 'all' || student.levelId === selectedLevel;
      
      return matchesSearch && matchesLevel;
    });
  }, [students, searchQuery, selectedLevel]);

  // Export CSV
  const handleExport = () => {
    const csv = [
      ['Nom', 'Prénom', 'Niveau', 'Classe', 'Date Naissance', 'Genre', 'Statut', 'Tél Parent', 'Email Parent'].join(','),
      ...filteredStudents.map(s => [
        s.lastName,
        s.firstName,
        s.levelName || '',
        s.className || '',
        s.dateOfBirth || '',
        s.gender || '',
        s.status,
        s.parentPhone || '',
        s.parentEmail || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eleves-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculer l'âge
  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-blue-50/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center shadow-lg">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Élèves</h1>
              <p className="text-gray-600 mt-1">
                {globalStats.active} élèves actifs • {globalStats.totalClasses} classes
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={loadStudents}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button
              onClick={handleExport}
              className="bg-gradient-to-r from-[#2A9D8F] to-[#238b7e] text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Statistiques Globales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Élèves"
            value={globalStats.total}
            subtitle={`${globalStats.active} actifs`}
            icon={Users}
            color="from-blue-500 to-blue-600"
            trend="up"
          />
          <StatsCard
            title="Classes"
            value={globalStats.totalClasses}
            subtitle="Toutes sections"
            icon={BookOpen}
            color="from-purple-500 to-purple-600"
          />
          <StatsCard
            title="Moyenne/Classe"
            value={globalStats.averagePerClass}
            subtitle="élèves par classe"
            icon={Users}
            color="from-green-500 to-green-600"
          />
          <StatsCard
            title="Niveaux"
            value={levelStats.length}
            subtitle="niveaux scolaires"
            icon={Award}
            color="from-orange-500 to-orange-600"
          />
        </div>

        {/* Statistiques par Niveau */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-gray-600" />
            Répartition par Niveau
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {levelStats.map((level) => (
              <div
                key={level.levelId}
                className="p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all cursor-pointer"
                onClick={() => setSelectedLevel(level.levelId)}
              >
                <div className="flex items-center justify-between mb-2">
                  <LevelBadge levelName={level.levelName} color={level.levelColor} />
                  <span className="text-2xl font-bold text-gray-900">{level.studentsCount}</span>
                </div>
                <p className="text-sm text-gray-600">{level.classesCount} classe(s)</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Alerte si erreur */}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Erreur de chargement</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filtres */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom ou prénom..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Tous les niveaux</option>
                {levelStats.map(level => (
                  <option key={level.levelId} value={level.levelId}>
                    {level.levelName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>{filteredStudents.length} résultat(s)</span>
            {(searchQuery || selectedLevel !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedLevel('all');
                }}
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </Card>

        {/* Liste des élèves */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Élève
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Niveau & Classe
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Âge
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contact Parent
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">Chargement des élèves...</p>
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <GraduationCap className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500">Aucun élève trouvé</p>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {student.firstName[0]}{student.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {student.firstName} {student.lastName}
                            </p>
                            {student.gender && (
                              <p className="text-xs text-gray-500">
                                {student.gender === 'M' ? '♂ Garçon' : '♀ Fille'}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {student.levelName && (
                            <LevelBadge levelName={student.levelName} />
                          )}
                          {student.className && (
                            <p className="text-sm text-gray-600">{student.className}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {student.dateOfBirth ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {calculateAge(student.dateOfBirth)} ans
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1 text-sm text-gray-600">
                          {student.parentPhone && (
                            <div>{student.parentPhone}</div>
                          )}
                          {student.parentEmail && (
                            <div className="text-xs">{student.parentEmail}</div>
                          )}
                          {!student.parentPhone && !student.parentEmail && (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          className={
                            student.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {student.status === 'active' ? 'Actif' : 'Inactif'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
