/**
 * Dashboard Directeur Professionnel - Design Moderne 2025
 * Inspiré des meilleures pratiques : Notion, Linear, Stripe
 * Focus performance + UX exceptionnelle
 * 
 * @module DirectorDashboardOptimized
 */

// Styles CSS pour les animations personnalisées
const customStyles = `
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in {
    animation: fade-in 0.6s ease-out forwards;
    opacity: 0;
  }
`;

// Injection des styles dans le document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = customStyles;
  document.head.appendChild(styleSheet);
}

import { memo, useMemo, useState } from 'react';
import { 
  GraduationCap,
  Users,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Building2,
  Target,
  BarChart3,
  AlertTriangle,
  Eye,
  ArrowUpRight,
  RefreshCw,
  Info
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useDirectorDashboard } from '../hooks/useDirectorDashboard';

// Import des nouveaux composants
import TrendChart from '../components/TrendChart';
import AlertSystem from '../components/AlertSystem';
import TemporalComparison from '../components/TemporalComparison';
import NiveauDetailModal from '../components/NiveauDetailModal';
import TemporalFilters from '../components/TemporalFilters';

/**
 * Types pour les niveaux éducatifs
 */
interface NiveauEducatif {
  id: string;
  nom: string;
  couleur: string;
  icone: any;
  kpis: {
    eleves: number;
    classes: number;
    enseignants: number;
    taux_reussite: number;
    revenus: number;
    trend: 'up' | 'down' | 'stable';
  };
}

/**
 * Header moderne avec actions rapides (inspiré Notion/Linear)
 */
