/**
 * Hook custom pour gérer les actions sur une inscription
 * Centralise la logique métier des actions (validation, rejet, etc.)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useValidateInscription } from './mutations/useValidateInscription';
import { useRejectInscription } from './mutations/useRejectInscription';
import { useAuthStore } from '@/features/auth/store/auth.store';

interface UseInscriptionActionsProps {
  inscriptionId: string;
  onSuccess?: () => void;
}

export const useInscriptionActions = ({ inscriptionId, onSuccess }: UseInscriptionActionsProps) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isValidating, setIsValidating] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const validateInscription = useValidateInscription();
  const rejectInscription = useRejectInscription();

  // Détection de l'espace (user ou dashboard)
  const currentPath = window.location.pathname;
  const isUserSpace = currentPath.includes('/user/');
  const baseUrl = isUserSpace 
    ? '/user/modules/gestion-inscriptions' 
    : '/dashboard/modules/inscriptions';

  /**
   * Valide une inscription
   */
  const handleValidate = async () => {
    if (!user) {
      toast.error('Utilisateur non connecté');
      return;
    }

    setIsValidating(true);
    try {
      await validateInscription.mutateAsync({
        inscriptionId,
        agentId: user.id,
      });
      toast.success('✅ Inscription validée avec succès');
      onSuccess?.();
    } catch (error) {
      console.error('Erreur validation:', error);
      toast.error('❌ Erreur lors de la validation');
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Refuse une inscription
   */
  const handleReject = async () => {
    if (!user) {
      toast.error('Utilisateur non connecté');
      return;
    }

    const motif = prompt('Motif du refus:');
    if (!motif) return;

    setIsRejecting(true);
    try {
      await rejectInscription.mutateAsync({
        inscriptionId,
        agentId: user.id,
        motif,
      });
      toast.success('✅ Inscription refusée');
      onSuccess?.();
    } catch (error) {
      console.error('Erreur rejet:', error);
      toast.error('❌ Erreur lors du refus');
    } finally {
      setIsRejecting(false);
    }
  };

  /**
   * Édite une inscription
   */
  const handleEdit = () => {
    navigate(`${baseUrl}/liste`);
    toast.info('Édition en cours de développement');
  };

  /**
   * Supprime une inscription
   */
  const handleDelete = () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette inscription ?')) return;
    toast.info('Suppression en cours de développement');
  };

  /**
   * Imprime la fiche d'inscription
   */
  const handlePrint = () => {
    window.print();
  };

  /**
   * Exporte l'inscription
   */
  const handleExport = () => {
    toast.info('Export en cours de développement');
  };

  return {
    // États
    isValidating,
    isRejecting,
    
    // Actions
    handleValidate,
    handleReject,
    handleEdit,
    handleDelete,
    handlePrint,
    handleExport,
  };
};
