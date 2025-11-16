/**
 * Store Zustand pour les Demandes de Ressources
 * Optimistic updates + Temps réel
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'completed';
export type RequestPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface ResourceRequestItem {
  id: string;
  request_id: string;
  resource_name: string;
  resource_category: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  justification?: string;
  created_at: string;
}

export interface ResourceRequest {
  id: string;
  school_id: string;
  school_group_id: string;
  requested_by: string;
  status: RequestStatus;
  priority: RequestPriority;
  title: string;
  description?: string;
  notes?: string;
  total_estimated_amount: number;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  approved_by?: string;
  completed_at?: string;
  
  // Relations
  requester?: {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
  };
  school?: {
    id: string;
    name: string;
  };
  items?: ResourceRequestItem[];
}

interface ResourceRequestsStore {
  requests: ResourceRequest[];
  isLoading: boolean;
  
  setRequests: (requests: ResourceRequest[]) => void;
  setLoading: (loading: boolean) => void;
  
  // Actions optimistes
  addRequest: (request: ResourceRequest) => void;
  updateRequest: (id: string, updates: Partial<ResourceRequest>) => void;
  deleteRequest: (id: string) => void;
  
  // Actions statut
  approveRequest: (id: string, approvedBy: string) => void;
  rejectRequest: (id: string) => void;
  completeRequest: (id: string) => void;
}

export const useResourceRequestsStore = create<ResourceRequestsStore>((set) => ({
  requests: [],
  isLoading: false,

  setRequests: (requests) => set({ requests }),
  setLoading: (loading) => set({ isLoading: loading }),

  // Ajouter une demande (optimistic)
  addRequest: (request) => 
    set((state) => ({
      requests: [request, ...state.requests],
    })),

  // Mettre à jour une demande (optimistic)
  updateRequest: (id, updates) =>
    set((state) => ({
      requests: state.requests.map((req) =>
        req.id === id ? { ...req, ...updates, updated_at: new Date().toISOString() } : req
      ),
    })),

  // Supprimer une demande (optimistic)
  deleteRequest: (id) =>
    set((state) => ({
      requests: state.requests.filter((req) => req.id !== id),
    })),

  // Approuver une demande (optimistic)
  approveRequest: (id, approvedBy) =>
    set((state) => ({
      requests: state.requests.map((req) =>
        req.id === id
          ? {
              ...req,
              status: 'approved' as RequestStatus,
              approved_by: approvedBy,
              approved_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          : req
      ),
    })),

  // Rejeter une demande (optimistic)
  rejectRequest: (id) =>
    set((state) => ({
      requests: state.requests.map((req) =>
        req.id === id
          ? {
              ...req,
              status: 'rejected' as RequestStatus,
              updated_at: new Date().toISOString(),
            }
          : req
      ),
    })),

  // Compléter une demande (optimistic)
  completeRequest: (id) =>
    set((state) => ({
      requests: state.requests.map((req) =>
        req.id === id
          ? {
              ...req,
              status: 'completed' as RequestStatus,
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          : req
      ),
    })),
}));
