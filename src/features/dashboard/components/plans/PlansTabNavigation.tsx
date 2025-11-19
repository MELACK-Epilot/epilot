/**
 * Navigation par onglets de la page Plans
 * @module PlansTabNavigation
 */

import { Package, Users, BarChart3, Zap, TrendingUp } from 'lucide-react';

interface Tab {
  key: string;
  label: string;
  icon: any;
  description: string;
}

interface PlansTabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const PlansTabNavigation = ({ activeTab, onTabChange }: PlansTabNavigationProps) => {
  const tabs: Tab[] = [
    { key: 'overview', label: 'Vue d\'ensemble', icon: Package, description: 'Cartes des plans' },
    { key: 'subscriptions', label: 'Abonnements', icon: Users, description: 'Groupes actifs' },
    { key: 'analytics', label: 'Analytics IA', icon: BarChart3, description: 'Métriques avancées' },
    { key: 'optimization', label: 'Optimisation', icon: Zap, description: 'Recommandations IA' },
    { key: 'comparison', label: 'Comparaison', icon: TrendingUp, description: 'Tableau comparatif' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex items-center gap-2 bg-white rounded-xl p-2 shadow-sm border border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <div className="text-left">
              <div className="font-medium text-sm">{tab.label}</div>
              <div className={`text-xs ${activeTab === tab.key ? 'text-blue-100' : 'text-slate-400'}`}>
                {tab.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
