/**
 * Composant Tooltip explicatif pour les KPIs
 * Fournit des explications contextuelles et des conseils d'interprétation
 */

import { memo, ReactNode, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Badge } from '@/components/ui/badge';
import { 
  Info, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Users,
  BookOpen,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface KPITooltipProps {
  children: ReactNode;
  kpiType: 'eleves' | 'classes' | 'enseignants' | 'taux_reussite' | 'revenus' | 'performance';
  value: number | string;
  trend?: 'up' | 'down' | 'stable';
  niveau?: string;
  className?: string;
}

const KPITooltip = memo(({ 
  children, 
  kpiType, 
  value, 
  trend, 
  niveau,
  className = '' 
}: KPITooltipProps) => {

  const getKPIInfo = (type: string) => {
    const kpiInfos = {
      eleves: {
        title: 'Nombre d\'Élèves',
        description: 'Effectif total des élèves inscrits dans ce niveau',
        interpretation: {
          excellent: 'Effectif optimal pour un enseignement de qualité',
          good: 'Effectif satisfaisant',
          warning: 'Effectif faible - risque de fermeture de classes',
          critical: 'Effectif critique - action urgente requise'
        },
        thresholds: {
          excellent: 200,
          good: 100,
          warning: 50,
          critical: 20
        },
        icon: Users,
        color: 'blue',
        tips: [
          'Un effectif stable indique une bonne réputation',
          'Surveiller les tendances saisonnières',
          'Comparer avec les années précédentes'
        ]
      },
      classes: {
        title: 'Nombre de Classes',
        description: 'Nombre total de classes organisées pour ce niveau',
        interpretation: {
          excellent: 'Organisation optimale des classes',
          good: 'Nombre de classes adapté',
          warning: 'Peut nécessiter une réorganisation',
          critical: 'Structure inadéquate'
        },
        thresholds: {
          excellent: 8,
          good: 4,
          warning: 2,
          critical: 1
        },
        icon: BookOpen,
        color: 'green',
        tips: [
          'Ratio idéal : 20-25 élèves par classe',
          'Considérer les spécialisations',
          'Optimiser l\'utilisation des salles'
        ]
      },
      enseignants: {
        title: 'Nombre d\'Enseignants',
        description: 'Personnel enseignant affecté à ce niveau',
        interpretation: {
          excellent: 'Équipe pédagogique complète',
          good: 'Personnel suffisant',
          warning: 'Manque de personnel',
          critical: 'Sous-effectif critique'
        },
        thresholds: {
          excellent: 15,
          good: 8,
          warning: 4,
          critical: 2
        },
        icon: Users,
        color: 'purple',
        tips: [
          'Ratio idéal : 1 enseignant pour 20-25 élèves',
          'Prévoir les remplacements',
          'Diversifier les compétences'
        ]
      },
      taux_reussite: {
        title: 'Taux de Réussite',
        description: 'Pourcentage d\'élèves ayant validé leur niveau',
        interpretation: {
          excellent: 'Excellents résultats pédagogiques',
          good: 'Résultats satisfaisants',
          warning: 'Résultats préoccupants',
          critical: 'Situation critique - intervention urgente'
        },
        thresholds: {
          excellent: 90,
          good: 80,
          warning: 70,
          critical: 60
        },
        icon: Target,
        color: 'orange',
        tips: [
          'Objectif national : 80% minimum',
          'Analyser par matière pour cibler les difficultés',
          'Mettre en place du soutien scolaire si nécessaire'
        ]
      },
      revenus: {
        title: 'Revenus du Niveau',
        description: 'Chiffre d\'affaires généré par ce niveau éducatif',
        interpretation: {
          excellent: 'Rentabilité excellente',
          good: 'Rentabilité satisfaisante',
          warning: 'Rentabilité faible',
          critical: 'Déficit - révision nécessaire'
        },
        thresholds: {
          excellent: 2000000,
          good: 1000000,
          warning: 500000,
          critical: 200000
        },
        icon: DollarSign,
        color: 'emerald',
        tips: [
          'Inclut frais de scolarité et services annexes',
          'Comparer avec les coûts de fonctionnement',
          'Optimiser le rapport qualité-prix'
        ]
      },
      performance: {
        title: 'Performance Globale',
        description: 'Évaluation synthétique basée sur tous les indicateurs',
        interpretation: {
          excellent: 'Performance exceptionnelle',
          good: 'Performance satisfaisante',
          warning: 'Performance à améliorer',
          critical: 'Performance critique'
        },
        thresholds: {
          excellent: 90,
          good: 75,
          warning: 60,
          critical: 50
        },
        icon: Target,
        color: 'indigo',
        tips: [
          'Synthèse de tous les KPIs',
          'Identifier les points d\'amélioration',
          'Mettre en place un plan d\'action'
        ]
      }
    };

    return kpiInfos[type as keyof typeof kpiInfos] || kpiInfos.performance;
  };

  const kpiInfo = getKPIInfo(kpiType);
  const numericValue = typeof value === 'number' ? value : parseFloat(value.toString());
  
  const getPerformanceLevel = (value: number, thresholds: any) => {
    if (value >= thresholds.excellent) return 'excellent';
    if (value >= thresholds.good) return 'good';
    if (value >= thresholds.warning) return 'warning';
    return 'critical';
  };

  const performanceLevel = getPerformanceLevel(numericValue, kpiInfo.thresholds);
  const interpretation = kpiInfo.interpretation[performanceLevel as keyof typeof kpiInfo.interpretation];

  const getStatusIcon = (level: string) => {
    switch (level) {
      case 'excellent': return CheckCircle;
      case 'good': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'critical': return AlertTriangle;
      default: return Info;
    }
  };

  const getStatusColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const StatusIcon = getStatusIcon(performanceLevel);
  const IconComponent = kpiInfo.icon;

  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const tooltipWidth = 320;
      
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: Math.max(16, Math.min(
          rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2,
          window.innerWidth - tooltipWidth - 16
        ))
      });
    }
  };

  const handleMouseEnter = () => {
    setIsVisible(true);
    updatePosition();
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible) {
      const handleScroll = () => updatePosition();
      const handleResize = () => updatePosition();
      
      window.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isVisible]);

  const tooltipContent = isVisible ? (
    <div 
      className="fixed p-4 bg-white border border-gray-200 shadow-xl rounded-xl z-[9999] max-w-sm"
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px`,
        width: '320px'
      }}
    >
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <IconComponent className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{kpiInfo.title}</h4>
              {niveau && (
                <p className="text-xs text-gray-500">{niveau}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-3">{kpiInfo.description}</p>

          {/* Valeur actuelle et statut */}
          <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-500">Valeur actuelle</p>
              <p className="font-bold text-gray-900">
                {kpiType === 'revenus' 
                  ? `${(numericValue / 1000000).toFixed(1)}M FCFA`
                  : kpiType === 'taux_reussite'
                  ? `${value}%`
                  : value
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`p-1 rounded-full ${getStatusColor(performanceLevel)}`}>
                <StatusIcon className="h-4 w-4" />
              </div>
              {trend && (
                <div className={`p-1 rounded-full ${
                  trend === 'up' ? 'bg-green-100' : 
                  trend === 'down' ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                  {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                  {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
                  {trend === 'stable' && <div className="w-4 h-4 bg-gray-400 rounded-full" />}
                </div>
              )}
            </div>
          </div>

          {/* Interprétation */}
          <div className="mb-3">
            <Badge 
              variant="outline" 
              className={`${getStatusColor(performanceLevel)} border-current mb-2`}
            >
              {performanceLevel === 'excellent' ? 'Excellent' :
               performanceLevel === 'good' ? 'Satisfaisant' :
               performanceLevel === 'warning' ? 'À surveiller' : 'Critique'}
            </Badge>
            <p className="text-sm text-gray-700">{interpretation}</p>
          </div>

          {/* Conseils (version courte) */}
          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="h-4 w-4 text-blue-500" />
              <p className="text-xs font-medium text-gray-900">Conseils :</p>
            </div>
            <ul className="text-xs text-gray-600 space-y-1">
              {kpiInfo.tips.slice(0, 2).map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
  ) : null;

  return (
    <div 
      className={`relative ${className}`}
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="cursor-help">
        {children}
      </div>
      
      {tooltipContent && createPortal(tooltipContent, document.body)}
    </div>
  );
});

KPITooltip.displayName = 'KPITooltip';

export default KPITooltip;
