/**
 * ChefDashboard - Dashboard moderne du Chef d'Établissement
 * Interface claire, complète et cohérente
 * 
 * @module ChefEtablissement/Pages
 */

import { memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  GraduationCap,
  Wallet,
  TrendingUp,
  AlertTriangle,
  Clock,
  ChevronRight,
  Calendar,
  Bell,
  BookOpen,
  UserCheck,
  CreditCard,
  FileText,
  Building2,
  MapPin,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

// Hooks
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { usePermissions } from '@/providers/PermissionsProvider';

// Types
interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  color?: string;
  modulesCount: number;
}

// ============================================
// TYPES
// ============================================

interface QuickStatProps {
  readonly title: string;
  readonly value: string | number;
  readonly icon: React.ElementType;
  readonly trend?: { value: number; isPositive: boolean };
  readonly color: string;
  readonly onClick?: () => void;
}

interface QuickActionProps {
  readonly label: string;
  readonly description: string;
  readonly icon: React.ElementType;
  readonly href: string;
  readonly color: string;
}

interface AlertItemProps {
  readonly title: string;
  readonly message: string;
  readonly severity: 'critical' | 'warning' | 'info';
  readonly time: string;
}

// ============================================
// COMPOSANTS
// ============================================

/**
 * Carte de statistique rapide - Design "Mission Control"
 * Style bloc de données technique
 */
const QuickStat = memo<QuickStatProps>(({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color,
  onClick 
}) => (
  <motion.div
    whileHover={{ y: -4, boxShadow: `0 10px 25px -5px ${color}30` }}
    whileTap={{ scale: 0.98 }}
    className="h-full"
  >
    <Card 
      className={cn(
        "h-full relative overflow-hidden cursor-pointer border-0",
        "bg-white shadow-sm hover:shadow-md transition-all duration-300",
        "group"
      )}
      onClick={onClick}
    >
      {/* Bande latérale colorée */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{ backgroundColor: color }}
      />
      
      {/* Background tech pattern (subtil) */}
      <div className="absolute top-0 right-0 p-4 opacity-5">
        <Icon className="w-24 h-24" style={{ color }} />
      </div>

      <CardContent className="p-5 pl-7 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start mb-4">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
            style={{ backgroundColor: `${color}10` }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-mono font-bold px-2 py-1 rounded-md",
              trend.isPositive 
                ? "bg-emerald-50 text-emerald-600" 
                : "bg-red-50 text-red-600"
            )}>
              <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
              <ArrowUpRight className={cn("h-3 w-3", !trend.isPositive && "rotate-180")} />
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 font-mono tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  </motion.div>
));

QuickStat.displayName = 'QuickStat';

/**
 * Action rapide - Design "Command Button"
 */
const QuickAction = memo<QuickActionProps>(({ 
  label, 
  description, 
  icon: Icon, 
  href, 
  color 
}) => {
  const navigate = useNavigate();
  
  return (
    <motion.button
      onClick={() => navigate(href)}
      whileHover={{ scale: 1.02, backgroundColor: "rgba(249, 250, 251, 1)" }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl w-full text-left",
        "bg-white border border-gray-100 shadow-sm",
        "group transition-all duration-200"
      )}
    >
      <div 
        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:rotate-3"
        style={{ 
          background: `linear-gradient(135deg, ${color}20, ${color}05)`,
          border: `1px solid ${color}30`
        }}
      >
        <Icon className="h-6 w-6" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 truncate group-hover:text-primary transition-colors">
          {label}
        </p>
        <p className="text-xs text-gray-500 truncate font-medium mt-0.5">
          {description}
        </p>
      </div>
      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 group-hover:bg-white group-hover:shadow-sm transition-all">
        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary" />
      </div>
    </motion.button>
  );
});

QuickAction.displayName = 'QuickAction';

/**
 * Item d'alerte - Design "System Log"
 */
