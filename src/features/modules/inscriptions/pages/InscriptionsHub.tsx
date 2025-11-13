/**
 * Hub Module Inscriptions - VERSION SIMPLE AVEC WELCOME CARD
 * Welcome Card + 2 Boutons (Actualiser, Voir Tout) + KPIs + Activités Récentes
 * SANS onglets, SANS cartes par niveau
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, ChevronRight, Plus, Users, Clock, CheckCircle, XCircle, 
  GraduationCap, RefreshCw, List, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useInscriptions, useInscriptionStats } from '../hooks';
import { InscriptionFormComplet } from '../components/InscriptionFormComplet';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const InscriptionsHub = () => {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  // Hooks React Query
  const { data: inscriptions = [], refetch, isLoading } = useInscriptions();
  const { data: statsData } = useInscriptionStats();

  // Année académique dynamique
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const academicYear = currentMonth >= 0 && currentMonth < 8 
    ? `${currentYear - 1}-${currentYear}` 
    : `${currentYear}-${currentYear + 1}`;

  // Stats globales
  const stats = useMemo(() => ({
    total: statsData?.total || inscriptions.length || 0,
    enAttente: statsData?.enAttente || inscriptions.filter(i => i.status === 'pending').length || 0,
    validees: statsData?.validees || inscriptions.filter(i => i.status === 'validated').length || 0,
    refusees: statsData?.refusees || inscriptions.filter(i => i.status === 'rejected').length || 0,
  }), [statsData, inscriptions]);

  // Inscriptions récentes (10 dernières)
  const recentInscriptions = useMemo(() => 
    inscriptions.slice(0, 10).map(i => ({
      id: i.id,
      studentName: `${i.studentFirstName} ${i.studentLastName}`,
      level: i.requestedLevel,
      status: i.status,
      date: format(new Date(i.submittedAt || i.createdAt), 'dd MMM yyyy', { locale: fr }),
    })),
    [inscriptions]
  );

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      validated: { label: 'Validée', className: 'bg-green-100 text-green-800' },
      rejected: { label: 'Refusée', className: 'bg-red-100 text-red-800' },
      enrolled: { label: 'Inscrit(e)', className: 'bg-blue-100 text-blue-800' },
    };
    const { label, className } = config[status as keyof typeof config] || config.pending;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>{label}</span>;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <motion.nav 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-sm text-gray-600"
      >
        <Home className="w-4 h-4" />
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-400">Modules</span>
        <ChevronRight className="w-4 h-4" />
        <span className="font-medium text-gray-900">Inscriptions</span>
      </motion.nav>

      {/* WELCOME CARD */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="relative overflow-hidden bg-gradient-to-br from-[#1D3557] to-[#0d1f3d] border-0 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
          
          <CardContent className="p-8 relative z-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Texte de bienvenue */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                    <GraduationCap className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">
                      Gestion des Inscriptions
                    </h1>
                    <p className="text-white/70 text-sm mt-1">
                      Année académique {academicYear}
                    </p>
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-col gap-3 min-w-[200px]">
                <Button
                  onClick={() => setIsFormOpen(true)}
                  className="bg-white text-[#1D3557] hover:bg-white/90 gap-2 shadow-lg w-full"
                  size="lg"
                >
                  <Plus className="w-5 h-5" />
                  Nouvelle inscription
                </Button>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => refetch()}
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-2 flex-1"
                    disabled={isLoading}
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Actualiser
                  </Button>
                  
                  <Button
                    onClick={() => navigate('/dashboard/modules/inscriptions/liste')}
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-2 flex-1"
                  >
                    <List className="w-4 h-4" />
                    Voir Tout
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* KPIs - 4 cartes principales */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
              {/* Total */}
              <Card className="relative overflow-hidden bg-gradient-to-br from-[#1D3557] to-[#0d1f3d] border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <p className="text-white/80 text-sm font-medium mb-1">Total Inscriptions</p>
                  <p className="text-3xl font-bold text-white">{stats.total}</p>
                  <p className="text-xs text-white/60 mt-2">Année {academicYear}</p>
                </CardContent>
              </Card>

              {/* En Attente */}
              <Card className="relative overflow-hidden bg-gradient-to-br from-[#E9C46A] to-[#d4a84f] border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-white/80 bg-white/10 px-2 py-1 rounded-full">
                      {stats.total > 0 ? Math.round((stats.enAttente / stats.total) * 100) : 0}%
                    </span>
                  </div>
                  <p className="text-white/80 text-sm font-medium mb-1">En Attente</p>
                  <p className="text-3xl font-bold text-white">{stats.enAttente}</p>
                  <p className="text-xs text-white/60 mt-2">À valider</p>
                </CardContent>
              </Card>

              {/* Validées */}
              <Card className="relative overflow-hidden bg-gradient-to-br from-[#2A9D8F] to-[#1d7a6f] border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-white/80 bg-white/10 px-2 py-1 rounded-full">
                      {stats.total > 0 ? Math.round((stats.validees / stats.total) * 100) : 0}%
                    </span>
                  </div>
                  <p className="text-white/80 text-sm font-medium mb-1">Validées</p>
                  <p className="text-3xl font-bold text-white">{stats.validees}</p>
                  <p className="text-xs text-white/60 mt-2">Confirmées</p>
                </CardContent>
              </Card>

              {/* Refusées */}
              <Card className="relative overflow-hidden bg-gradient-to-br from-[#E63946] to-[#c72030] border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                      <XCircle className="h-6 w-6 text-white" />
                    </div>
                  <span className="text-xs font-semibold text-white/80 bg-white/10 px-2 py-1 rounded-full">
                    {stats.total > 0 ? Math.round((stats.refusees / stats.total) * 100) : 0}%
                  </span>
                </div>
                <p className="text-white/80 text-sm font-medium mb-1">Refusées</p>
                <p className="text-3xl font-bold text-white">{stats.refusees}</p>
                <p className="text-xs text-white/60 mt-2">Non retenues</p>
                </CardContent>
              </Card>
      </motion.div>

      {/* Activités Récentes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-gray-900">
                Activités Récentes
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard/modules/inscriptions/liste')}
                className="gap-2"
              >
                Voir tout
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentInscriptions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Aucune activité récente
                </p>
              ) : (
                recentInscriptions.map((inscription, index) => (
                  <motion.div
                    key={inscription.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    onClick={() => navigate(`/dashboard/modules/inscriptions/${inscription.id}`)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-[#1D3557] rounded-full flex items-center justify-center text-white font-semibold">
                        {inscription.studentName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{inscription.studentName}</p>
                        <p className="text-sm text-gray-500">{inscription.level}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">{inscription.date}</span>
                      {getStatusBadge(inscription.status)}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Formulaire */}
      <InscriptionFormComplet
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        schoolId="current-school-id" // TODO: Get from context
        onSuccess={() => {
          refetch();
          setIsFormOpen(false);
        }}
      />
    </div>
  );
};
