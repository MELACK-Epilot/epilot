/**
 * Hook optimisé pour les Demandes de Ressources
 * Avec Zustand + Optimistic Updates + Temps Réel
 */

import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useResourceRequestsStore, type ResourceRequest, type RequestStatus } from '../store/useResourceRequestsStore';

export const useResourceRequestsOptimized = (schoolGroupId: string, currentUserId: string) => {
  const { toast } = useToast();
  const {
    requests,
    isLoading,
    setRequests,
    setLoading,
    addRequest,
    updateRequest,
    deleteRequest,
    approveRequest,
    rejectRequest,
    completeRequest,
  } = useResourceRequestsStore();

  // Charger les demandes
  const loadRequests = useCallback(async () => {
    if (!schoolGroupId) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer le rôle de l'utilisateur
      const { data: userData } = await supabase
        .from('users')
        .select('role, school_id')
        .eq('id', user.id)
        .single();

      let query = supabase
        .from('resource_requests')
        .select(`
          *,
          requester:requested_by (
            id,
            first_name,
            last_name,
            role
          ),
          school:school_id (
            id,
            name,
            logo_url
          ),
          school_group:school_group_id (
            id,
            name,
            logo
          ),
          items:resource_request_items (
            id,
            resource_name,
            resource_category,
            quantity,
            unit,
            unit_price,
            total_price,
            justification
          )
        `)
        .eq('school_group_id', schoolGroupId);

      // Si c'est un directeur/proviseur, ne voir que ses demandes
      if (['proviseur', 'directeur', 'directeur_etudes'].includes(userData?.role || '')) {
        query = query.eq('school_id', userData?.school_id);
      }
      // Si c'est admin_groupe, voir toutes les demandes du groupe

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      console.error('Erreur chargement demandes:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les demandes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [schoolGroupId, setRequests, setLoading, toast]);

  // Créer une demande
  const createRequest = useCallback(async (data: {
    title: string;
    description?: string;
    priority: string;
    school_id: string;
    items: Array<{
      resource_name: string;
      resource_category: string;
      quantity: number;
      unit: string;
      unit_price: number;
      justification?: string;
    }>;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');

      // Calculer le montant total
      const totalAmount = data.items.reduce((sum, item) => 
        sum + (item.quantity * item.unit_price), 0
      );

      // Créer la demande
      const { data: request, error: requestError } = await supabase
        .from('resource_requests')
        .insert({
          school_group_id: schoolGroupId,
          school_id: data.school_id,
          requested_by: user.id,
          title: data.title,
          description: data.description,
          priority: data.priority,
          status: 'pending',
          total_estimated_amount: totalAmount,
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Créer les items (sans total_price car c'est une colonne générée)
      const items = data.items.map(item => ({
        request_id: request.id,
        resource_name: item.resource_name,
        resource_category: item.resource_category,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        justification: item.justification,
      }));

      const { error: itemsError } = await supabase
        .from('resource_request_items')
        .insert(items);

      if (itemsError) throw itemsError;

      toast({
        title: 'Demande créée',
        description: 'Votre demande de ressources a été soumise.',
      });

      await loadRequests();
    } catch (error: any) {
      console.error('Erreur création demande:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la demande.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [schoolGroupId, toast, loadRequests]);

  // Approuver une demande
  const handleApprove = useCallback(async (requestId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');

      // Optimistic update
      approveRequest(requestId, user.id);

      // Update BDD
      const { error } = await supabase
        .from('resource_requests')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Demande approuvée',
        description: 'La demande a été approuvée avec succès.',
      });
    } catch (error: any) {
      console.error('Erreur approbation:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'approuver la demande.',
        variant: 'destructive',
      });
      // Rollback
      await loadRequests();
    }
  }, [approveRequest, toast, loadRequests]);

  // Rejeter une demande
  const handleReject = useCallback(async (requestId: string) => {
    try {
      // Optimistic update
      rejectRequest(requestId);

      // Update BDD
      const { error } = await supabase
        .from('resource_requests')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Demande rejetée',
        description: 'La demande a été rejetée.',
      });
    } catch (error: any) {
      console.error('Erreur rejet:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de rejeter la demande.',
        variant: 'destructive',
      });
      // Rollback
      await loadRequests();
    }
  }, [rejectRequest, toast, loadRequests]);

  // Compléter une demande
  const handleComplete = useCallback(async (requestId: string) => {
    try {
      // Optimistic update
      completeRequest(requestId);

      // Update BDD
      const { error } = await supabase
        .from('resource_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Demande complétée',
        description: 'La demande a été marquée comme complétée.',
      });
    } catch (error: any) {
      console.error('Erreur complétion:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de compléter la demande.',
        variant: 'destructive',
      });
      // Rollback
      await loadRequests();
    }
  }, [completeRequest, toast, loadRequests]);

  // Supprimer une demande
  const handleDelete = useCallback(async (requestId: string) => {
    // SÉCURITÉ: Vérifier que requestId est valide
    if (!requestId || requestId === '' || requestId === 'undefined') {
      console.error('❌ ERREUR: requestId invalide!', requestId);
      toast({
        title: 'Erreur',
        description: 'ID de demande invalide',
        variant: 'destructive',
      });
      return;
    }

    console.log('🗑️ Suppression demande:', requestId);

    try {
      // Optimistic update
      deleteRequest(requestId);

      // Delete items first (cascade devrait le faire, mais on le fait explicitement)
      const { error: itemsError } = await supabase
        .from('resource_request_items')
        .delete()
        .eq('request_id', requestId);

      if (itemsError) {
        console.error('Erreur suppression items:', itemsError);
        // Continue quand même, peut-être que les items n'existent pas
      }

      // Delete request
      const { error, count } = await supabase
        .from('resource_requests')
        .delete({ count: 'exact' })
        .eq('id', requestId);

      if (error) throw error;

      console.log(`✅ Suppression réussie: ${count} demande(s) supprimée(s)`);

      if (count === 0) {
        console.warn('⚠️ Aucune demande supprimée - ID introuvable ou pas de permission');
      }

      toast({
        title: 'Demande supprimée',
        description: `${count || 0} demande(s) supprimée(s) définitivement.`,
      });

      // Recharger pour confirmer la suppression
      await loadRequests();
    } catch (error: any) {
      console.error('Erreur suppression:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer la demande.',
        variant: 'destructive',
      });
      // Rollback
      await loadRequests();
    }
  }, [deleteRequest, toast, loadRequests]);

  // Charger au montage
  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Mettre à jour une demande
  const updateRequestData = useCallback(async (requestId: string, data: {
    title: string;
    description?: string;
    priority: string;
    school_id: string;
    items: Array<{
      id?: string;
      resource_name: string;
      resource_category: string;
      quantity: number;
      unit: string;
      unit_price: number;
      justification?: string;
    }>;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');

      // Calculer le montant total
      const totalAmount = data.items.reduce((sum, item) => 
        sum + (item.quantity * item.unit_price), 0
      );

      // Mettre à jour la demande
      const { error: requestError } = await supabase
        .from('resource_requests')
        .update({
          title: data.title,
          description: data.description,
          priority: data.priority,
          school_id: data.school_id,
          total_estimated_amount: totalAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (requestError) throw requestError;

      // Supprimer les anciens items
      await supabase
        .from('resource_request_items')
        .delete()
        .eq('request_id', requestId);

      // Créer les nouveaux items (sans total_price car c'est une colonne générée)
      const items = data.items.map(item => ({
        request_id: requestId,
        resource_name: item.resource_name,
        resource_category: item.resource_category,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        justification: item.justification,
      }));

      const { error: itemsError } = await supabase
        .from('resource_request_items')
        .insert(items);

      if (itemsError) throw itemsError;

      toast({
        title: 'Demande modifiée',
        description: 'Les modifications ont été enregistrées.',
      });

      await loadRequests();
    } catch (error: any) {
      console.error('Erreur modification demande:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de modifier la demande.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast, loadRequests]);

  return {
    requests,
    isLoading,
    loadRequests,
    createRequest,
    updateRequestData,
    handleApprove,
    handleReject,
    handleComplete,
    handleDelete,
  };
};
