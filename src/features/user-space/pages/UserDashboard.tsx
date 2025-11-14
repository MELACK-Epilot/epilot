/**
 * Dashboard Proviseur INSPIRÉ - Version Référence
 * Design inspiré de l'image fournie avec logique modulaire
 * React 19 Best Practices + UX moderne
 * 
 * @module UserDashboard
 */

import { memo, Suspense, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertCircle, 
  Loader2,
  Calendar,
  Bell,
  Clock,
  Award,
  MessageSquare,
  GraduationCap,
  FileText,
  Sun,
  MapPin,
  Target,
  DollarSign,
  BookOpen,
  Users,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { SchoolAlerts } from '../components/SchoolAlerts';
import { AvailableModules } from '../components/AvailableModules';
import { useUserModulesContext } from '@/contexts/UserPermissionsProvider';
import { getKPIsForRole } from '../utils/rolePermissions';
import { EmptyModulesState } from '../components/EmptyModulesState';
import { NiveauxDetailsModal } from '../components/NiveauxDetailsModal';
import { DirectorDashboardOptimized } from './DirectorDashboardOptimized';

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
 * Composant Error mémorisé
 */
const ErrorState = memo(({ error }: { error: Error | null }) => (
  <Card className="p-6 max-w-2xl mx-auto mt-8">
    <div className="text-center">
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
      <p className="text-gray-600 mb-4">
        Impossible de charger vos informations utilisateur.
      </p>
      {error && (
        <details className="text-left">
          <summary className="cursor-pointer text-sm text-gray-500 mb-2">
            Détails techniques
          </summary>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
            {error.message}
          </pre>
        </details>
      )}
      <Button onClick={() => window.location.reload()} className="mt-4">
        Réessayer
      </Button>
    </div>
  </Card>
));

ErrorState.displayName = 'ErrorState';

/**
 * Hero Section avec photo d'école réelle (inspiré de l'image)
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
      className="relative min-h-[500px] rounded-3xl overflow-hidden shadow-2xl mb-8"
    >
      {/* Photo d'école réelle en arrière-plan */}
      <div className="absolute inset-0">
        <img 
          src="/images/backgrounds/bk.webp" 
          alt="École" 
          className="w-full h-full object-cover"
        />
        {/* Overlay gradient pour lisibilité du texte */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/65 to-black/85" />
        
        {/* Motif décoratif subtil */}
        <div className="absolute top-0 right-0 w-96 h-96 opacity-5">
          <div className="w-full h-full bg-white rounded-full -mr-48 -mt-48" />
        </div>
        <div className="absolute bottom-0 left-0 w-64 h-64 opacity-5">
          <div className="w-full h-full bg-white rounded-full -ml-32 -mb-32" />
        </div>
      </div>
      
      {/* Contenu superposé */}
      <div className="relative z-10 p-8 h-full flex flex-col justify-between">
        {/* Section supérieure - Info école */}
        <div className="flex items-start justify-between">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-white/90 text-lg mb-2 font-medium">
              {greeting}, {user?.firstName} !
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">
              École Charles Zackama
            </h1>
            <p className="text-white/80 text-lg mb-4">
              Sembé Eh École terminale
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
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm px-4 py-2">
                <Award className="h-3 w-3 mr-1" />
                {user?.role === 'proviseur' ? 'Proviseur' : 
                 user?.role === 'directeur' ? 'Directeur' : 
                 user?.role === 'directeur_etudes' ? 'Directeur des Études' :
                 user?.role?.replace('_', ' ')}
              </Badge>
            </div>
          </motion.div>
          
          {/* Icône décorative */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="hidden lg:block"
          >
            <div className="w-24 h-24 bg-white/10 rounded-3xl backdrop-blur-sm flex items-center justify-center">
              <GraduationCap className="h-16 w-16 text-white" />
            </div>
          </motion.div>
        </div>

        {/* Section inférieure - KPI intégrés */}
        <div className="mt-8">
          <KPISectionInHero user={user} />
        </div>
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
      color: 'from-[#2A9D8F] to-[#238b7e]',  // Vert Cité Positive
      description: 'Gestion financière et comptabilité'
    },
    classes: { 
      icon: BookOpen, 
      color: 'from-[#1D3557] to-[#152942]',  // Bleu Foncé Institutionnel
      description: 'Gestion des classes et emplois du temps'
    },
    personnel: { 
      icon: Users, 
      color: 'from-[#E9C46A] to-[#d4b05e]',  // Or Républicain
      description: 'Gestion du personnel et RH'
    },
    eleves: { 
      icon: GraduationCap, 
      color: 'from-orange-500 to-orange-600',
      description: 'Gestion des élèves'
    },
    rapports: { 
      icon: BarChart3, 
      color: 'from-[#E63946] to-[#d32f3b]',  // Rouge Sobre
      description: 'Rapports et statistiques'
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
    return <EmptyModulesState onRequestAccess={() => {
      // TODO: Implémenter la demande d'accès (email, notification, etc.)
      console.log('Demande d\'accès aux modules');
    }} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mes Modules</h2>
          <p className="text-sm text-gray-600 mt-1">Accédez rapidement à vos outils</p>
        </div>
        <Button variant="outline" size="sm" className="border-[#2A9D8F] text-[#2A9D8F] hover:bg-[#2A9D8F] hover:text-white">
          Voir tous
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {assignedModules.map((module, index) => {
          const config = moduleConfig[module.slug as keyof typeof moduleConfig];
          if (!config) return null;
          
          const Icon = config.icon;
          
          return (
            <motion.div
              key={module.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              whileHover={{ scale: 1.03, y: -5 }}
            >
              <Card className={`p-6 cursor-pointer transition-all duration-300 bg-gradient-to-br ${config.color} hover:shadow-2xl border-0 group`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <Badge className="bg-white/20 text-white border-0 text-xs px-3 py-1">
                    Actif
                  </Badge>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">{module.name}</h3>
                <p className="text-sm text-white/90 mb-4 line-clamp-2">{config.description}</p>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full bg-white/20 text-white hover:bg-white/30 border-0 font-semibold"
                >
                  Accéder
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
});

ModuleCards.displayName = 'ModuleCards';

/**
 * KPI Section intégrée dans le Hero (version glassmorphism)
 */
const KPISectionInHero = memo(({ user }: { user: any }) => {
  const [showNiveauxModal, setShowNiveauxModal] = useState(false);
  
  const kpis = useMemo(() => {
    if (!user?.role) return [];
    return getKPIsForRole(user.role);
  }, [user?.role]);

  if (kpis.length === 0) return null;

  // Palette officielle E-Pilot par KPI - Version transparente
  const colorMap: Record<string, { bg: string; icon: string; badge: string; hover: string }> = {
    'Élèves actifs': {
      bg: 'bg-[#1D3557]/80 backdrop-blur-sm',      // Bleu Foncé Institutionnel - Transparent
      icon: 'text-white',
      badge: 'bg-[#152942]/90',
      hover: 'hover:bg-[#152942]/90'
    },
    'Classes ouvertes': {
      bg: 'bg-[#2A9D8F]/80 backdrop-blur-sm',      // Vert Cité Positive - Transparent
      icon: 'text-white',
      badge: 'bg-[#238b7e]/90',
      hover: 'hover:bg-[#238b7e]/90'
    },
    'Personnel actif': {
      bg: 'bg-[#E9C46A]/80 backdrop-blur-sm',      // Or Républicain - Transparent
      icon: 'text-[#1D3557]',
      badge: 'bg-[#d4b05e]/90',
      hover: 'hover:bg-[#d4b05e]/90'
    },
    'Niveaux': {
      bg: 'bg-[#E63946]/80 backdrop-blur-sm',      // Rouge Sobre - Transparent
      icon: 'text-white',
      badge: 'bg-[#d32f3b]/90',
      hover: 'hover:bg-[#d32f3b]/90'
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          const isNiveaux = kpi.title === 'Niveaux';
          const colors = colorMap[kpi.title] || colorMap['Niveaux'];
          
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.05 }}
              whileHover={{ scale: 1.03, y: -3 }}
              className="relative group"
              onClick={() => isNiveaux && setShowNiveauxModal(true)}
            >
              <div className={`${colors.bg} ${colors.hover} rounded-2xl p-4 transition-all duration-300 shadow-lg hover:shadow-2xl border border-white/10 ${isNiveaux ? 'cursor-pointer' : ''}`}>
                {/* Icône et Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-white/25 backdrop-blur-sm">
                    <Icon className={`h-5 w-5 ${colors.icon}`} />
                  </div>
                  {kpi.trend !== '0' && (
                    <Badge className={`${colors.badge} text-white border-0 text-xs px-3 py-1 font-semibold`}>
                      {kpi.trend}
                    </Badge>
                  )}
                </div>
                
                {/* Valeur */}
                <div>
                  <p className="text-xs text-white/90 mb-1.5 font-medium uppercase tracking-wide">{kpi.title}</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-white drop-shadow-sm">{kpi.value}</span>
                    <span className="text-xs text-white/80">{kpi.unit}</span>
                  </div>
                </div>

                {/* Indicateur cliquable pour Niveaux */}
                {isNiveaux && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute bottom-3 right-3 text-white/70 text-xs flex items-center gap-1"
                  >
                    <span>👆</span> Détails
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Modal Niveaux */}
      <NiveauxDetailsModal 
        isOpen={showNiveauxModal} 
        onClose={() => setShowNiveauxModal(false)} 
      />
    </>
  );
});

KPISectionInHero.displayName = 'KPISectionInHero';


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
      className="grid grid-cols-12 gap-6"
    >
      {/* Actions recommandées */}
      <div className="col-span-12 lg:col-span-7">
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
      <div className="col-span-12 lg:col-span-5">
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
const ProvisionerDashboard = memo(() => {
  const { data: user } = useCurrentUser();

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Section avec photo d'école */}
      <HeroSection user={user} />
      
      {/* Cartes modules colorées */}
      <ModuleCards />
      
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

ProvisionerDashboard.displayName = 'ProvisionerDashboard';

/**
 * Dashboard par défaut pour les autres rôles
 * TODO: Implémenter les dashboards spécifiques
 */
const DefaultDashboard = memo(() => {
  const { data: user } = useCurrentUser();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">
          Tableau de bord
        </h1>
        <p className="text-gray-600 mt-1">
          Bienvenue {user?.firstName} {user?.lastName}
        </p>
      </motion.div>

      <Card className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">
            Dashboard en cours de développement pour le rôle : <strong>{user?.role}</strong>
          </p>
          <p className="text-sm text-gray-500">
            Les fonctionnalités spécifiques à votre rôle seront bientôt disponibles.
          </p>
        </div>
      </Card>

      {/* Modules disponibles */}
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <AvailableModules />
      </Suspense>
    </div>
  );
});

DefaultDashboard.displayName = 'DefaultDashboard';

/**
 * Composant principal UserDashboard
 */
export const UserDashboard = () => {
  const { data: user, isLoading, error } = useCurrentUser();

  // État de chargement
  if (isLoading) {
    return <LoadingState />;
  }

  // État d'erreur
  if (error || !user) {
    return <ErrorState error={error} />;
  }

  // Rendu selon le rôle
  // Dashboard PROVISEUR/DIRECTEUR - Version Optimisée
  if (['proviseur', 'directeur', 'directeur_etudes'].includes(user.role)) {
    return <DirectorDashboardOptimized />;
  }

  // Dashboard ENSEIGNANT
  if (user.role === 'enseignant') {
    // TODO: Implémenter dashboard enseignant
    return <DefaultDashboard />;
  }

  // Dashboard CPE
  if (user.role === 'cpe') {
    // TODO: Implémenter dashboard CPE
    return <DefaultDashboard />;
  }

  // Dashboard COMPTABLE
  if (user.role === 'comptable') {
    // TODO: Implémenter dashboard comptable
    return <DefaultDashboard />;
  }

  // Dashboard par défaut pour les autres rôles
  return <DefaultDashboard />;
};
