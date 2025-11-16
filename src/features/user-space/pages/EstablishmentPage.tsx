/**
 * Page Établissement - Informations Groupe Scolaire et Écoles
 * Design moderne avec glassmorphisme
 * @module EstablishmentPage
 */

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Users, 
  School, 
  Crown, 
  Phone, 
  Mail, 
  Globe, 
  MapPin,
  ExternalLink,
  Info,
  TrendingUp,
  GraduationCap,
  BookOpen,
  Award,
  Search,
  Eye
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useSchoolGroup } from '../hooks/useSchoolGroup';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Interface pour les écoles
 */
interface SchoolData {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  status: string;
  students_count: number;
  teachers_count: number;
  classes_count: number;
  created_at: string;
}

/**
 * Hook pour récupérer les écoles du groupe
 */
const useSchools = (schoolGroupId?: string) => {
  return useQuery({
    queryKey: ['schools', schoolGroupId],
    queryFn: async () => {
      if (!schoolGroupId) throw new Error('Pas de groupe scolaire');

      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('school_group_id', schoolGroupId)
        .order('name', { ascending: true });

      if (error) throw error;

      // Enrichir avec les statistiques
      const enrichedSchools = await Promise.all(
        (data || []).map(async (school: any) => {
          // Compter les élèves
          const { count: studentsCount } = await supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .eq('school_id', school.id)
            .eq('role', 'eleve')
            .eq('status', 'active');

          // Compter les enseignants
          const { count: teachersCount } = await supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .eq('school_id', school.id)
            .eq('role', 'enseignant')
            .eq('status', 'active');

          // Compter les classes
          const { count: classesCount } = await supabase
            .from('classes')
            .select('id', { count: 'exact', head: true })
            .eq('school_id', school.id)
            .eq('status', 'active');

          return {
            id: school.id,
            name: school.name,
            address: school.address,
            phone: school.phone,
            email: school.email,
            status: school.status,
            students_count: studentsCount || 0,
            teachers_count: teachersCount || 0,
            classes_count: classesCount || 0,
            created_at: school.created_at,
          } as SchoolData;
        })
      );

      return enrichedSchools;
    },
    enabled: !!schoolGroupId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Composant KPI Card
 */
const StatsCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color,
  delay = 0
}: { 
  title: string; 
  value: number | string; 
  subtitle: string; 
  icon: any; 
  color: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: 'spring', stiffness: 100 }}
    whileHover={{ scale: 1.02, y: -4 }}
    className="relative group"
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${color}/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300`} />
    <Card className="relative p-6 bg-white/90 backdrop-blur-xl border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden">
      <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${color}/10 rounded-full group-hover:scale-150 transition-transform duration-500`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </Card>
  </motion.div>
);

/**
 * Composant École Card
 */
const SchoolCard = ({ school }: { school: SchoolData }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.01 }}
    className="relative group"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-[#2A9D8F]/10 to-[#1D3557]/10 rounded-2xl blur-xl" />
    <Card className="relative p-6 bg-white/90 backdrop-blur-xl border-white/60 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#2A9D8F] to-[#238b7e] rounded-xl flex items-center justify-center shadow-lg">
            <School className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{school.name}</h3>
            <Badge className={school.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
              {school.status === 'active' ? 'Actif' : 'Inactif'}
            </Badge>
          </div>
        </div>
        
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </div>

      {/* Statistiques de l'école */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <GraduationCap className="h-5 w-5 text-blue-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-blue-600">{school.students_count}</div>
          <div className="text-xs text-gray-600">Élèves</div>
        </div>
        
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <Users className="h-5 w-5 text-purple-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-purple-600">{school.teachers_count}</div>
          <div className="text-xs text-gray-600">Enseignants</div>
        </div>
        
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <BookOpen className="h-5 w-5 text-orange-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-orange-600">{school.classes_count}</div>
          <div className="text-xs text-gray-600">Classes</div>
        </div>
      </div>

      {/* Informations de contact */}
      <div className="space-y-2 text-sm text-gray-600">
        {school.address && (
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{school.address}</span>
          </div>
        )}
        {school.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{school.phone}</span>
          </div>
        )}
        {school.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{school.email}</span>
          </div>
        )}
      </div>
    </Card>
  </motion.div>
);

/**
 * Composant Principal
 */
