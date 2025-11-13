/**
 * Dashboard Proviseur INSPIRÉ - Version Référence
 * Design inspiré de l'image fournie avec logique modulaire
 * React 19 Best Practices + UX moderne
 * 
 * @module UserDashboardInspired
 */

import { memo, Suspense, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertCircle, 
  Loader2,
  TrendingUp,
  Users,
  BookOpen,
  DollarSign,
  Calendar,
  Bell,
  ArrowRight,
  Activity,
  Clock,
  Award,
  MessageSquare,
  BarChart3,
  GraduationCap,
  FileText,
  Settings,
  Sun,
  MapPin,
  Star,
  Target,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { SchoolWidgets } from '../components/SchoolWidgets';
import { AvailableModules } from '../components/AvailableModules';
import { SchoolAlerts } from '../components/SchoolAlerts';
import { useUserModulesContext, useHasModulesRT } from '@/contexts/UserPermissionsProvider';

/**
 * Composant Loading mémorisé
 */
const LoadingState = memo(() => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <Loader2 className="h-12 w-12 text-[#2A9D8F] animate-spin mx-auto mb-4" />
      <p className="text-gray-600 font-medium">Chargement de votre espace...</p>
    </div>
  </div>
));

LoadingState.displayName = 'LoadingState';

/**
 * Hero Section avec photo d'école (inspiré de l'image)
 */
