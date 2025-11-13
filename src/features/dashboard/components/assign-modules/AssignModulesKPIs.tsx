/**
 * Composant KPIs pour la page Assigner des Modules
 * Design harmonisé avec FinancesGroupe
 */

import { Users as UsersIcon, Package, Shield, Clock, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { AnimatedSection } from '@/components/ui/animated-section';

interface AssignModulesKPIsProps {
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalModules: number;
    usersWithModules: number;
  };
}

export function AssignModulesKPIs({ stats }: AssignModulesKPIsProps) {
  return (
    <AnimatedSection delay={0.05}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Utilisateurs */}
        <Card className="p-4 border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                  <UsersIcon className="h-5 w-5 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-700">Utilisateurs</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-2">{stats.totalUsers}</p>
              <div className="flex items-center gap-1.5">
                <div className="p-1 bg-green-100 rounded">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                </div>
                <p className="text-xs text-green-600 font-semibold">{stats.activeUsers} actifs</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Modules */}
        <Card className="p-4 border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2.5 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-700">Modules</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-2">{stats.totalModules}</p>
              <p className="text-xs text-gray-600 font-medium">Disponibles</p>
            </div>
          </div>
        </Card>

        {/* Permissions */}
        <Card className="p-4 border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-700">Permissions</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-2">{stats.usersWithModules}</p>
              <p className="text-xs text-gray-600 font-medium">
                {stats.totalUsers > 0 ? Math.round((stats.usersWithModules / stats.totalUsers) * 100) : 0}% assignées
              </p>
            </div>
          </div>
        </Card>

        {/* Dernière MAJ */}
        <Card className="p-4 border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-700">Dernière MAJ</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-2">
                {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
              </p>
              <p className="text-xs text-gray-600 font-medium">
                {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AnimatedSection>
  );
}
