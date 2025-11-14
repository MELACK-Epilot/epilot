/**
 * Composant générique pour l'espace de travail d'un module
 * Reconnaît automatiquement le contexte (école + groupe) et charge les données filtrées
 * @module ModuleWorkspace
 */

import { useParams } from 'react-router-dom';
import { useEffect, Suspense } from 'react';
import { Package, School, Building2, User } from 'lucide-react';
import { useModuleWorkspace, useModuleWorkspaceActions } from '../contexts/ModuleWorkspaceProvider';
import { getModuleComponent, isModuleRegistered } from '../config/module-registry';

/**
 * Composant principal de l'espace de travail
 */
export function ModuleWorkspace() {
  const { moduleSlug } = useParams<{ moduleSlug: string }>();
  const { context, isLoading, error } = useModuleWorkspace();
  const { loadModuleData } = useModuleWorkspaceActions();

  // Charger les données du module
  useEffect(() => {
    if (context && moduleSlug) {
      loadModuleData(moduleSlug, context.schoolId);
    }
  }, [context, moduleSlug, loadModuleData]);

  // Affichage si pas de contexte
  if (!context) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-700">Chargement du contexte...</h2>
        </div>
      </div>
    );
  }

  // Affichage en cas d'erreur
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Erreur</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header avec contexte */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Titre du module */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {context.moduleName}
                </h1>
                <p className="text-sm text-gray-600">{context.categoryName}</p>
              </div>
            </div>

            {/* Informations contexte */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building2 className="w-4 h-4" />
                <span>Groupe: {context.schoolGroupId}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <School className="w-4 h-4" />
                <span>École: {context.schoolId}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span className="capitalize">{context.userRole}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu du module */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div>
            {/* ⭐ Chargement dynamique du module depuis le registre */}
            {(() => {
              if (!moduleSlug) {
                return (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                    <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      Module non spécifié
                    </h3>
                  </div>
                );
              }

              // Vérifier si le module est enregistré
              if (isModuleRegistered(moduleSlug)) {
                const ModuleComponent = getModuleComponent(moduleSlug);
                
                if (ModuleComponent) {
                  return (
                    <Suspense fallback={
                      <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                      </div>
                    }>
                      <ModuleComponent context={context} />
                    </Suspense>
                  );
                }
              }

              // Module non implémenté
              return (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Module en développement
                  </h3>
                  <p className="text-gray-600">
                    Le module <strong>{context.moduleName}</strong> (slug: <code>{moduleSlug}</code>) sera bientôt disponible.
                  </p>
                  <p className="text-sm text-gray-500 mt-4">
                    Pour activer ce module, ajoutez-le dans <code>module-registry.ts</code>
                  </p>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