export const EstablishmentPage = memo(() => {
  const { data: schoolGroup, isLoading: groupLoading, error: groupError } = useSchoolGroup();
  const { data: schools, isLoading: schoolsLoading } = useSchools(schoolGroup?.id);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrer les écoles
  const filteredSchools = schools?.filter(school =>
    school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    school.address?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Calculer les statistiques globales
  const totalStudents = schools?.reduce((sum, school) => sum + school.students_count, 0) || 0;
  const totalTeachers = schools?.reduce((sum, school) => sum + school.teachers_count, 0) || 0;
  const totalClasses = schools?.reduce((sum, school) => sum + school.classes_count, 0) || 0;

  if (groupLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-[#E8F4F8] to-[#D4E9F7] p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  if (groupError || !schoolGroup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-[#E8F4F8] to-[#D4E9F7] p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="p-12">
            <div className="text-center">
              <Info className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Groupe scolaire non disponible
              </h3>
              <p className="text-gray-600">
                Impossible de charger les informations de votre établissement.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-[#E8F4F8] to-[#D4E9F7] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header avec Glassmorphisme */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#2A9D8F]/20 to-[#1D3557]/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-300" />
          
          <div className="relative bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-[#2A9D8F]/10 to-transparent rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-[#1D3557]/10 to-transparent rounded-full blur-2xl" />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#2A9D8F] to-[#238b7e] rounded-2xl flex items-center justify-center shadow-lg">
                  {schoolGroup.logo ? (
                    <img 
                      src={schoolGroup.logo} 
                      alt={schoolGroup.name}
                      className="w-12 h-12 object-contain rounded-lg"
                    />
                  ) : (
                    <Building2 className="h-8 w-8 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{schoolGroup.name}</h1>
                  <p className="text-gray-600 mt-1">
                    Groupe scolaire • Membre depuis {new Date(schoolGroup.created_at).getFullYear()}
                  </p>
                </div>
              </div>
              
              <Badge className="bg-gradient-to-r from-[#2A9D8F] to-[#238b7e] text-white border-0 px-4 py-2 text-sm">
                <Crown className="h-4 w-4 mr-2" />
                {schoolGroup.plan_name}
              </Badge>
            </div>

            {/* Description */}
            {schoolGroup.description && (
              <p className="text-gray-600 mt-6 leading-relaxed">
                {schoolGroup.description}
              </p>
            )}

            {/* Informations de contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {schoolGroup.address && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4 flex-shrink-0 text-[#2A9D8F]" />
                  <span className="text-sm truncate">{schoolGroup.address}</span>
                </div>
              )}
              {schoolGroup.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4 flex-shrink-0 text-[#2A9D8F]" />
                  <span className="text-sm">{schoolGroup.phone}</span>
                </div>
              )}
              {schoolGroup.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4 flex-shrink-0 text-[#2A9D8F]" />
                  <span className="text-sm truncate">{schoolGroup.email}</span>
                </div>
              )}
              {schoolGroup.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 flex-shrink-0 text-[#2A9D8F]" />
                  <a 
                    href={schoolGroup.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#2A9D8F] hover:underline flex items-center gap-1 truncate"
                  >
                    {schoolGroup.website.replace(/^https?:\/\//, '')}
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Statistiques Globales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Écoles"
            value={schoolGroup.total_schools}
            subtitle={`${schoolGroup.total_schools} établissement${schoolGroup.total_schools > 1 ? 's' : ''}`}
            icon={School}
            color="from-blue-500 to-blue-600"
            delay={0.1}
          />
          <StatsCard
            title="Élèves"
            value={totalStudents}
            subtitle="Total dans le groupe"
            icon={GraduationCap}
            color="from-green-500 to-green-600"
            delay={0.2}
          />
          <StatsCard
            title="Enseignants"
            value={totalTeachers}
            subtitle="Corps enseignant"
            icon={Award}
            color="from-purple-500 to-purple-600"
            delay={0.3}
          />
          <StatsCard
            title="Classes"
            value={totalClasses}
            subtitle="Toutes les classes"
            icon={BookOpen}
            color="from-orange-500 to-orange-600"
            delay={0.4}
          />
        </div>

        {/* Section Écoles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#2A9D8F]/10 to-[#1D3557]/10 rounded-2xl blur-xl" />
          <Card className="relative p-6 bg-white/90 backdrop-blur-xl border-white/60 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <School className="h-6 w-6 text-[#2A9D8F]" />
                Nos Écoles ({filteredSchools.length})
              </h2>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Rechercher une école..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>

            {schoolsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full" />)}
              </div>
            ) : filteredSchools.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSchools.map(school => (
                  <SchoolCard key={school.id} school={school} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <School className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 text-lg mb-2">Aucune école trouvée</h3>
                <p className="text-gray-600">
                  {searchQuery 
                    ? "Aucune école ne correspond à votre recherche"
                    : "Aucune école enregistrée dans ce groupe scolaire"
                  }
                </p>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
});

EstablishmentPage.displayName = 'EstablishmentPage';
