/**
 * Page Mes Modules - PROVISEUR OPTIMISÉE
 * Utilise le nouveau système de permissions avec user_modules
 * Affiche uniquement les modules assignés au Proviseur
 */

import { useState, useEffect } from 'react';
import { Package, AlertCircle, RefreshCw, CheckCircle2, Clock, Settings } from 'lucide-react';
import { useAuth } from '@/features/auth/store/auth.store';
import { usePermissions } from '@/providers/PermissionsProvider';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ModuleInfo {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  category_name: string;
  is_enabled: boolean;
  assigned_at: string;
  last_accessed_at?: string;
  access_count: number;
}

export const MyModulesProviseurOptimized = () => {
  const { user } = useAuth();
  const { refreshModules } = usePermissions();
  const [debugInfo, setDebugInfo] = useState<string>('Initialisation du système...');
  const [userModules, setUserModules] = useState<ModuleInfo[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fonction pour assigner automatiquement les modules au Proviseur
  const assignModulesAutomatically = async () => {
    if (!user?.id) return;

    setIsAssigning(true);
    setDebugInfo('🔄 Assignation automatique des modules...');

    try {
      // Appeler la fonction SQL d'assignation
      const { data: result, error } = await (supabase as any).rpc('assign_modules_by_role_compatible', {
        p_user_id: user.id,
        p_user_role: user.role || 'proviseur',
        p_school_group_id: user.schoolGroupId
      });

      if (error) {
        setDebugInfo(`❌ Erreur assignation: ${error.message}`);
        return;
      }

      if (result?.success) {
        setDebugInfo(`✅ ${result.message}`);
        // Rafraîchir les modules
        await refreshModules();
        await loadUserModules();
      } else {
        setDebugInfo(`⚠️ Assignation échouée: ${result?.error || 'Erreur inconnue'}`);
      }
    } catch (error: any) {
      setDebugInfo(`❌ Erreur fatale: ${error.message}`);
    } finally {
      setIsAssigning(false);
    }
  };

  // Charger les modules utilisateur depuis user_modules
  const loadUserModules = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setDebugInfo('🔍 Chargement des modules assignés...');

      const { data: userModulesData, error } = await supabase
        .from('user_modules')
        .select(`
          id,
          module_id,
          is_enabled,
          assigned_at,
          last_accessed_at,
          access_count,
          modules!inner(
            id,
            name,
            slug,
            description,
            icon,
            color,
            status,
            business_categories(
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('is_enabled', true)
        .eq('modules.status', 'active')
        .order('modules(name)', { ascending: true });

      if (error) {
        setDebugInfo(`❌ Erreur chargement: ${error.message}`);
        return;
      }

      const mappedModules: ModuleInfo[] = (userModulesData || []).map((um: any) => ({
        id: um.modules.id,
        name: um.modules.name,
        slug: um.modules.slug,
        description: um.modules.description,
        icon: um.modules.icon || '📦',
        color: um.modules.color || '#2A9D8F',
        category_name: um.modules.business_categories?.name || 'Général',
        is_enabled: um.is_enabled,
        assigned_at: um.assigned_at,
        last_accessed_at: um.last_accessed_at,
        access_count: um.access_count || 0,
      }));

      setUserModules(mappedModules);
      setDebugInfo(`✅ ${mappedModules.length} modules chargés avec succès`);

    } catch (error: any) {
      setDebugInfo(`❌ Erreur fatale: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadUserModules();
    }
  }, [user?.id]);

  // Fonction pour tracker l'accès à un module
  const trackModuleAccess = async (moduleSlug: string) => {
    if (!user?.id) return;

    try {
      const moduleId = userModules.find(m => m.slug === moduleSlug)?.id;
      if (!moduleId) return;
      
      await (supabase as any).rpc('track_module_access', {
        p_user_id: user.id,
        p_module_id: moduleId
      });
      
      // Mettre à jour localement
      setUserModules(prev => prev.map(m => 
        m.slug === moduleSlug 
          ? { ...m, access_count: m.access_count + 1, last_accessed_at: new Date().toISOString() }
          : m
      ));
    } catch (error) {
      console.error('Erreur tracking:', error);
    }
  };

  return (
    <div className="space-y-6 p-6" data-testid="proviseur-interface">
      {/* Header Proviseur */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-600" />
              Mes Modules - Proviseur
            </h1>
            <p className="text-gray-600 mt-1">
              Gestion des modules éducatifs et administratifs
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadUserModules} disabled={isLoading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button onClick={assignModulesAutomatically} disabled={isAssigning} className="bg-blue-600 hover:bg-blue-700">
              <Settings className={`h-4 w-4 mr-2 ${isAssigning ? 'animate-spin' : ''}`} />
              {isAssigning ? 'Assignation...' : 'Assigner Modules'}
            </Button>
          </div>
        </div>
        
        <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm">
          {debugInfo}
        </div>
      </Card>

      {/* Informations Utilisateur */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          Informations Utilisateur
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-semibold">{user?.email || 'Non connecté'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Rôle</p>
            <Badge className="bg-blue-100 text-blue-800">{user?.role || 'Aucun'}</Badge>
          </div>
          <div>
            <p className="text-sm text-gray-600">Modules Assignés</p>
            <p className="text-2xl font-bold text-blue-600">{userModules.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Statut</p>
            <Badge variant={isLoading ? 'secondary' : 'default'}>
              {isLoading ? 'Chargement...' : 'Actif'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Modules du Proviseur */}
      {userModules.length > 0 ? (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Modules Disponibles ({userModules.length})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userModules.map((module) => (
                <Card 
                  key={module.id} 
                  className="p-4 hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4"
                  style={{ borderLeftColor: module.color }}
                  onClick={() => trackModuleAccess(module.slug)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-lg font-semibold"
                      style={{ backgroundColor: module.color }}
                    >
                      {module.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {module.name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {module.description || 'Module éducatif'}
                      </p>
                      
                      <div className="flex flex-wrap gap-1 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {module.category_name}
                        </Badge>
                        <Badge 
                          variant={module.is_enabled ? 'default' : 'secondary'} 
                          className="text-xs"
                        >
                          {module.is_enabled ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {module.access_count} accès
                        </div>
                        {module.last_accessed_at && (
                          <div>
                            Dernier: {new Date(module.last_accessed_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          {/* Modules par Catégorie */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Répartition par Catégorie</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(
                userModules.reduce((acc, module) => {
                  acc[module.category_name] = (acc[module.category_name] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([category, count]) => (
                <div key={category} className="text-center p-3 bg-gray-50 rounded">
                  <p className="text-2xl font-bold text-blue-600">{count}</p>
                  <p className="text-sm text-gray-600">{category}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        !isLoading && (
          <Card className="p-12 text-center">
            <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucun Module Assigné
            </h3>
            <p className="text-gray-600 mb-6">
              En tant que Proviseur, vous devriez avoir accès à 10 modules par défaut.
            </p>
            
            <div className="bg-orange-50 p-4 rounded-lg mb-6 text-left">
              <h4 className="font-semibold text-orange-800 mb-2">Modules Proviseur Attendus :</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-orange-700">
                <div>• Dashboard</div>
                <div>• Classes</div>
                <div>• Élèves</div>
                <div>• Personnel</div>
                <div>• Rapports</div>
                <div>• Communication</div>
                <div>• Emploi du temps</div>
                <div>• Notes</div>
                <div>• Absences</div>
                <div>• Discipline</div>
              </div>
            </div>

            <Button 
              onClick={assignModulesAutomatically} 
              disabled={isAssigning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Settings className={`h-4 w-4 mr-2 ${isAssigning ? 'animate-spin' : ''}`} />
              {isAssigning ? 'Assignation en cours...' : 'Assigner Mes Modules'}
            </Button>
          </Card>
        )
      )}

      {/* Guide d'Actions */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-3 text-blue-800">🎯 Actions Recommandées</h3>
        <div className="space-y-2 text-sm text-blue-700">
          <p><strong>1. Exécuter le SQL :</strong> Copier le contenu de assign_modules_by_role_compatible.sql dans Supabase</p>
          <p><strong>2. Assigner les modules :</strong> Cliquer sur "Assigner Mes Modules" ci-dessus</p>
          <p><strong>3. Vérifier :</strong> Actualiser la page pour voir les 10 modules du Proviseur</p>
          <p><strong>4. Tester :</strong> Cliquer sur les modules pour tracker l'utilisation</p>
        </div>
      </Card>
    </div>
  );
};
