/**
 * Widget adoption des modules
 * @module ModuleStatusWidget
 */

import { useState } from 'react';
import { Package, TrendingUp, TrendingDown, Download, RefreshCw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useModuleAdoption } from '../../hooks/useModuleAdoption';
import { useAuth } from '@/features/auth/store/auth.store';

const ModuleStatusWidget = () => {
  const [sortBy, setSortBy] = useState<'adoption' | 'trend' | 'users'>('adoption');
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  
  // Utiliser les données réelles depuis le hook
  const { data: modules, isLoading, refetch } = useModuleAdoption();
  
  // Rafraîchissement manuel
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };
  
  // Export CSV
  const handleExport = () => {
    if (!modules) return;
    
    const csv = [
      ['Module', 'Adoption (%)', 'Tendance (%)', 'Écoles', 'Utilisateurs Actifs', 'Dernière Activité'].join(','),
      ...modules.map(m => 
        [m.name, m.adoption, m.trend, m.schools, m.activeUsers, m.lastUpdate].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adoption-modules-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const sortedModules = [...(modules || [])].sort((a, b) => {
    if (sortBy === 'adoption') return b.adoption - a.adoption;
    if (sortBy === 'trend') return b.trend - a.trend;
    return b.activeUsers - a.activeUsers;
  });
  
  // Debug : Afficher les données de tri en développement
  if (import.meta.env.DEV && modules) {
    console.log('🔍 Tri actif:', sortBy);
    console.log('📊 Modules triés:', sortedModules.map(m => ({
      name: m.name,
      adoption: m.adoption,
      trend: m.trend,
      users: m.activeUsers
    })));
  }
  
  const averageAdoption = modules && modules.length > 0
    ? (modules.reduce((sum, m) => sum + m.adoption, 0) / modules.length).toFixed(0)
    : '0';
  
  // ⚠️ ATTENTION : Ne pas faire la somme car les users sont comptés plusieurs fois !
  // Un utilisateur peut avoir accès à PLUSIEURS modules
  // Donc afficher le MAX au lieu de la SOMME
  const totalUsers = modules && modules.length > 0
    ? Math.max(...modules.map(m => m.activeUsers))
    : 0;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-white rounded-lg border border-gray-200 p-4 h-full hover:border-[#E9C46A]/40 hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      {/* Gradient subtil */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#E9C46A]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Badge "Données réelles" */}
      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-[#2A9D8F]/10 rounded-full">
        <Sparkles className="h-2.5 w-2.5 text-[#2A9D8F]" />
        <span className="text-[9px] font-semibold text-[#2A9D8F] uppercase tracking-wide">Live</span>
      </div>
      
      {/* Header */}
      <div className="relative flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#1D3557] flex items-center gap-2">
          <div className="p-1.5 bg-[#E9C46A]/10 rounded group-hover:scale-110 group-hover:bg-[#E9C46A]/20 transition-all duration-300">
            <Package className="h-3.5 w-3.5 text-[#E9C46A] group-hover:rotate-12 transition-transform duration-300" />
          </div>
          {isSuperAdmin ? 'Adoption Modules' : 'Modules Actifs'}
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs hover:bg-[#E9C46A]/10"
            onClick={handleExport}
            disabled={!modules || modules.length === 0}
            title="Exporter en CSV"
          >
            <Download className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs hover:bg-[#2A9D8F]/10"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Rafraîchir"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-7 w-20 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-100 rounded animate-pulse" />
              <div className="h-2 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Stats résumé */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="relative grid grid-cols-2 gap-2 mb-3"
          >
            <div className="text-center p-2.5 bg-gradient-to-br from-[#E9C46A]/10 to-[#E9C46A]/5 rounded-lg border border-[#E9C46A]/20 hover:shadow-sm transition-shadow">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">
                {isSuperAdmin ? 'Moyenne' : 'Modules'}
              </p>
              <p className="text-lg font-bold text-[#1D3557] leading-none mt-1">
                {isSuperAdmin ? `${averageAdoption}%` : modules?.length || 0}
              </p>
            </div>
            <div className="text-center p-2.5 bg-gradient-to-br from-[#2A9D8F]/10 to-[#2A9D8F]/5 rounded-lg border border-[#2A9D8F]/20 hover:shadow-sm transition-shadow">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Utilisateurs</p>
              <p className="text-lg font-bold text-[#1D3557] leading-none mt-1">{totalUsers.toLocaleString()}</p>
            </div>
          </motion.div>
      
          {/* Tri */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="relative flex items-center gap-2 mb-3"
          >
            <button
              onClick={() => setSortBy('adoption')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                sortBy === 'adoption' 
                  ? 'bg-[#E9C46A] text-white shadow-md scale-105' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Adoption
            </button>
            <button
              onClick={() => setSortBy('trend')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                sortBy === 'trend' 
                  ? 'bg-[#2A9D8F] text-white shadow-md scale-105' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tendance
            </button>
            <button
              onClick={() => setSortBy('users')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                sortBy === 'users' 
                  ? 'bg-[#1D3557] text-white shadow-md scale-105' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Utilisateurs
            </button>
          </motion.div>
          
          {/* Indicateur de tri actif */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-gray-500 mb-2 flex items-center gap-2"
          >
            <span>Trié par :</span>
            <span className="font-semibold text-[#1D3557]">
              {sortBy === 'adoption' && '📊 Adoption'}
              {sortBy === 'trend' && '📈 Tendance'}
              {sortBy === 'users' && '👥 Utilisateurs'}
            </span>
            <span className="text-gray-400">↓ Décroissant</span>
          </motion.div>

          <div className="relative space-y-2">
            <AnimatePresence mode="popLayout">
              {sortedModules.map((module, index) => {
                const isPositive = module.trend >= 0;
                const TrendIcon = isPositive ? TrendingUp : TrendingDown;
                const isSelected = selectedModule === module.name;
                
                return (
                <motion.div
                  key={module.name}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ 
                    layout: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                    y: { duration: 0.2, delay: index * 0.05 }
                  }}
                  className={`space-y-1.5 cursor-pointer p-2.5 rounded-lg -mx-2 transition-all duration-200 ${
                    isSelected 
                      ? 'bg-gradient-to-r from-[#E9C46A]/10 to-transparent border border-[#E9C46A]/30 shadow-sm' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedModule(isSelected ? null : module.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs font-medium text-gray-900 truncate">{module.name}</span>
                      {/* Afficher la valeur selon le tri actif */}
                      <span className="text-[10px] text-gray-500">
                        {sortBy === 'adoption' && `(${module.adoption}%)`}
                        {sortBy === 'trend' && (
                          <span className={module.trend >= 0 ? 'text-green-600' : 'text-red-600'}>
                            ({module.trend > 0 ? '+' : ''}{module.trend}%)
                          </span>
                        )}
                        {sortBy === 'users' && `(${module.activeUsers} users)`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#1D3557]">{module.adoption}%</span>
                      <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded ${
                        isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                      }`}>
                        <TrendIcon className="h-2.5 w-2.5" />
                        <span className="text-[10px] font-medium">{Math.abs(module.trend)}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${module.adoption}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
                      className="absolute inset-y-0 left-0 rounded-full shadow-sm"
                      style={{
                        background: `linear-gradient(90deg, ${
                          module.adoption >= 80
                            ? '#2A9D8F'
                            : module.adoption >= 60
                            ? '#E9C46A'
                            : '#E63946'
                        }, ${
                          module.adoption >= 80
                            ? '#1d7a6f'
                            : module.adoption >= 60
                            ? '#d4a94a'
                            : '#C72030'
                        })`,
                      }}
                    />
                    {/* Effet brillant */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
            
                  {/* Détails expandables */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-2 pt-2 border-t border-[#E9C46A]/20"
                      >
                        <div className={`grid ${isSuperAdmin ? 'grid-cols-3' : 'grid-cols-2'} gap-2 text-xs`}>
                          {isSuperAdmin && (
                            <div className="text-center p-2 bg-white rounded-lg border border-gray-100">
                              <p className="text-gray-500 text-[10px] uppercase tracking-wide">Groupes</p>
                              <p className="font-bold text-[#1D3557] text-sm mt-0.5">{module.schools}</p>
                            </div>
                          )}
                          <div className="text-center p-2 bg-white rounded-lg border border-gray-100">
                            <p className="text-gray-500 text-[10px] uppercase tracking-wide">Users</p>
                            <p className="font-bold text-[#2A9D8F] text-sm mt-0.5">{module.activeUsers}</p>
                          </div>
                          <div className="text-center p-2 bg-white rounded-lg border border-gray-100">
                            <p className="text-gray-500 text-[10px] uppercase tracking-wide">Activité</p>
                            <p className="font-bold text-[#E9C46A] text-sm mt-0.5">{module.lastUpdate}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </>
      )}

    </motion.div>
  );
};

export default ModuleStatusWidget;
