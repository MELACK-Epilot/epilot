/**
 * Page Détails d'une Inscription - VERSION REFACTORISÉE
 * Composition de composants modulaires
 */

import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useInscription } from '../hooks/queries/useInscription';
import { useInscriptionActions } from '../hooks/useInscriptionActions';
import {
  InscriptionDetailsHeader,
  InscriptionEleveCard,
  InscriptionScolaireCard,
  InscriptionParentsCard,
  InscriptionFinanciereCard,
  InscriptionGestionCard,
} from '../components/details';

export const InscriptionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Hook de données
  const { data: inscription, isLoading, isError, refetch } = useInscription(id || '');
  
  // Hook d'actions
  const actions = useInscriptionActions({
    inscriptionId: id || '',
    onSuccess: refetch,
  });

  // États de chargement et d'erreur
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (isError || !inscription) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Inscription introuvable ou erreur de chargement
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header avec actions */}
      <InscriptionDetailsHeader
        inscription={inscription}
        isValidating={actions.isValidating}
        isRejecting={actions.isRejecting}
        onValidate={actions.handleValidate}
        onReject={actions.handleReject}
        onEdit={actions.handleEdit}
        onPrint={actions.handlePrint}
        onExport={actions.handleExport}
        onDelete={actions.handleDelete}
        onBack={() => navigate(-1)}
      />

      {/* Sections d'informations */}
      <InscriptionEleveCard inscription={inscription} />
      <InscriptionScolaireCard inscription={inscription} />
      <InscriptionParentsCard inscription={inscription} />
      <InscriptionFinanciereCard inscription={inscription} />
      <InscriptionGestionCard inscription={inscription} />
    </div>
  );
};

export default InscriptionDetails;
