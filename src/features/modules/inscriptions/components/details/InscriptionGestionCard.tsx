/**
 * Card Informations de Gestion
 * Affiche les informations de gestion et statut de l'inscription
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '../../utils/inscription-formatters';
import { getStatusConfig } from '../../utils/inscription-formatters';
import type { Inscription } from '../../types/inscription.types';

interface InscriptionGestionCardProps {
  inscription: Inscription;
}

export const InscriptionGestionCard = ({ inscription }: InscriptionGestionCardProps) => {
  const statusConfig = getStatusConfig(inscription.status);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          📋 Informations de Gestion
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">Statut</p>
          <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
        </div>
        
        <div>
          <p className="text-sm text-gray-500 mb-1">Date de soumission</p>
          <p className="font-medium text-gray-900">
            {inscription.submitted_at 
              ? formatDateTime(inscription.submitted_at)
              : 'Non soumise'}
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500 mb-1">Date de création</p>
          <p className="font-medium text-gray-900">
            {formatDateTime(inscription.created_at)}
          </p>
        </div>
        
        {inscription.validated_at && (
          <div>
            <p className="text-sm text-gray-500 mb-1">Date de validation</p>
            <p className="font-medium text-gray-900">
              {formatDateTime(inscription.validated_at)}
            </p>
          </div>
        )}
        
        {inscription.rejection_reason && (
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500 mb-1">Motif de refus</p>
            <p className="font-medium text-red-600">{inscription.rejection_reason}</p>
          </div>
        )}
        
        {inscription.observations && (
          <div className="md:col-span-3">
            <p className="text-sm text-gray-500 mb-1">Observations</p>
            <p className="font-medium text-gray-900">{inscription.observations}</p>
          </div>
        )}
        
        {inscription.internal_notes && (
          <div className="md:col-span-3">
            <p className="text-sm text-gray-500 mb-1">Notes internes</p>
            <p className="font-medium text-gray-900">{inscription.internal_notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
