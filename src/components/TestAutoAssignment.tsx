/**
 * Composant de test pour valider le système automatique d'assignation
 * Permet de tester en temps réel les assignations/révocations
 * @module TestAutoAssignment
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAutoAssignment } from '@/providers/AutoAssignmentProvider';
import { RefreshCw, Plus, Minus, Users, Clock } from 'lucide-react';

export const TestAutoAssignment = () => {
  const {
    users,
    availableModules,
    isLoading,
    error,
    lastSyncAt,
    assignModule,
    revokeModule,
    getAssignmentStats
  } = useAutoAssignment();

  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  const stats = getAssignmentStats();

  const handleAssignModule = async () => {
    if (!selectedUserId || !selectedModuleId) return;
    
    setIsAssigning(true);
    try {
      await assignModule(selectedUserId, selectedModuleId);
      console.log('✅ Module assigné avec succès');
    } catch (error) {
      console.error('❌ Erreur assignation:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRevokeModule = async (userId: string, moduleId: string) => {
    try {
      await revokeModule(userId, moduleId);
      console.log('✅ Module révoqué avec succès');
    } catch (error) {
      console.error('❌ Erreur révocation:', error);
    }
  };

  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="text-red-800">
          <h3 className="font-semibold mb-2">Erreur du système automatique</h3>
          <p className="text-sm">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header avec statut */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              🚀 Test Système Automatique
            </h1>
            <p className="text-gray-600 mt-1">
              Validation temps réel des assignations de modules
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isLoading ? 'secondary' : 'default'}>
              {isLoading ? 'Synchronisation...' : 'Temps réel actif'}
            </Badge>
            {lastSyncAt && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {new Date(lastSyncAt).toLocaleTimeString()}
              </Badge>
            )}
          </div>
        </div>

        {/* Statistiques temps réel */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-white rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
            <div className="text-sm text-gray-600">Utilisateurs</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.totalModules}</div>
            <div className="text-sm text-gray-600">Modules disponibles</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.totalAssignments}</div>
            <div className="text-sm text-gray-600">Assignations totales</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{stats.usersWithModules}</div>
            <div className="text-sm text-gray-600">Utilisateurs avec modules</div>
          </div>
        </div>
      </Card>

      {/* Interface de test */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel d'assignation */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-green-600" />
            Tester l'assignation
          </h3>
          
          <div className="space-y-4">
            {/* Sélection utilisateur */}
            <div>
              <label className="block text-sm font-medium mb-2">Utilisateur :</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Sélectionner un utilisateur</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.role}) - {user.assignedModulesCount} modules
                  </option>
                ))}
              </select>
            </div>

            {/* Sélection module */}
            <div>
              <label className="block text-sm font-medium mb-2">Module :</label>
              <select
                value={selectedModuleId}
                onChange={(e) => setSelectedModuleId(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Sélectionner un module</option>
                {availableModules.map(module => (
                  <option key={module.id} value={module.id}>
                    {module.name} ({module.category_name})
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={handleAssignModule}
              disabled={!selectedUserId || !selectedModuleId || isAssigning}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isAssigning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Assignation en cours...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Assigner le module
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Liste des utilisateurs avec modules */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Utilisateurs et leurs modules
          </h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {users.map(user => (
              <div key={user.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium">{user.firstName} {user.lastName}</div>
                    <div className="text-sm text-gray-600">{user.role}</div>
                  </div>
                  <Badge variant="outline">
                    {user.assignedModulesCount} modules
                  </Badge>
                </div>
                
                {user.assignedModules.length > 0 && (
                  <div className="space-y-1">
                    {user.assignedModules.map(module => (
                      <div key={module.id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                        <span>{module.module_name}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRevokeModule(user.id, module.module_id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Instructions de test */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-3 text-blue-800">🧪 Instructions de test</h3>
        <div className="space-y-2 text-sm text-blue-700">
          <p><strong>1. Test d'assignation :</strong> Sélectionner un utilisateur et un module, puis cliquer "Assigner"</p>
          <p><strong>2. Vérification temps réel :</strong> Le module doit apparaître instantanément dans la liste</p>
          <p><strong>3. Test de révocation :</strong> Cliquer sur le bouton "-" à côté d'un module assigné</p>
          <p><strong>4. Vérification temps réel :</strong> Le module doit disparaître instantanément</p>
          <p><strong>5. Test multi-onglets :</strong> Ouvrir cette page dans 2 onglets et tester les changements</p>
        </div>
      </Card>
    </div>
  );
};