const AlertItem = memo<AlertItemProps>(({ title, message, severity, time }) => {
  const severityConfig = {
    critical: { 
      border: 'border-l-red-500', 
      bg: 'hover:bg-red-50/30',
      badge: 'bg-red-100 text-red-700',
      icon: AlertTriangle 
    },
    warning: { 
      border: 'border-l-amber-500', 
      bg: 'hover:bg-amber-50/30',
      badge: 'bg-amber-100 text-amber-700',
      icon: Clock 
    },
    info: { 
      border: 'border-l-blue-500', 
      bg: 'hover:bg-blue-50/30',
      badge: 'bg-blue-100 text-blue-700',
      icon: Bell 
    },
  };
  
  const config = severityConfig[severity];
  const Icon = config.icon;
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "flex gap-4 p-4 rounded-lg border border-gray-100 bg-white transition-colors",
        "border-l-4",
        config.border,
        config.bg
      )}
    >
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <p className="font-bold text-gray-900 text-sm flex items-center gap-2">
            {severity === 'critical' && <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>}
            {title}
          </p>
          <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
            {time}
          </span>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
      </div>
    </motion.div>
  );
});

AlertItem.displayName = 'AlertItem';

/**
 * État de chargement
 */
const LoadingState = memo(() => (
  <div className="space-y-6 p-6 animate-pulse">
    <Skeleton className="h-24 w-full rounded-2xl" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  </div>
));