const DashboardHeader = memo(() => {
  const { data: user } = useCurrentUser();
  const currentDate = new Date();
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-8 mb-8 shadow-sm hover:shadow-lg transition-all duration-500 relative overflow-hidden group">
      {/* Éléments décoratifs subtils */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-100/30 to-indigo-100/20 rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-emerald-100/25 to-teal-100/15 rounded-full -ml-16 -mb-16 group-hover:scale-110 transition-transform duration-1000"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          {/* Titre et navigation */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-[#2A9D8F] to-[#238b7e] rounded-3xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              {/* Indicateur de statut */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1 group-hover:text-[#2A9D8F] transition-colors duration-300">École Charles Zackama</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  Sembé, Congo
                </span>
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {formatDate(currentDate)}
                </span>
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                <span className="text-gray-500">{formatTime(currentDate)}</span>
              </div>
            </div>
          </div>

          {/* Actions simplifiées */}
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-600 hover:text-[#2A9D8F] hover:bg-[#2A9D8F]/5 transition-all duration-200 gap-2"
              onClick={() => window.open('/user/calendar', '_blank')}
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Planning</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 border-[#2A9D8F]/20 text-[#2A9D8F] hover:bg-[#2A9D8F] hover:text-white hover:border-[#2A9D8F] transition-all duration-200 shadow-sm"
              onClick={() => {
                const data = {
                  school: 'École Charles Zackama',
                  date: new Date().toLocaleDateString('fr-FR'),
                  students: '625 élèves',
                  classes: '31 classes',
                  staff: '50 personnel'
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `rapport-ecole-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Rapport</span>
            </Button>
          </div>
        </div>

        {/* Informations contextuelles simplifiées */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-700 border-blue-200 px-4 py-2 shadow-sm">
            <Calendar className="h-3 w-3 mr-2" />
            Année scolaire 2024-2025
          </Badge>
          
          <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
            Mise à jour: {formatTime(currentDate)}
          </div>
        </div>
      </div>
    </div>
  );
});

DashboardHeader.displayName = 'DashboardHeader';

/**
 * KPI Card avec glassmorphisme (inspiré Admin Groupe)
 */
const KPICard = memo(({ 
  title, 
  value, 
  unit, 
  trend, 
  trendValue, 
  icon: Icon, 
  gradient,
  iconBg,
  iconColor,
  clickable = false
}: {
  title: string;
  value: number | string;
  unit?: string;
  trend: 'up' | 'down' | 'stable';
  trendValue?: string;
  icon: any;
  gradient: string;
  iconBg: string;
  iconColor: string;
  clickable?: boolean;
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3.5 w-3.5 text-white/90" />;
      case 'down': return <TrendingDown className="h-3.5 w-3.5 text-white/90" />;
      default: return <div className="w-3 h-3 bg-white/50 rounded-full" />;
    }
  };

  return (
    <div className={`group relative overflow-hidden bg-gradient-to-br ${gradient} rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] border border-white/10 ${clickable ? 'cursor-pointer' : ''}`}>
      {/* Cercles décoratifs animés */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 group-hover:scale-150 transition-transform duration-700" />
      
      {/* Contenu */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 ${iconBg} backdrop-blur-sm rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`h-7 w-7 ${iconColor}`} />
          </div>
          {trendValue && (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm shadow-lg">
              {getTrendIcon()}
              <span className="text-xs font-bold text-white/90">
                {trend === 'up' ? '+' : trend === 'down' ? '' : ''}{trendValue}
              </span>
            </div>
          )}
          {clickable && (
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowUpRight className="h-4 w-4 text-white/70" />
            </div>
          )}
        </div>
        <p className="text-white/70 text-sm font-semibold mb-2 tracking-wide uppercase">{title}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-extrabold text-white drop-shadow-lg leading-none">{typeof value === 'number' ? value.toLocaleString() : value}</span>
          {unit && <span className="text-sm font-medium text-white/70">{unit}</span>}
        </div>
      </div>
    </div>
  );
});

KPICard.displayName = 'KPICard';

/**
 * Fonction pour obtenir le design spécifique à chaque niveau
 */
const getNiveauDesign = (niveauId: string) => {
  const designs = {
    maternelle: {
      // Design Bleu Foncé Institutionnel (#1D3557) pour la maternelle
      eleves: {
        gradient: "from-[#1D3557] via-[#2A4A6F] to-[#0d1f3d]",
        iconBg: "bg-[#1D3557]/20",
        iconColor: "text-blue-100"
      },
      classes: {
        gradient: "from-[#1D3557] via-[#2A4A6F] to-[#0d1f3d]",
        iconBg: "bg-[#1D3557]/20",
        iconColor: "text-blue-100"
      },
      enseignants: {
        gradient: "from-[#1D3557] via-[#2A4A6F] to-[#0d1f3d]",
        iconBg: "bg-[#1D3557]/20",
        iconColor: "text-blue-100"
      },
      taux: {
        gradient: "from-[#1D3557] via-[#2A4A6F] to-[#0d1f3d]",
        iconBg: "bg-[#1D3557]/20",
        iconColor: "text-blue-100"
      }
    },
    primaire: {
      // Design Vert Cité Positive (#2A9D8F) pour le primaire
      eleves: {
        gradient: "from-[#2A9D8F] via-[#3FBFAE] to-[#1d7a6f]",
        iconBg: "bg-[#2A9D8F]/20",
        iconColor: "text-emerald-100"
      },
      classes: {
        gradient: "from-[#2A9D8F] via-[#3FBFAE] to-[#1d7a6f]",
        iconBg: "bg-[#2A9D8F]/20",
        iconColor: "text-emerald-100"
      },
      enseignants: {
        gradient: "from-[#2A9D8F] via-[#3FBFAE] to-[#1d7a6f]",
        iconBg: "bg-[#2A9D8F]/20",
        iconColor: "text-emerald-100"
      },
      taux: {
        gradient: "from-[#2A9D8F] via-[#3FBFAE] to-[#1d7a6f]",
        iconBg: "bg-[#2A9D8F]/20",
        iconColor: "text-emerald-100"
      }
    },
    college: {
      // Design Or Républicain (#E9C46A) pour le collège
      eleves: {
        gradient: "from-[#E9C46A] via-[#F4D03F] to-[#D4AC0D]",
        iconBg: "bg-[#E9C46A]/20",
        iconColor: "text-yellow-100"
      },
      classes: {
        gradient: "from-[#E9C46A] via-[#F4D03F] to-[#D4AC0D]",
        iconBg: "bg-[#E9C46A]/20",
        iconColor: "text-yellow-100"
      },
      enseignants: {
        gradient: "from-[#E9C46A] via-[#F4D03F] to-[#D4AC0D]",
        iconBg: "bg-[#E9C46A]/20",
        iconColor: "text-yellow-100"
      },
      taux: {
        gradient: "from-[#E9C46A] via-[#F4D03F] to-[#D4AC0D]",
        iconBg: "bg-[#E9C46A]/20",
        iconColor: "text-yellow-100"
      }
    },
    lycee: {
      // Design Rouge Sobre (#E63946) pour le lycée
      eleves: {
        gradient: "from-[#E63946] via-[#F1556C] to-[#DC2626]",
        iconBg: "bg-[#E63946]/20",
        iconColor: "text-red-100"
      },
      classes: {
        gradient: "from-[#E63946] via-[#F1556C] to-[#DC2626]",
        iconBg: "bg-[#E63946]/20",
        iconColor: "text-red-100"
      },
      enseignants: {
        gradient: "from-[#E63946] via-[#F1556C] to-[#DC2626]",
        iconBg: "bg-[#E63946]/20",
        iconColor: "text-red-100"
      },
      taux: {
        gradient: "from-[#E63946] via-[#F1556C] to-[#DC2626]",
        iconBg: "bg-[#E63946]/20",
        iconColor: "text-red-100"
      }
    }
  };

  return designs[niveauId as keyof typeof designs] || designs.primaire;
};

/**
 * Section Niveau Éducatif avec design moderne et différencié
 */
const NiveauSection = memo(({ 
  niveau, 
  isExpanded = true, 
  onNiveauClick 
}: { 
  niveau: NiveauEducatif; 
  isExpanded?: boolean;
  onNiveauClick?: (niveau: NiveauEducatif) => void;
}) => {
  const design = getNiveauDesign(niveau.id);

  return (
    <Card className="p-6 mb-6 border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white via-gray-50/30 to-white relative overflow-hidden group">
      {/* Éléments décoratifs subtils */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/20 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-100/15 to-transparent rounded-full -ml-12 -mb-12 group-hover:scale-110 transition-transform duration-700"></div>
      
      {/* En-tête du niveau avec badge de revenus */}
      <div className="relative z-10 flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl ${niveau.couleur} shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300`}>
            <niveau.icone className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 group-hover:text-[#2A9D8F] transition-colors duration-300">{niveau.nom}</h2>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-sm text-gray-600 font-medium">
                {niveau.kpis.eleves} élèves • {niveau.kpis.classes} classes • {niveau.kpis.enseignants} enseignants
              </p>
              <Badge className="bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200 px-3 py-1 shadow-sm">
                💰 {(niveau.kpis.revenus / 1000000).toFixed(2)}M FCFA
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge 
            variant="outline" 
            className={`${niveau.kpis.taux_reussite >= 80 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'} px-4 py-2 font-semibold shadow-sm`}
          >
            {niveau.kpis.taux_reussite >= 80 ? '✓ Performant' : '⚠ À surveiller'}
          </Badge>
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2 hover:bg-[#2A9D8F] hover:text-white transition-colors"
            onClick={() => onNiveauClick?.(niveau)}
          >
            <Eye className="h-4 w-4" />
            Voir Détails
          </Button>
        </div>
      </div>

      {/* KPI du niveau - TOUJOURS VISIBLES avec designs différenciés */}
      <div className="relative z-10 mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Élèves"
              value={niveau.kpis.eleves}
              trend={niveau.kpis.trend}
              trendValue="+5%"
              icon={Users}
              gradient={design.eleves.gradient}
              iconBg={design.eleves.iconBg}
              iconColor={design.eleves.iconColor}
              clickable
            />
            
            <KPICard
              title="Classes"
              value={niveau.kpis.classes}
              trend={niveau.kpis.trend}
              trendValue="+2"
              icon={BookOpen}
              gradient={design.classes.gradient}
              iconBg={design.classes.iconBg}
              iconColor={design.classes.iconColor}
              clickable
            />
            
            <KPICard
              title="Enseignants"
              value={niveau.kpis.enseignants}
              trend="stable"
              icon={UserCheck}
              gradient={design.enseignants.gradient}
              iconBg={design.enseignants.iconBg}
              iconColor={design.enseignants.iconColor}
              clickable
            />
            
            <KPICard
              title="Taux Réussite"
              value={niveau.kpis.taux_reussite}
              unit="%"
              trend={niveau.kpis.taux_reussite >= 80 ? 'up' : 'down'}
              trendValue={niveau.kpis.taux_reussite >= 80 ? '+3%' : '-2%'}
              icon={Target}
              gradient={design.taux.gradient}
              iconBg={design.taux.iconBg}
              iconColor={design.taux.iconColor}
              clickable
            />
        </div>
      </div>
    </Card>
  );
});

NiveauSection.displayName = 'NiveauSection';

/**
 * Dashboard Directeur Principal
 */
export const DirectorDashboardOptimized = memo(() => {
  // Hook pour les données réelles
  const {
    schoolLevels,
    globalKPIs,
    trendData: realTrendData,
    isLoading: dashboardLoading,
    error: dashboardError,
    refreshData,
    stats: dashboardStats
  } = useDirectorDashboard();

  // États pour les nouveaux composants
  const [selectedNiveau, setSelectedNiveau] = useState<NiveauEducatif | null>(null);
  const [isNiveauModalOpen, setIsNiveauModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedRange, setSelectedRange] = useState('2024-11');
  const [comparisonType, setComparisonType] = useState<'month' | 'quarter' | 'year'>('month');
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  // Conversion des données réelles vers le format attendu
  const niveauxEducatifs: NiveauEducatif[] = useMemo(() => {
    console.log('🔍 DirectorDashboard - schoolLevels reçus:', schoolLevels);
    console.log('🔍 DirectorDashboard - Nombre de niveaux:', schoolLevels.length);
    
    const converted = schoolLevels.map(level => ({
      id: level.id,
      nom: level.name,
      couleur: level.color,
      icone: level.icon === 'BookOpen' ? BookOpen : 
             level.icon === 'Building2' ? Building2 : 
             level.icon === 'Baby' ? GraduationCap :
             GraduationCap,
      kpis: {
        eleves: level.students_count,
        classes: level.classes_count,
        enseignants: level.teachers_count,
        taux_reussite: level.success_rate,
        revenus: level.revenue,
        trend: level.trend
      }
    }));
    
    console.log('✅ DirectorDashboard - niveauxEducatifs convertis:', converted);
    return converted;
  }, [schoolLevels]);

  // KPI globaux de l'école (utilise les données réelles)
  const kpiGlobaux = useMemo(() => ({
    eleves: globalKPIs.totalStudents,
    classes: globalKPIs.totalClasses,
    enseignants: globalKPIs.totalTeachers,
    taux_reussite: globalKPIs.averageSuccessRate,
    revenus: globalKPIs.totalRevenue
  }), [globalKPIs]);

  // Conversion des données de tendance réelles vers le format attendu
  const trendData = useMemo(() => 
    realTrendData.map(data => ({
      period: data.period,
      eleves: data.students,
      taux_reussite: data.success_rate,
      revenus: data.revenue,
      enseignants: data.teachers
    })), [realTrendData]);

  // ✅ Données pour les comparaisons temporelles (RÉELLES depuis trendData)
  const currentPeriodData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // Format: YYYY-MM
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    
    return {
      period: currentMonth,
      label: `${monthNames[now.getMonth()]} ${now.getFullYear()}`,
      data: {
        eleves: kpiGlobaux.eleves,
        classes: kpiGlobaux.classes,
        enseignants: kpiGlobaux.enseignants,
        taux_reussite: kpiGlobaux.taux_reussite,
        revenus: kpiGlobaux.revenus
      }
    };
  }, [kpiGlobaux]);

  const previousPeriodData = useMemo(() => {
    // Récupérer les données du mois précédent depuis trendData
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthPeriod = lastMonth.toISOString().slice(0, 7);
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    
    // Trouver les données du mois précédent dans trendData
    const lastMonthData = trendData.find(t => t.period === lastMonthPeriod);
    
    if (lastMonthData) {
      return {
        period: lastMonthPeriod,
        label: `${monthNames[lastMonth.getMonth()]} ${lastMonth.getFullYear()}`,
        data: {
          eleves: lastMonthData.eleves,
          classes: Math.round(lastMonthData.eleves / 25), // Estimation: 25 élèves par classe
          enseignants: lastMonthData.enseignants,
          taux_reussite: lastMonthData.taux_reussite,
          revenus: lastMonthData.revenus
        }
      };
    }
    
    // Fallback si pas de données
    return {
      period: lastMonthPeriod,
      label: `${monthNames[lastMonth.getMonth()]} ${lastMonth.getFullYear()}`,
      data: {
        eleves: 0,
        classes: 0,
        enseignants: 0,
        taux_reussite: 0,
        revenus: 0
      }
    };
  }, [trendData]);

  // Fonctions de gestion des événements
  const handleNiveauClick = (niveau: NiveauEducatif) => {
    setSelectedNiveau(niveau);
    setIsNiveauModalOpen(true);
  };

  const handleCloseNiveauModal = () => {
    setIsNiveauModalOpen(false);
    setSelectedNiveau(null);
  };

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId]);
  };

  // 🔧 Fonction de diagnostic et nettoyage du cache
  const handleClearCacheAndReload = () => {
    console.log('🧹 Nettoyage du cache d\'authentification...');
    
    // Vider le cache Zustand
    localStorage.removeItem('e-pilot-auth');
    localStorage.removeItem('auth-token');
    localStorage.removeItem('auth-refresh-token');
    
    console.log('✅ Cache vidé - Rechargement de la page...');
    
    // Recharger la page
    window.location.reload();
  };

  const handlePeriodChange = (period: 'month' | 'quarter' | 'year') => {
    setSelectedPeriod(period);
    // Logique pour mettre à jour selectedRange selon la période
    if (period === 'month') {
      setSelectedRange('2024-11');
    } else if (period === 'quarter') {
      setSelectedRange('2024-Q4');
    } else {
      setSelectedRange('2024');
    }
  };

  const handleRefresh = () => {
    // Utilise la fonction de rafraîchissement du hook
    refreshData();
  };

  const handleExport = () => {
    // Logique d'export des données filtrées
    const data = {
      period: selectedPeriod,
      range: selectedRange,
      kpis: kpiGlobaux,
      niveaux: niveauxEducatifs.map(n => ({ nom: n.nom, ...n.kpis }))
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-export-${selectedRange}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10">
      {/* Fond décoratif amélioré */}
      <div className="absolute inset-0">
        {/* Motifs géométriques subtils avec animations */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-blue-200/8 to-indigo-300/4 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-32 right-16 w-96 h-96 bg-gradient-to-br from-emerald-200/6 to-teal-300/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-br from-purple-200/4 to-pink-300/2 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Grille de points décoratifs améliorée */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.15) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}></div>
      </div>

      {/* Contenu principal avec espacement optimisé */}
      <div className="relative z-10 space-y-8 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header avec infos essentielles */}
      <DashboardHeader />

      {/* Alerte si données mockées */}
      {dashboardError && (
        <Alert variant="default" className="mb-6 border-orange-200 bg-orange-50">
          <Info className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800 font-semibold">Données de Démonstration</AlertTitle>
          <AlertDescription className="text-orange-700">
            Les données affichées sont des exemples. Vérifiez la connexion à la base de données pour voir les données réelles de votre école.
            <div className="mt-2 flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={refreshData}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Réessayer
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Globaux de l'École avec design premium */}
      <Card className="p-8 relative overflow-hidden group hover:shadow-xl transition-all duration-500 border-0 bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30">
        {/* Éléments décoratifs animés */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-emerald-100/20 to-teal-100/10 rounded-full -mr-24 -mt-24 group-hover:scale-110 transition-transform duration-700"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-100/15 to-indigo-100/10 rounded-full -ml-16 -mb-16 group-hover:scale-110 transition-transform duration-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-gradient-to-br from-purple-100/10 to-pink-100/8 rounded-full -ml-12 -mt-12 group-hover:scale-110 transition-transform duration-800"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#2A9D8F] to-[#238b7e] rounded-2xl flex items-center justify-center shadow-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 group-hover:text-[#2A9D8F] transition-colors duration-300">Vue d'Ensemble École</h2>
                <p className="text-sm text-gray-600 mt-1">Indicateurs globaux tous niveaux confondus</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200 px-4 py-2 shadow-sm">
                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                {dashboardLoading ? 'Chargement...' : 'En temps réel'}
              </Badge>
              {dashboardError && (
                <Badge variant="destructive" className="px-3 py-1">
                  Données de démonstration
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-600 hover:text-[#2A9D8F]"
                onClick={refreshData}
                disabled={dashboardLoading}
              >
                <RefreshCw className={`h-4 w-4 ${dashboardLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Grille KPI globaux avec responsive amélioré */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Total Élèves"
              value={kpiGlobaux.eleves}
              trend="up"
              trendValue="+8%"
              icon={Users}
              gradient="from-[#1D3557] via-[#2A4A6F] to-[#0d1f3d]"
              iconBg="bg-blue-500/20"
              iconColor="text-blue-100"
            />
            
            <KPICard
              title="Total Classes"
              value={kpiGlobaux.classes}
              trend="up"
              trendValue="+3"
              icon={BookOpen}
              gradient="from-[#2A9D8F] via-[#3FBFAE] to-[#1d7a6f]"
              iconBg="bg-emerald-500/20"
              iconColor="text-emerald-100"
            />
            
            <KPICard
              title="Personnel"
              value={kpiGlobaux.enseignants}
              trend="stable"
              icon={UserCheck}
              gradient="from-[#8B5CF6] via-[#A78BFA] to-[#7C3AED]"
              iconBg="bg-purple-500/20"
              iconColor="text-purple-100"
            />
            
            <KPICard
              title="Taux Moyen"
              value={kpiGlobaux.taux_reussite}
              unit="%"
              trend={kpiGlobaux.taux_reussite >= 80 ? 'up' : 'down'}
              trendValue="+2%"
              icon={Target}
              gradient="from-[#F59E0B] via-[#FBBF24] to-[#D97706]"
              iconBg="bg-orange-500/20"
              iconColor="text-orange-100"
            />
          </div>
        </div>
      </Card>

      {/* Sections par Niveau Éducatif avec header amélioré */}
      <div className="space-y-6">
        <div className="relative overflow-hidden flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 via-blue-50/50 to-indigo-50/30 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 group">
          {/* Fond décoratif moderne */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-200/15 to-transparent rounded-full -ml-12 -mb-12 group-hover:scale-110 transition-transform duration-700"></div>
          
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-300">Détail par Niveau Éducatif</h2>
              <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300">Performances par niveau scolaire</p>
            </div>
          </div>
          <div className="relative z-10 flex items-center gap-2">
            <Badge variant="secondary" className="bg-white/80 text-blue-700 border-blue-200/50 text-xs px-2 py-1 shadow-sm backdrop-blur-sm">
              {niveauxEducatifs.length} niveaux
            </Badge>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600 hover:bg-white/50 p-2 backdrop-blur-sm">
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {niveauxEducatifs.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun niveau scolaire actif</h3>
                  <p className="text-gray-600 mb-4">
                    Votre école n'a aucun niveau scolaire activé. Si vous venez de les activer, le cache doit être vidé.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={refreshData} variant="outline" className="gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Rafraîchir
                    </Button>
                    <Button onClick={handleClearCacheAndReload} className="gap-2 bg-orange-600 hover:bg-orange-700">
                      <RefreshCw className="h-4 w-4" />
                      Vider le Cache et Recharger
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    💡 Le bouton orange va vider le cache et vous reconnecter automatiquement
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            niveauxEducatifs.map((niveau, index) => (
              <div key={niveau.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <NiveauSection niveau={niveau} onNiveauClick={handleNiveauClick} />
              </div>
            ))
          )}
        </div>
      </div>


      {/* Filtres Temporels */}
      <TemporalFilters
        selectedPeriod={selectedPeriod}
        selectedRange={selectedRange}
        onPeriodChange={handlePeriodChange}
        onRangeChange={setSelectedRange}
        onRefresh={handleRefresh}
        onExport={handleExport}
        isLoading={false}
      />

      {/* Système d'Alertes */}
      <AlertSystem
        kpiData={kpiGlobaux}
        niveauxData={niveauxEducatifs}
        onDismissAlert={handleDismissAlert}
      />

      {/* Graphiques de Tendances */}
      <TrendChart
        data={trendData}
        title="Évolution des Indicateurs Clés"
        period={selectedPeriod}
        onPeriodChange={handlePeriodChange}
      />

      {/* Comparaisons Temporelles */}
      <TemporalComparison
        currentPeriod={currentPeriodData}
        previousPeriod={previousPeriodData}
        comparisonType={comparisonType}
        onComparisonTypeChange={setComparisonType}
      />

      {/* Modal de Détail Niveau */}
      <NiveauDetailModal
        niveau={selectedNiveau}
        isOpen={isNiveauModalOpen}
        onClose={handleCloseNiveauModal}
      />
      </div>
    </div>
  );
});

DirectorDashboardOptimized.displayName = 'DirectorDashboardOptimized';
