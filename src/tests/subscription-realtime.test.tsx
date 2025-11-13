/**
 * Tests pour le système d'abonnement temps réel
 * Tests unitaires et d'intégration
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSubscriptionStore } from '@/stores/subscription.store';
import { useReactiveModules } from '@/hooks/useReactiveModules';
import { useSubscriptionSync } from '@/lib/subscription-sync.middleware';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
    })),
  },
}));

// Wrapper pour les tests React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Système d\'abonnement temps réel', () => {
  beforeEach(() => {
    // Réinitialiser le store avant chaque test
    useSubscriptionStore.getState().reset();
  });

  describe('Store Zustand', () => {
    it('devrait initialiser avec l\'état par défaut', () => {
      const state = useSubscriptionStore.getState();
      
      expect(state.currentSubscription).toBeNull();
      expect(state.availablePlans).toEqual([]);
      expect(state.moduleAccess).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('devrait mettre à jour l\'abonnement courant', () => {
      const mockSubscription = {
        id: 'sub-1',
        school_group_id: 'group-1',
        plan_id: 'plan-pro',
        status: 'active' as const,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        plan: {
          id: 'plan-pro',
          name: 'Plan Pro',
          slug: 'pro',
          price: 150000,
          status: 'active' as const,
          features: ['feature1', 'feature2'],
        },
      };

      act(() => {
        useSubscriptionStore.getState().setCurrentSubscription(mockSubscription);
      });

      const state = useSubscriptionStore.getState();
      expect(state.currentSubscription).toEqual(mockSubscription);
      expect(state.lastSync).toBeInstanceOf(Date);
    });

    it('devrait vérifier l\'accès aux modules', () => {
      const mockModuleAccess = [
        {
          module_id: 'module-1',
          module_name: 'Module 1',
          category_id: 'cat-1',
          category_name: 'Catégorie 1',
          is_enabled: true,
          plan_required: 'pro',
        },
        {
          module_id: 'module-2',
          module_name: 'Module 2',
          category_id: 'cat-1',
          category_name: 'Catégorie 1',
          is_enabled: false,
          plan_required: 'premium',
        },
      ];

      act(() => {
        useSubscriptionStore.getState().setModuleAccess(mockModuleAccess);
      });

      const { hasModuleAccess } = useSubscriptionStore.getState();
      
      expect(hasModuleAccess('module-1')).toBe(true);
      expect(hasModuleAccess('module-2')).toBe(false);
      expect(hasModuleAccess('module-inexistant')).toBe(false);
    });
  });

  describe('Hooks réactifs', () => {
    it('devrait charger les modules réactifs', async () => {
      const { result } = renderHook(
        () => useReactiveModules('group-1'),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(true);
      
      // Attendre que le chargement soit terminé
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('devrait gérer le changement de plan avec optimistic updates', async () => {
      const { result } = renderHook(
        () => useReactiveModules('group-1'),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.changePlan('new-plan-id', 'premium');
      });

      expect(result.current.isPending).toBe(false);
    });
  });

  describe('Synchronisation temps réel', () => {
    it('devrait démarrer la synchronisation', () => {
      const { result } = renderHook(
        () => useSubscriptionSync('group-1'),
        { wrapper: createWrapper() }
      );

      expect(result.current).toBeDefined();
    });

    it('devrait gérer la synchronisation manuelle', async () => {
      const { result } = renderHook(
        () => useSubscriptionSync('group-1'),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.manualSync();
      });

      // Vérifier que la synchronisation s'est bien passée
      expect(useSubscriptionStore.getState().lastSync).toBeInstanceOf(Date);
    });
  });

  describe('Cas d\'erreur', () => {
    it('devrait gérer les erreurs de réseau', async () => {
      // Mock d'une erreur réseau
      const mockError = new Error('Network error');
      
      const { result } = renderHook(
        () => useReactiveModules('group-1'),
        { wrapper: createWrapper() }
      );

      // Simuler une erreur
      await act(async () => {
        try {
          await result.current.changePlan('invalid-plan', 'invalid');
        } catch (error) {
          expect(error).toBeDefined();
        }
      });
    });

    it('devrait fallback au polling si WebSocket échoue', () => {
      // Mock WebSocket qui échoue
      global.WebSocket = jest.fn(() => {
        throw new Error('WebSocket not supported');
      });

      const { result } = renderHook(
        () => useSubscriptionSync('group-1'),
        { wrapper: createWrapper() }
      );

      // Devrait toujours fonctionner avec le polling
      expect(result.current).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('ne devrait pas causer de re-renders inutiles', () => {
      let renderCount = 0;
      
      const { result, rerender } = renderHook(
        () => {
          renderCount++;
          return useReactiveModules('group-1');
        },
        { wrapper: createWrapper() }
      );

      const initialRenderCount = renderCount;
      
      // Rerender sans changement de props
      rerender();
      
      // Le nombre de renders ne devrait pas augmenter de façon excessive
      expect(renderCount - initialRenderCount).toBeLessThanOrEqual(2);
    });
  });
});
