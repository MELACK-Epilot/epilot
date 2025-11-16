/**
 * Page Établissement - Informations Groupe Scolaire et Écoles
 * Design moderne avec glassmorphisme
 * @module EstablishmentPage
 */

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
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
  Eye,
  MessageSquare,
  FileText,
  Calendar,
  ClipboardList,
  Share2,
  X
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useSchoolGroup } from '../hooks/useSchoolGroup';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Import des composants refactorisés
import { StatsCard } from '../components/StatsCard';
import { SchoolCard as SchoolCardComponent } from '../components/SchoolCard';

// Import des modals
import { ContactAdminModal } from '../components/modals/ContactAdminModal';
import { ContactSchoolsModal } from '../components/modals/ContactSchoolsModal';
import { ShareFilesModal } from '../components/modals/ShareFilesModal';
import { ResourceRequestModal } from '../components/modals/ResourceRequestModal';
import { useNavigate } from 'react-router-dom';

// Import du Hub Documentaire
import { DocumentHub } from '@/features/document-hub';

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
  logo_url?: string;
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
            logo_url: school.logo_url,
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
 * Composant Principal
 */
export const EstablishmentPage = memo(() => {
  const { toast } = useToast();
  const { data: schoolGroup, isLoading: groupLoading, error: groupError } = useSchoolGroup();
  const { data: schools, isLoading: schoolsLoading } = useSchools(schoolGroup?.id);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();
  
  // États pour les modals
  const [isContactAdminModalOpen, setIsContactAdminModalOpen] = useState(false);
  const [isContactSchoolsModalOpen, setIsContactSchoolsModalOpen] = useState(false);
  const [isShareFilesModalOpen, setIsShareFilesModalOpen] = useState(false);
  const [showDocumentHub, setShowDocumentHub] = useState(false);
  const [isResourceRequestModalOpen, setIsResourceRequestModalOpen] = useState(false);

  // Filtrer les écoles
  const filteredSchools = schools?.filter(school =>
    school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    school.address?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Calculer les statistiques globales
  const totalStudents = schools?.reduce((sum, school) => sum + school.students_count, 0) || 0;
  const totalTeachers = schools?.reduce((sum, school) => sum + school.teachers_count, 0) || 0;
  const totalClasses = schools?.reduce((sum, school) => sum + school.classes_count, 0) || 0;

  // Handlers pour les actions
  const handleContactAdmin = () => {
    setIsContactAdminModalOpen(true);
  };

  const handleNeedsStatement = () => {
    setIsResourceRequestModalOpen(true);
  };

  const handleSchoolNetwork = () => {
    setIsContactSchoolsModalOpen(true);
  };

  const handleMeetingRequest = () => {
    toast({
      title: "Demande de Réunion",
      description: "Fonctionnalité de planification de réunion disponible prochainement.",
    });
  };

  const handleBestPractices = () => {
    setIsShareFilesModalOpen(true);
  };

  // Navigation vers les pages
  const handleViewStaff = () => {
    navigate('/user/staff-management');
  };

  const handleViewReports = () => {
    navigate('/user/reports-management');
  };

  const handleViewClasses = () => {
    navigate('/user/modules/classes');
  };

  const handleViewStats = () => {
    navigate('/user/advanced-stats');
  };

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

        {/* Section Actions et Communication */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#2A9D8F]/10 to-[#1D3557]/10 rounded-2xl blur-xl" />
          <Card className="relative p-6 bg-white/90 backdrop-blur-xl border-white/60 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-[#2A9D8F] to-[#238b7e] rounded-xl flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Actions et Communication
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Contacter l'Admin Groupe */}
              <button 
                onClick={handleContactAdmin}
                aria-label="Contacter l'administrateur du groupe scolaire"
                className="group relative p-6 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-2xl border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 text-left hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-blue-500 group-hover:scale-110 transition-transform">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                      Contacter l'Admin Groupe
                      <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </h3>
                    <p className="text-sm text-gray-600">
                      Envoyer un message ou une demande à l'administrateur du groupe
                    </p>
                  </div>
                </div>
              </button>

              {/* État des Besoins */}
              <button 
                onClick={handleNeedsStatement}
                aria-label="Créer et soumettre l'état des besoins de l'établissement"
                className="group relative p-6 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-2xl border-2 border-purple-200 hover:border-purple-400 transition-all duration-300 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-purple-500 group-hover:scale-110 transition-transform">
                    <ClipboardList className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                      État des Besoins
                      <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                    </h3>
                    <p className="text-sm text-gray-600">
                      Monter et soumettre l'état des besoins de votre établissement
                    </p>
                  </div>
                </div>
              </button>

              {/* Hub Documentaire */}
              <button 
                onClick={() => setShowDocumentHub(true)}
                aria-label="Accéder au hub documentaire du groupe scolaire"
                className="group relative p-6 bg-gradient-to-br from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-200 rounded-2xl border-2 border-cyan-200 hover:border-cyan-400 transition-all duration-300 text-left hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-cyan-500 group-hover:scale-110 transition-transform">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                      Hub Documentaire
                      <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-cyan-600 group-hover:translate-x-1 transition-all" />
                    </h3>
                    <p className="text-sm text-gray-600">
                      Partager et consulter les documents du groupe
                    </p>
                  </div>
                </div>
              </button>

              {/* Communiquer avec Autres Écoles */}
              <button 
                onClick={handleSchoolNetwork}
                aria-label="Accéder au réseau des écoles et échanger avec les collègues"
                className="group relative p-6 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-2xl border-2 border-orange-200 hover:border-orange-400 transition-all duration-300 text-left hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-orange-500 group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                      Réseau des Écoles
                      <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                    </h3>
                    <p className="text-sm text-gray-600">
                      Échanger avec les autres établissements du groupe
                    </p>
                  </div>
                </div>
              </button>

              {/* Demande de Réunion */}
              <button 
                onClick={handleMeetingRequest}
                aria-label="Planifier une réunion avec l'admin ou d'autres directeurs"
                className="group relative p-6 bg-gradient-to-br from-pink-50 to-pink-100 hover:from-pink-100 hover:to-pink-200 rounded-2xl border-2 border-pink-200 hover:border-pink-400 transition-all duration-300 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-pink-500 group-hover:scale-110 transition-transform">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                      Demande de Réunion
                      <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-pink-600 group-hover:translate-x-1 transition-all" />
                    </h3>
                    <p className="text-sm text-gray-600">
                      Planifier une réunion avec l'admin ou d'autres directeurs
                    </p>
                  </div>
                </div>
              </button>

              {/* Partage de Bonnes Pratiques */}
              <button 
                onClick={handleBestPractices}
                aria-label="Consulter et partager les bonnes pratiques du réseau"
                className="group relative p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 rounded-2xl border-2 border-indigo-200 hover:border-indigo-400 transition-all duration-300 text-left hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-indigo-500 group-hover:scale-110 transition-transform">
                    <Share2 className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                      Bonnes Pratiques
                      <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </h3>
                    <p className="text-sm text-gray-600">
                      Partager et consulter les bonnes pratiques du réseau
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Note informative */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-900 font-medium mb-1">
                  Communication avec le Groupe Scolaire
                </p>
                <p className="text-xs text-blue-700">
                  Ces actions vous permettent de communiquer efficacement avec l'administration du groupe et de collaborer avec les autres établissements du réseau.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Section Écoles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2].map(i => <Skeleton key={i} className="h-64 w-full" />)}
              </div>
            ) : filteredSchools.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredSchools.map(school => (
                  <SchoolCardComponent key={school.id} school={school} />
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

      {/* Modals */}
      <ContactAdminModal
        isOpen={isContactAdminModalOpen}
        onClose={() => setIsContactAdminModalOpen(false)}
        groupName={schoolGroup?.name || 'Groupe Scolaire'}
        schoolGroupId={schoolGroup?.id || ''}
      />

      <ContactSchoolsModal
        isOpen={isContactSchoolsModalOpen}
        onClose={() => setIsContactSchoolsModalOpen(false)}
        schoolGroupId={schoolGroup?.id || ''}
      />

      <ShareFilesModal
        isOpen={isShareFilesModalOpen}
        onClose={() => setIsShareFilesModalOpen(false)}
        schoolName={schoolGroup?.name || 'Groupe Scolaire'}
        schoolId={schoolGroup?.id || ''}
      />

      <ResourceRequestModal
        isOpen={isResourceRequestModalOpen}
        onClose={() => setIsResourceRequestModalOpen(false)}
        schoolName={schoolGroup?.name || 'Groupe Scolaire'}
        schoolId={schoolGroup?.id || ''}
      />

      {/* Hub Documentaire - Modal Full Screen */}
      {showDocumentHub && schoolGroup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowDocumentHub(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-4 md:inset-8 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header du Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Hub Documentaire</h2>
                  <p className="text-sm text-gray-600">{schoolGroup.name}</p>
                </div>
              </div>
              <Button
                onClick={() => setShowDocumentHub(false)}
                variant="ghost"
                size="sm"
                className="gap-2 hover:bg-white/50"
              >
                <X className="h-4 w-4" />
                Fermer
              </Button>
            </div>

            {/* Contenu du Hub */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <DocumentHub
                schoolGroupId={schoolGroup.id}
                currentUserId={schoolGroup.id} // TODO: Get actual user ID
                schools={schools || []}
                userRole="admin_groupe" // TODO: Get actual user role
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
});

EstablishmentPage.displayName = 'EstablishmentPage';
