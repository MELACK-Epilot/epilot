/**
 * Tests unitaires pour useSchoolGroups
 * Couverture des hooks et logique métier
 * @module useSchoolGroups.test
 */

import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSchoolGroups, useCreateSchoolGroup, useUpdateSchoolGroup, useDeleteSchoolGroup } from './useSchoolGroups';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
  },
}));

// Helper pour wrapper avec QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  
  return Wrapper;
};

describe('useSchoolGroups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch school groups successfully', async () => {
    const mockData = [
      {
        id: '1',
        name: 'Groupe Test',
        code: 'E-PILOT-001',
        region: 'Brazzaville',
        city: 'Brazzaville',
        status: 'active',
        plan: 'gratuit',
        school_count: 5,
        student_count: 100,
        staff_count: 20,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      }),
    });

    const { result } = renderHook(() => useSchoolGroups(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].name).toBe('Groupe Test');
  });

  it('should handle fetch error gracefully', async () => {
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }),
    });

    const { result } = renderHook(() => useSchoolGroups(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('should filter by status', async () => {
    const mockData = [
      { id: '1', status: 'active', name: 'Active Group' },
      { id: '2', status: 'inactive', name: 'Inactive Group' },
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockData.filter(g => g.status === 'active'),
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(
      () => useSchoolGroups({ status: 'active' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });
});

describe('useCreateSchoolGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create school group successfully', async () => {
    const mockGroup = {
      name: 'Nouveau Groupe',
      code: 'E-PILOT-999',
      region: 'Brazzaville',
      city: 'Brazzaville',
      plan: 'gratuit' as const,
    };

    (supabase.from as any).mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: '999', ...mockGroup },
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useCreateSchoolGroup(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(mockGroup);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('should handle creation error', async () => {
    (supabase.from as any).mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Duplicate code' },
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useCreateSchoolGroup(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: 'Test',
      code: 'E-PILOT-001',
      region: 'Test',
      city: 'Test',
      plan: 'gratuit',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useUpdateSchoolGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update school group successfully', async () => {
    const mockUpdate = {
      id: '1',
      name: 'Groupe Modifié',
    };

    (supabase.from as any).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUpdate,
              error: null,
            }),
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useUpdateSchoolGroup(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(mockUpdate);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useDeleteSchoolGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete school group successfully', async () => {
    (supabase.from as any).mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: '1' },
              error: null,
            }),
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useDeleteSchoolGroup(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
