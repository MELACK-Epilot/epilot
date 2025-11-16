/**
 * Composant pour afficher les KPI du Proviseur
 * Connecté aux données réelles via useProviseurModules
 * @module ProviseurKPICards
 */

import { Activity, TrendingUp, Eye, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { KPIData } from '../types/proviseur-modules.types';

interface ProviseurKPICardsProps {
  totalModules: number;
  activeModules: number;
  totalAccess: number;
  categoriesCount: number;
  lastAccessDate?: string | null;
  growthRate?: number;
}

export function ProviseurKPICards({
  totalModules,
  activeModules,
  totalAccess,
  categoriesCount,
  lastAccessDate,
  growthRate = 0,
}: ProviseurKPICardsProps) {
  // Formater la date de dernière activité
  const formatLastActivity = (date: string | null | undefined) => {
    if (!date) return 'Aucune activité';
    
    const activityDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - activityDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return 'À l\'instant';
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return activityDate.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const kpis: KPIData[] = [
    {
      title: 'Modules Actifs',
      value: activeModules,
      change: `${totalModules} au total`,
      trend: activeModules > 0 ? 'up' : 'neutral',
      icon: <Activity className="w-5 h-5" />,
      color: '#3B82F6',
    },
    {
      title: 'Accès Total',
      value: totalAccess,
      change: growthRate > 0 ? `+${growthRate}% ce mois` : 'Stable',
      trend: growthRate > 0 ? 'up' : growthRate < 0 ? 'down' : 'neutral',
      icon: <Eye className="w-5 h-5" />,
      color: '#10B981',
    },
    {
      title: 'Catégories',
      value: categoriesCount,
      change: 'Disponibles',
      trend: 'neutral',
      icon: <TrendingUp className="w-5 h-5" />,
      color: '#F59E0B',
    },
    {
      title: 'Dernière Activité',
      value: formatLastActivity(lastAccessDate),
      change: lastAccessDate ? 'Actif' : 'Inactif',
      trend: lastAccessDate ? 'up' : 'neutral',
      icon: <Calendar className="w-5 h-5" />,
      color: '#8B5CF6',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {kpis.map((kpi, index) => (
        <Card
          key={index}
          className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          style={{
            background: `linear-gradient(135deg, ${kpi.color}15 0%, ${kpi.color}05 100%)`,
          }}
        >
          {/* Cercle décoratif */}
          <div
            className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10"
            style={{ backgroundColor: kpi.color }}
          />

          <CardContent className="p-6 relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: `${kpi.color}20` }}
              >
                <div style={{ color: kpi.color }}>{kpi.icon}</div>
              </div>
              <div
                className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                  kpi.trend === 'up'
                    ? 'bg-green-100 text-green-700'
                    : kpi.trend === 'down'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {kpi.trend === 'up' && '↑'}
                {kpi.trend === 'down' && '↓'}
                {kpi.change}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{kpi.title}</p>
              <p className="text-3xl font-bold" style={{ color: kpi.color }}>
                {kpi.value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
