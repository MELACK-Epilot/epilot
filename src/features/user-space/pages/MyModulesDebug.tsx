/**
 * Page Mes Modules - VERSION DEBUG
 * Affiche tout ce qui se passe pour diagnostiquer
 */

import { useState, useEffect } from 'react';
import { Package, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/features/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const MyModulesDebug = () => {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [modules, setModules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const loadData = async () => {
    setIsLoading(true);
    setLogs([]);
    
    try {
      addLog('🔍 Début du diagnostic');
      addLog(`👤 Utilisateur: ${user?.email} (${user?.role})`);
      addLog(`🏫 Groupe: ${user?.schoolGroupId}`);

      if (!user?.schoolGroupId) {
        addLog('❌ ERREUR: Pas de schoolGroupId');
        setDebugInfo({ error: 'Pas de schoolGroupId' });
        return;
      }

      // 1. Vérifier group_module_configs
      addLog('📦 Vérification group_module_configs...');
      const { data: configs, error: configError } = await supabase
        .from('group_module_configs')
        .select('*')
        .eq('school_group_id', user.schoolGroupId);

      if (configError) {
        addLog(`❌ Erreur configs: ${configError.message}`);
        throw configError;
      }

      addLog(`✅ Configs trouvées: ${configs?.length || 0}`);

      // 2. Vérifier modules
      addLog('📚 Vérification modules...');
      const { data: allModules, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .eq('status', 'active');

      if (modulesError) {
        addLog(`❌ Erreur modules: ${modulesError.message}`);
        throw modulesError;
      }

      addLog(`✅ Modules actifs: ${allModules?.length || 0}`);

      // 3. Vérifier catégories
      addLog('📂 Vérification catégories...');
      const { data: categories, error: catError } = await supabase
        .from('business_categories')
        .select('*')
        .eq('status', 'active');

      if (catError) {
        addLog(`❌ Erreur catégories: ${catError.message}`);
      } else {
        addLog(`✅ Catégories actives: ${categories?.length || 0}`);
      }

      // 4. Jointure manuelle
      addLog('🔗 Jointure manuelle...');
      const modulesList = (configs || [])
        .map(config => {
          const module = allModules?.find(m => m.id === config.module_id);
          if (!module) {
            addLog(`⚠️ Module ${config.module_id} non trouvé`);
            return null;
          }
          
          const category = categories?.find(c => c.id === module.category_id);
          
          return {
            ...module,
            is_enabled: config.is_enabled,
            category: category || null,
          };
        })
        .filter(Boolean);

      addLog(`✅ Modules finaux: ${modulesList.length}`);

      setModules(modulesList);
      setDebugInfo({
        user: {
          email: user.email,
          role: user.role,
          schoolGroupId: user.schoolGroupId,
        },
        configs: configs?.length || 0,
        modules: allModules?.length || 0,
        categories: categories?.length || 0,
        final: modulesList.length,
      });

    } catch (error: any) {
      addLog(`❌ ERREUR FATALE: ${error.message}`);
      setDebugInfo({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.schoolGroupId) {
      loadData();
    }
  }, [user?.schoolGroupId]);

  return (
    <div className="space-y-6 p-6">
      {/* Header Debug */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-6 w-6 text-yellow-600" />
            DEBUG - Mes Modules Admin Groupe
          </h1>
          <Button onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Recharger
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Utilisateur</p>
            <p className="font-semibold">{user?.email || 'Non connecté'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Rôle</p>
            <Badge variant="outline">{user?.role || 'Aucun'}</Badge>
          </div>
          <div>
            <p className="text-sm text-gray-600">Groupe ID</p>
            <p className="font-mono text-xs">{user?.schoolGroupId || 'Aucun'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Statut</p>
            <Badge variant={isLoading ? 'secondary' : 'default'}>
              {isLoading ? 'Chargement...' : 'Prêt'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Statistiques Debug */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-blue-50">
          <h3 className="font-semibold text-blue-900">Configs</h3>
          <p className="text-2xl font-bold text-blue-700">{debugInfo.configs || 0}</p>
        </Card>
        <Card className="p-4 bg-green-50">
          <h3 className="font-semibold text-green-900">Modules DB</h3>
          <p className="text-2xl font-bold text-green-700">{debugInfo.modules || 0}</p>
        </Card>
        <Card className="p-4 bg-purple-50">
          <h3 className="font-semibold text-purple-900">Catégories</h3>
          <p className="text-2xl font-bold text-purple-700">{debugInfo.categories || 0}</p>
        </Card>
        <Card className="p-4 bg-orange-50">
          <h3 className="font-semibold text-orange-900">Final</h3>
          <p className="text-2xl font-bold text-orange-700">{debugInfo.final || 0}</p>
        </Card>
      </div>

      {/* Logs */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">📋 Logs de Debug</h3>
        <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-60 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
          {logs.length === 0 && <div>Aucun log pour le moment...</div>}
        </div>
      </Card>

      {/* Erreur */}
      {debugInfo.error && (
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Erreur Détectée</h3>
              <p className="text-red-700">{debugInfo.error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Modules */}
      {modules.length > 0 ? (
        <div>
          <h3 className="text-lg font-semibold mb-4">📦 Modules Trouvés ({modules.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((module: any) => (
              <Card key={module.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg"
                    style={{ backgroundColor: module.color || '#2A9D8F' }}
                  >
                    {module.icon || '📦'}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{module.name}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{module.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={module.is_enabled ? 'default' : 'secondary'}>
                        {module.is_enabled ? 'Actif' : 'Inactif'}
                      </Badge>
                      {module.category && (
                        <Badge variant="outline" className="text-xs">
                          {module.category.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        !isLoading && (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun Module Trouvé</h3>
            <p className="text-gray-600 mb-4">
              Vérifiez les logs ci-dessus pour identifier le problème
            </p>
            <Button onClick={loadData}>
              Réessayer
            </Button>
          </Card>
        )
      )}
    </div>
  );
};