const HeroSection = memo(({ user }: { user: any }) => {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Bonjour' : currentHour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const currentDate = new Date().toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative h-72 rounded-3xl overflow-hidden shadow-2xl mb-8"
    >
      {/* Image d'arrière-plan avec overlay */}
      <div className="absolute inset-0">
        <div className="w-full h-full bg-gradient-to-r from-[#2A9D8F] via-[#238b7e] to-[#1d7a6f]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/20" />
        
        {/* Motif décoratif */}
        <div className="absolute top-0 right-0 w-96 h-96 opacity-10">
          <div className="w-full h-full bg-white rounded-full -mr-48 -mt-48" />
        </div>
        <div className="absolute bottom-0 left-0 w-64 h-64 opacity-10">
          <div className="w-full h-full bg-white rounded-full -ml-32 -mb-32" />
        </div>
      </div>
      
      {/* Contenu superposé */}
      <div className="relative z-10 p-8 h-full flex items-center">
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-white/90 text-lg mb-2 font-medium">
              {greeting}, {user?.firstName} !
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
              École {user?.school?.name || 'Charles Zackama'}
            </h1>
            <p className="text-white/80 text-lg mb-6">
              {user?.school?.type || 'Sembé Eh École terminale'}
            </p>
            
            {/* Badges informatifs */}
            <div className="flex flex-wrap gap-3">
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm px-4 py-2">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="capitalize">{currentDate}</span>
              </Badge>
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm px-4 py-2">
                <Sun className="h-4 w-4 mr-2" />
                Ensoleillé 28°C
              </Badge>
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm px-4 py-2">
                <MapPin className="h-4 w-4 mr-2" />
                Sembé, Congo
              </Badge>
            </div>
          </motion.div>
        </div>
        
        {/* Icône décorative */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="hidden lg:block"
        >
          <div className="w-32 h-32 bg-white/10 rounded-3xl backdrop-blur-sm flex items-center justify-center">
            <GraduationCap className="h-16 w-16 text-white" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});

HeroSection.displayName = 'HeroSection';

/**
 * Cartes modules colorées (inspiré de l'image)
 */
const ModuleCards = memo(() => {
  const { modules } = useUserModulesContext();

  const moduleConfig = useMemo(() => ({
    finances: { 
      icon: DollarSign, 
      color: 'from-emerald-500 to-emerald-600',
      description: 'Gestion financière'
    },
    classes: { 
      icon: BookOpen, 
      color: 'from-blue-500 to-blue-600',
      description: 'Gestion des classes'
    },
    personnel: { 
      icon: Users, 
      color: 'from-purple-500 to-purple-600',
      description: 'Équipe pédagogique'
    },
    eleves: { 
      icon: GraduationCap, 
      color: 'from-orange-500 to-orange-600',
      description: 'Gestion des élèves'
    },
    rapports: { 
      icon: BarChart3, 
      color: 'from-red-500 to-red-600',
      description: 'Statistiques & rapports'
    },
    inscriptions: { 
      icon: FileText, 
      color: 'from-[#2A9D8F] to-[#238b7e]',
      description: 'Nouvelles inscriptions'
    }
  }), []);

  const assignedModules = useMemo(() => {
    return modules?.filter(module => moduleConfig[module.slug as keyof typeof moduleConfig]) || [];
  }, [modules, moduleConfig]);

  if (!assignedModules.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center py-12"
      >
        <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Settings className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun module assigné</h3>
        <p className="text-gray-600 mb-4">Contactez votre administrateur pour accéder aux modules</p>
        <Button variant="outline">
          Demander l'accès
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Mes Modules</h2>
        <Badge className="bg-[#2A9D8F]/10 text-[#2A9D8F] px-3 py-1">
          {assignedModules.length} assigné{assignedModules.length > 1 ? 's' : ''}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {assignedModules.map((module, index) => {
          const config = moduleConfig[module.slug as keyof typeof moduleConfig];
          const Icon = config.icon;
          
          return (
            <motion.a
              key={module.id}
              href={`/user/${module.slug}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card className={`relative p-6 bg-gradient-to-br ${config.color} text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden group`}>
                {/* Cercle décoratif */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500" />
                
                <div className="relative z-10">
                  <Icon className="h-12 w-12 mb-4 drop-shadow-lg" />
                  <h3 className="font-bold text-lg mb-2">{module.name}</h3>
                  <p className="text-white/80 text-sm mb-4 line-clamp-2">
                    {config.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <Badge className="bg-white/20 text-white border-0 text-xs">
                      Actif
                    </Badge>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Card>
            </motion.a>
          );
        })}
      </div>
    </motion.div>
  );
});

ModuleCards.displayName = 'ModuleCards';

/**
 * KPI Section temps réel (selon modules)
 */
const KPISection = memo(() => {
  const modulePermissions = useHasModulesRT([
    'finances', 
    'classes', 
    'personnel', 
    'eleves'
  ]);

  const kpis = useMemo(() => {
    const availableKPIs = [];

    if (modulePermissions.finances) {
      availableKPIs.push({
        title: 'Revenus mensuels',
        value: '2.4M',
        unit: 'FCFA',
        trend: '+12%',
        color: 'emerald',
        icon: DollarSign
      });
    }

    if (modulePermissions.eleves) {
      availableKPIs.push({
        title: 'Élèves actifs',
        value: '1,247',
        unit: 'élèves',
        trend: '+3%',
        color: 'blue',
        icon: Users
      });
    }

    if (modulePermissions.classes) {
      availableKPIs.push({
        title: 'Classes ouvertes',
        value: '24',
        unit: 'classes',
        trend: '+2',
        color: 'purple',
        icon: BookOpen
      });
    }

    if (modulePermissions.personnel) {
      availableKPIs.push({
        title: 'Personnel actif',
        value: '89',
        unit: 'membres',
        trend: '+5%',
        color: 'orange',
        icon: Award
      });
    }

    // KPI général toujours présent
    availableKPIs.push({
      title: 'Satisfaction',
      value: '4.8',
      unit: '/5',
      trend: '+0.2',
      color: 'green',
      icon: Star
    });

    return availableKPIs;
  }, [modulePermissions]);

  if (kpis.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-[#2A9D8F]" />
          Indicateurs Clés
        </h2>
        <Button variant="ghost" size="sm" className="text-[#2A9D8F]">
          Voir détails
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.05 }}
            >
              <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#2A9D8F]">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-${kpi.color}-100`}>
                    <Icon className={`h-6 w-6 text-${kpi.color}-600`} />
                  </div>
                  <Badge className={`bg-${kpi.color}-100 text-${kpi.color}-700 text-xs`}>
                    {kpi.trend}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">{kpi.title}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">{kpi.value}</span>
                    <span className="text-sm text-gray-500">{kpi.unit}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
});

KPISection.displayName = 'KPISection';

/**
 * Actions recommandées (inspiré "Recommended Packages")
 */
const RecommendedActions = memo(() => {
  const actions = [
    {
      icon: MessageSquare,
      title: 'Répondre aux messages',
      description: '3 nouveaux messages en attente',
      priority: 'high',
      action: 'Consulter'
    },
    {
      icon: Calendar,
      title: 'Planifier réunion équipe',
      description: 'Réunion mensuelle à programmer',
      priority: 'medium',
      action: 'Planifier'
    },
    {
      icon: FileText,
      title: 'Valider les rapports',
      description: '2 rapports en attente de validation',
      priority: 'high',
      action: 'Valider'
    },
    {
      icon: Bell,
      title: 'Traiter les alertes',
      description: '5 alertes système à examiner',
      priority: 'medium',
      action: 'Examiner'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="grid grid-cols-12 gap-6 mb-8"
    >
      {/* Actions recommandées */}
      <div className="col-span-12 lg:col-span-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="h-5 w-5 text-[#2A9D8F]" />
              Actions Recommandées
            </h3>
            <Badge className="bg-[#2A9D8F]/10 text-[#2A9D8F]">
              {actions.length} tâches
            </Badge>
          </div>
          
          <div className="space-y-4">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.05 }}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  <div className={`p-3 rounded-xl ${
                    action.priority === 'high' 
                      ? 'bg-red-100 text-red-600' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 group-hover:text-[#2A9D8F] transition-colors">
                      {action.title}
                    </h4>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                  
                  <Button size="sm" variant="outline" className="group-hover:bg-[#2A9D8F] group-hover:text-white transition-colors">
                    {action.action}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </Card>
      </div>
      
      {/* Activité récente */}
      <div className="col-span-12 lg:col-span-4">
        <Card className="p-6 h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#2A9D8F]" />
              Activité Récente
            </h3>
          </div>
          
          <div className="space-y-4">
            {[
              { text: 'Nouveau message reçu', time: '2 min', color: 'blue' },
              { text: 'Rapport généré', time: '1h', color: 'green' },
              { text: 'Alerte système', time: '3h', color: 'orange' },
              { text: 'Mise à jour profil', time: '1j', color: 'purple' }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.05 }}
                className="flex items-center gap-3"
              >
                <div className={`w-2 h-2 rounded-full bg-${item.color}-500`} />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{item.text}</p>
                  <p className="text-xs text-gray-500">Il y a {item.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>
    </motion.div>
  );
});

RecommendedActions.displayName = 'RecommendedActions';

/**
 * Dashboard Proviseur INSPIRÉ
 */
const InspiredProvisionerDashboard = memo(() => {
  const { data: user } = useCurrentUser();

  return (
    <div className="space-y-0 pb-8">
      {/* Hero Section avec photo d'école */}
      <HeroSection user={user} />
      
      {/* Cartes modules colorées */}
      <ModuleCards />
      
      {/* KPI temps réel */}
      <KPISection />
      
      {/* Actions recommandées */}
      <RecommendedActions />
      
      {/* Alertes critiques */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Suspense fallback={<Skeleton className="h-32 w-full rounded-2xl" />}>
          <SchoolAlerts />
        </Suspense>
      </motion.div>
    </div>
  );
});

InspiredProvisionerDashboard.displayName = 'InspiredProvisionerDashboard';

/**
 * Composant principal UserDashboard INSPIRÉ
 */
export const UserDashboardInspired = () => {
  const { data: user, isLoading, error } = useCurrentUser();

  // État de chargement
  if (isLoading) {
    return <LoadingState />;
  }

  // État d'erreur
  if (error || !user) {
    return (
      <Card className="p-6 max-w-2xl mx-auto mt-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
          <p className="text-gray-600 mb-4">
            Impossible de charger vos informations utilisateur.
          </p>
          <Button onClick={() => window.location.reload()}>
            Réessayer
          </Button>
        </div>
      </Card>
    );
  }

  // Dashboard PROVISEUR/DIRECTEUR
  if (['proviseur', 'directeur', 'directeur_etudes'].includes(user.role)) {
    return <InspiredProvisionerDashboard />;
  }

  // Pour les autres rôles
  return <InspiredProvisionerDashboard />;
};