LoadingState.displayName = 'LoadingState';

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export const ChefDashboard = memo(() => {
  const navigate = useNavigate();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { modules, isLoading: modulesLoading } = usePermissions();

  // Récupérer les infos de l'école
  const { data: schoolInfo } = useQuery({
    queryKey: ['school-info', user?.schoolId],
    queryFn: async () => {
      if (!user?.schoolId) return null;
      
      const { data, error } = await supabase
        .from('schools')
        .select(`
          id,
          name,
          code,
          address,
          commune,
          school_groups (
            id,
            name
          )
        `)
        .eq('id', user.schoolId)
        .single();
      
      if (error) throw error;
      
      const schoolData = data as any;
      return {
        schoolName: schoolData.name || 'Mon École',
        schoolCode: schoolData.code,
        address: schoolData.address,
        commune: schoolData.commune,
        groupName: schoolData.school_groups?.name || 'Groupe Scolaire',
      };
    },
    enabled: !!user?.schoolId,
    staleTime: 10 * 60 * 1000,
  });

  const isLoading = userLoading || modulesLoading;

  // Extraire les catégories uniques des modules
  const categories = useMemo((): CategoryInfo[] => {
    if (!modules || modules.length === 0) return [];
    
    const categoryMap = new Map<string, CategoryInfo>();
    
    modules.forEach(module => {
      const catId = module.categoryId || 'other';
      const existing = categoryMap.get(catId);
      
      if (existing) {
        existing.modulesCount++;
      } else {
        categoryMap.set(catId, {
          id: catId,
          name: module.categoryName || 'Autres',
          slug: module.categorySlug || 'autres',
          color: module.color,
          modulesCount: 1,
        });
      }
    });
    
    return Array.from(categoryMap.values());
  }, [modules]);

  // Obtenir l'heure pour le message de bienvenue
  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }, []);

  // Obtenir la date formatée
  const getFormattedDate = useCallback(() => {
    return new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  // Obtenir le label du rôle
  const getRoleLabel = useCallback(() => {
    switch (user?.role) {
      case 'proviseur': return 'Proviseur';
      case 'directeur': return 'Directeur';
      case 'directeur_etudes': return 'Directeur des Études';
      default: return 'Chef d\'Établissement';
    }
  }, [user?.role]);

  // Actions rapides basées sur les modules disponibles
  const quickActions: QuickActionProps[] = [
    {
      label: 'Inscriptions',
      description: 'Gérer les inscriptions élèves',
      icon: GraduationCap,
      href: '/user/modules/gestion-inscriptions',
      color: '#10B981',
    },
    {
      label: 'Notes & Bulletins',
      description: 'Saisie et consultation des notes',
      icon: BookOpen,
      href: '/user/modules/notes-evaluations',
      color: '#3B82F6',
    },
    {
      label: 'Paiements',
      description: 'Suivi des frais scolaires',
      icon: CreditCard,
      href: '/user/modules/paiements-frais',
      color: '#8B5CF6',
    },
    {
      label: 'Absences',
      description: 'Suivi des présences',
      icon: UserCheck,
      href: '/user/modules/suivi-absences',
      color: '#EF4444',
    },
    {
      label: 'Emplois du temps',
      description: 'Planning des cours',
      icon: Calendar,
      href: '/user/modules/emplois-du-temps',
      color: '#06B6D4',
    },
    {
      label: 'Rapports',
      description: 'Statistiques et analyses',
      icon: FileText,
      href: '/user/modules/statistiques-rapports',
      color: '#F59E0B',
    },
  ].filter(action => {
    // Filtrer selon les modules disponibles
    const moduleSlug = action.href.split('/').pop();
    return modules?.some(m => m.slug === moduleSlug) ?? true;
  });

  // Alertes simulées (à remplacer par des vraies données)
  const alerts: AlertItemProps[] = [
    {
      title: 'Absences non justifiées',
      message: '12 élèves absents aujourd\'hui sans justification',
      severity: 'warning',
      time: 'Il y a 2 heures',
    },
    {
      title: 'Impayés en retard',
      message: '5 familles avec plus de 2 mois d\'arriérés',
      severity: 'critical',
      time: 'Hier',
    },
    {
      title: 'Conseil de classe',
      message: 'Rappel: Conseil de classe 3ème A demain à 14h',
      severity: 'info',
      time: 'Aujourd\'hui',
    },
  ];

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-[1600px] mx-auto bg-gray-50/50 min-h-screen">
      {/* En-tête de bienvenue - Design "Deep Space" */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl shadow-2xl shadow-slate-900/10"
      >
        {/* Background Tech */}
        <div className="absolute inset-0 bg-[#0F172A]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay" />
        
        {/* Cercles décoratifs "Planétaires" */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] transform translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[80px] transform -translate-x-1/3 translate-y-1/3" />

        {/* Contenu */}
        <div className="relative p-8 md:p-10">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            {/* Partie gauche - Identité */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                {/* Badge Rôle Tech */}
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800/50 backdrop-blur-md rounded border border-slate-700/50 text-cyan-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs font-mono uppercase tracking-widest font-bold">{getRoleLabel()}</span>
                </div>
                
                {/* Status Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-900/30 backdrop-blur-md rounded border border-emerald-800/50 text-emerald-400">
                  <span className="text-xs font-mono uppercase tracking-widest font-bold">ONLINE</span>
                </div>
              </div>
              
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">
                  {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">{user?.firstName || 'Commandant'}</span>
                </h1>
                <p className="text-slate-400 flex items-center gap-2 font-medium">
                  <Calendar className="h-4 w-4 text-cyan-500" />
                  <span className="font-mono tracking-wide">{getFormattedDate()}</span>
                </p>
              </div>
              
              {/* Infos École - Style "Mission Patch" */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-3 bg-slate-800/40 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors cursor-default">
                  <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <Building2 className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Établissement</p>
                    <p className="text-white font-bold">{schoolInfo?.schoolName || 'Chargement...'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-slate-800/40 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors cursor-default">
                  <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <Users className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Groupe</p>
                    <p className="text-white font-bold">{schoolInfo?.groupName || 'Chargement...'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Partie droite - Système Stats */}
            <div className="grid grid-cols-2 gap-4 min-w-[280px]">
              <div className="bg-slate-800/40 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50 text-center">
                <p className="text-3xl font-mono font-bold text-white mb-1">{modules?.length || 0}</p>
                <p className="text-xs text-slate-400 uppercase tracking-widest">Modules</p>
              </div>
              <div className="bg-slate-800/40 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50 text-center">
                <p className="text-3xl font-mono font-bold text-white mb-1">{categories?.length || 0}</p>
                <p className="text-xs text-slate-400 uppercase tracking-widest">Catégories</p>
              </div>
              <div className="col-span-2 bg-slate-800/40 backdrop-blur-sm p-3 rounded-xl border border-slate-700/50 flex items-center justify-between px-6">
                <span className="text-xs text-slate-400 uppercase tracking-widest">System Status</span>
                <div className="flex gap-1.5">
                  <span className="w-1.5 h-3 bg-emerald-500 rounded-full" />
                  <span className="w-1.5 h-3 bg-emerald-500 rounded-full" />
                  <span className="w-1.5 h-3 bg-emerald-500 rounded-full" />
                  <span className="w-1.5 h-3 bg-emerald-500/30 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Statistiques rapides - Grid technique */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[160px]"
      >
        <QuickStat
          title="Élèves inscrits"
          value="1,245"
          icon={Users}
          trend={{ value: 5.2, isPositive: true }}
          color="#10B981"
          onClick={() => navigate('/user/modules/suivi-eleves')}
        />
        <QuickStat
          title="Enseignants"
          value="48"
          icon={GraduationCap}
          color="#3B82F6"
          onClick={() => navigate('/user/personnel')}
        />
        <QuickStat
          title="Taux de réussite"
          value="87%"
          icon={TrendingUp}
          trend={{ value: 3.1, isPositive: true }}
          color="#8B5CF6"
          onClick={() => navigate('/user/modules/statistiques-rapports')}
        />
        <QuickStat
          title="Recouvrement"
          value="72%"
          icon={Wallet}
          trend={{ value: 2.4, isPositive: false }}
          color="#F59E0B"
          onClick={() => navigate('/user/modules/paiements-frais')}
        />
      </motion.div>

      {/* Contenu principal - Layout Asymétrique Technique */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Actions rapides */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 h-full"
        >
          <Card className="border-0 shadow-sm bg-white h-full overflow-hidden flex flex-col">
            <CardHeader className="pb-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-cyan-500 rounded-full" />
                  <CardTitle className="text-sm font-mono uppercase tracking-widest text-gray-500 font-bold">
                    Command Center
                  </CardTitle>
                </div>
                <Badge variant="outline" className="font-mono text-xs border-cyan-200 text-cyan-700 bg-cyan-50">
                  {quickActions.length} ACTIONS DISPONIBLES
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quickActions.slice(0, 6).map((action) => (
                  <QuickAction key={action.label} {...action} />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Alertes */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="h-full"
        >
          <Card className="h-full border-0 shadow-sm bg-white overflow-hidden flex flex-col">
            <CardHeader className="pb-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-red-500 rounded-full" />
                  <CardTitle className="text-sm font-mono uppercase tracking-widest text-gray-500 font-bold">
                    System Logs
                  </CardTitle>
                </div>
                <Badge variant="outline" className="font-mono text-xs border-red-200 text-red-700 bg-red-50 animate-pulse">
                  {alerts.length} CRITICAL
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col">
              <div className="space-y-4 flex-1">
                {alerts.map((alert, index) => (
                  <AlertItem key={index} {...alert} />
                ))}
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-6 border-dashed border-gray-300 hover:border-cyan-500 hover:text-cyan-600 hover:bg-cyan-50 transition-all text-xs font-mono uppercase tracking-wider"
                onClick={() => navigate('/user/notifications')}
              >
                Afficher tous les logs
                <ChevronRight className="h-3 w-3 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Catégories métier */}
      {categories && categories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-indigo-500 rounded-full" />
                  <CardTitle className="text-sm font-mono uppercase tracking-widest text-gray-500 font-bold">
                    Operational Modules
                  </CardTitle>
                </div>
                <Badge variant="outline" className="font-mono text-xs border-indigo-200 text-indigo-700 bg-indigo-50">
                  {categories.length} SECTEURS
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {categories.slice(0, 8).map((category, index) => (
                  <motion.button
                    key={category.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/user/categories/${category.slug}`)}
                    className={cn(
                      "flex flex-col items-center gap-4 p-6 rounded-xl",
                      "bg-white border border-gray-100 shadow-sm",
                      "hover:shadow-lg hover:border-indigo-100 transition-all duration-300",
                      "text-center group relative overflow-hidden"
                    )}
                  >
                    <div 
                      className="absolute top-0 left-0 w-full h-1 transition-colors duration-300"
                      style={{ backgroundColor: category.color || '#6B7280' }} 
                    />
                    
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110"
                      style={{ backgroundColor: `${category.color || '#6B7280'}10` }}
                    >
                      <BookOpen 
                        className="h-8 w-8" 
                        style={{ color: category.color || '#6B7280' }} 
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <span className="block text-sm font-bold text-gray-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {category.name}
                      </span>
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-mono text-gray-400">
                          {category.modulesCount} MODS
                        </span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
});

ChefDashboard.displayName = 'ChefDashboard';

export default ChefDashboard;
