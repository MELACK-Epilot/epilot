/**
 * Hook moderne pour la gestion des modules - React 19
 * Utilise les dernières optimisations et patterns
 */

import { useState, useCallback, useMemo, startTransition } from 'react';

// Types modernes avec const assertions
export interface Module {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: 'pedagogique' | 'administratif' | 'communication' | 'evaluation';
  readonly status: 'active' | 'inactive' | 'maintenance';
  readonly lastUpdated: Date;
  readonly permissions: readonly string[];
}

interface ModulesState {
  readonly modules: readonly Module[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly selectedCategory: string | null;
}

// Hook avec optimisations React 19
export function useModules() {
  const [state, setState] = useState<ModulesState>({
    modules: [],
    isLoading: false,
    error: null,
    selectedCategory: null,
  });

  // Données simulées avec typage strict
  const mockModules: readonly Module[] = useMemo(() => [
    {
      id: 'mod-001',
      name: 'Gestion des Notes',
      description: 'Module pour saisir et gérer les notes des élèves',
      category: 'evaluation',
      status: 'active',
      lastUpdated: new Date('2024-11-10'),
      permissions: ['read_grades', 'write_grades', 'export_grades'],
    },
    {
      id: 'mod-002', 
      name: 'Planning Scolaire',
      description: 'Gestion des emplois du temps et planification',
      category: 'administratif',
      status: 'active',
      lastUpdated: new Date('2024-11-08'),
      permissions: ['read_schedule', 'write_schedule'],
    },
    {
      id: 'mod-003',
      name: 'Communication Parents',
      description: 'Système de messagerie avec les parents d\'élèves',
      category: 'communication',
      status: 'active',
      lastUpdated: new Date('2024-11-12'),
      permissions: ['send_messages', 'read_messages'],
    },
    {
      id: 'mod-004',
      name: 'Ressources Pédagogiques',
      description: 'Bibliothèque de ressources et supports de cours',
      category: 'pedagogique',
      status: 'maintenance',
      lastUpdated: new Date('2024-11-05'),
      permissions: ['read_resources', 'upload_resources'],
    },
    {
      id: 'mod-005',
      name: 'Suivi Disciplinaire',
      description: 'Gestion des incidents et sanctions disciplinaires',
      category: 'administratif',
      status: 'active',
      lastUpdated: new Date('2024-11-09'),
      permissions: ['read_discipline', 'write_discipline'],
    },
  ] as const, []);

  // Fonction de chargement avec startTransition
  const loadModules = useCallback(() => {
    startTransition(() => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Simulation d'un appel API
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          modules: mockModules,
          isLoading: false,
        }));
      }, 500);
    });
  }, [mockModules]);

  // Filtrage par catégorie avec useMemo
  const filteredModules = useMemo(() => {
    if (!state.selectedCategory) return state.modules;
    return state.modules.filter(module => module.category === state.selectedCategory);
  }, [state.modules, state.selectedCategory]);

  // Fonction de filtrage avec startTransition
  const setSelectedCategory = useCallback((category: string | null) => {
    startTransition(() => {
      setState(prev => ({ ...prev, selectedCategory: category }));
    });
  }, []);

  // Statistiques calculées
  const stats = useMemo(() => {
    const total = state.modules.length;
    const active = state.modules.filter(m => m.status === 'active').length;
    const maintenance = state.modules.filter(m => m.status === 'maintenance').length;
    
    return Object.freeze({
      total,
      active,
      maintenance,
      categories: Object.freeze({
        pedagogique: state.modules.filter(m => m.category === 'pedagogique').length,
        administratif: state.modules.filter(m => m.category === 'administratif').length,
        communication: state.modules.filter(m => m.category === 'communication').length,
        evaluation: state.modules.filter(m => m.category === 'evaluation').length,
      }),
    });
  }, [state.modules]);

  // API publique immutable
  return useMemo(() => Object.freeze({
    // État
    modules: filteredModules,
    isLoading: state.isLoading,
    error: state.error,
    selectedCategory: state.selectedCategory,
    stats,
    
    // Actions
    loadModules,
    setSelectedCategory,
    
    // Utilitaires
    getModuleById: (id: string) => state.modules.find(m => m.id === id),
    getModulesByCategory: (category: Module['category']) => 
      state.modules.filter(m => m.category === category),
  }), [
    filteredModules,
    state.isLoading,
    state.error,
    state.selectedCategory,
    stats,
    loadModules,
    setSelectedCategory,
    state.modules,
  ]);
}
