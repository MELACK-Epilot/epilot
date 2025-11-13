/**
 * Interface Debug Ultra-Simple - Sans erreurs TypeScript
 */

import { useState, useEffect } from 'react';
import { Package, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/features/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const MyModulesDebugSimple = () => {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<string>('Initialisation...');
  const [modules, setModules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    setDebugInfo('🔍 Début du diagnostic...');
    
    try {
      if (!user?.schoolGroupId) {
        setDebugInfo('❌ ERREUR: Pas de schoolGroupId dans user');
        setIsLoading(false);
        return;
      }

      setDebugInfo(`✅ User trouvé: ${user.email} (${user.role}) - Groupe: ${user.schoolGroupId}`);

      // Test simple : récupérer group_module_configs
      const { data: configs, error: configError } = await supabase
        .from('group_module_configs')
        .select('*')
        .eq('school_group_id', user.schoolGroupId);

      if (configError) {
        setDebugInfo(`❌ Erreur group_module_configs: ${configError.message}`);
        setIsLoading(false);
        return;
      }

      setDebugInfo(`✅ Configs trouvées: ${configs?.length || 0}`);

      if (!configs || configs.length === 0) {
        setDebugInfo('⚠️ PROBLÈME: Aucune configuration trouvée dans group_module_configs');
        setIsLoading(false);
        return;
      }

      // Test simple : récupérer modules
      const { data: allModules, error: modulesError } = await supabase
        .from('modules')
        .select('*');

      if (modulesError) {
        setDebugInfo(`❌ Erreur modules: ${modulesError.message}`);
        setIsLoading(false);
        return;
      }

      setDebugInfo(`✅ Modules DB: ${allModules?.length || 0} | Configs: ${configs.length}`);

      // Jointure manuelle simple
      const modulesList = configs
        .map((config: any) => {
          const module = allModules?.find((m: any) => m.id === config.module_id);
          if (!module) return null;
          
          return {
            id: module.id,
            name: module.name,
            description: module.description,
            icon: module.icon || '📦',
            color: module.color || '#2A9D8F',
            is_enabled: config.is_enabled,
            status: module.status,
          };
        })
        .filter(Boolean);

      setModules(modulesList);
      setDebugInfo(`🎯 RÉSULTAT FINAL: ${modulesList.length} modules traités`);

    } catch (error: any) {
      setDebugInfo(`❌ ERREUR FATALE: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.schoolGroupId]);

  return (
    <div className="space-y-6 p-6">
      {/* Header Debug */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            🔧 DEBUG SIMPLE - Mes Modules
          </h1>
          <Button onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Recharger
          </Button>
        </div>
        
        <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm">
          {debugInfo}
        </div>
      </Card>

      {/* Infos Utilisateur */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">👤 Informations Utilisateur</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-semibold">{user?.email || 'Non connecté'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Rôle</p>
            <Badge variant="outline">{user?.role || 'Aucun'}</Badge>
          </div>
          <div>
            <p className="text-sm text-gray-600">School Group ID</p>
            <p className="font-mono text-xs break-all">{user?.schoolGroupId || 'Aucun'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Statut</p>
            <Badge variant={isLoading ? 'secondary' : 'default'}>
              {isLoading ? 'Chargement...' : 'Prêt'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Résultats */}
      {modules.length > 0 ? (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">📦 Modules Trouvés ({modules.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules.slice(0, 6).map((module: any) => (
              <div key={module.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                <div
                  className="w-8 h-8 rounded flex items-center justify-center text-white text-sm"
                  style={{ backgroundColor: module.color }}
                >
                  {module.icon}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{module.name}</p>
                  <div className="flex gap-2">
                    <Badge variant={module.is_enabled ? 'default' : 'secondary'} className="text-xs">
                      {module.is_enabled ? 'Actif' : 'Inactif'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {module.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {modules.length > 6 && (
            <p className="text-center text-gray-500 mt-3">
              ... et {modules.length - 6} autres modules
            </p>
          )}
        </Card>
      ) : (
        !isLoading && (
          <Card className="p-12 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun Module Trouvé
            </h3>
            <p className="text-gray-600 mb-4">
              Vérifiez le diagnostic ci-dessus pour identifier le problème
            </p>
            <div className="space-y-2 text-sm text-left bg-gray-50 p-4 rounded">
              <p><strong>Solutions possibles :</strong></p>
              <p>1. Exécuter le script SQL : FORCE_ASSIGNATION_MODULES.sql</p>
              <p>2. Vérifier que l'utilisateur a bien le rôle 'admin_groupe'</p>
              <p>3. Vérifier que le groupe a un plan assigné</p>
              <p>4. Vérifier que des modules existent dans la base</p>
            </div>
          </Card>
        )
      )}

      {/* Actions */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">🔧 Actions de Diagnostic</h3>
        <div className="space-y-2 text-sm">
          <p><strong>Étape 1 :</strong> Exécuter DEBUG_URGENT_ADMIN_GROUPE.sql dans Supabase</p>
          <p><strong>Étape 2 :</strong> Si aucune donnée, exécuter FORCE_ASSIGNATION_MODULES.sql</p>
          <p><strong>Étape 3 :</strong> Recharger cette page</p>
        </div>
      </Card>
    </div>
  );
};
