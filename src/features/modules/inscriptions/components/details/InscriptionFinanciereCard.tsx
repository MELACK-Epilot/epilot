/**
 * Card Informations Financières
 * Affiche les informations financières de l'inscription
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMontant, formatBoolean } from '../../utils/inscription-formatters';
import type { Inscription } from '../../types/inscription.types';

interface InscriptionFinanciereCardProps {
  inscription: Inscription;
}

export const InscriptionFinanciereCard = ({ inscription }: InscriptionFinanciereCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          💰 Informations Financières
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">Frais d'inscription</p>
          <p className="font-medium text-gray-900">
            {formatMontant(inscription.frais_inscription)}
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500 mb-1">Frais de scolarité</p>
          <p className="font-medium text-gray-900">
            {formatMontant(inscription.frais_scolarite)}
          </p>
        </div>
        
        {inscription.frais_cantine && (
          <div>
            <p className="text-sm text-gray-500 mb-1">Frais de cantine</p>
            <p className="font-medium text-gray-900">
              {formatMontant(inscription.frais_cantine)}
            </p>
          </div>
        )}
        
        {inscription.frais_transport && (
          <div>
            <p className="text-sm text-gray-500 mb-1">Frais de transport</p>
            <p className="font-medium text-gray-900">
              {formatMontant(inscription.frais_transport)}
            </p>
          </div>
        )}
        
        <div>
          <p className="text-sm text-gray-500 mb-1">Montant payé</p>
          <p className="font-medium text-green-600">
            {formatMontant(inscription.montant_paye || 0)}
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500 mb-1">Solde restant</p>
          <p className="font-medium text-red-600">
            {formatMontant(inscription.solde_restant || 0)}
          </p>
        </div>
        
        {inscription.mode_paiement && (
          <div>
            <p className="text-sm text-gray-500 mb-1">Mode de paiement</p>
            <p className="font-medium text-gray-900">{inscription.mode_paiement}</p>
          </div>
        )}
        
        {inscription.reference_paiement && (
          <div>
            <p className="text-sm text-gray-500 mb-1">Référence paiement</p>
            <p className="font-medium text-gray-900">{inscription.reference_paiement}</p>
          </div>
        )}
        
        <div>
          <p className="text-sm text-gray-500 mb-1">Aide sociale</p>
          <p className="font-medium text-gray-900">
            {formatBoolean(inscription.a_aide_sociale)}
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500 mb-1">Pensionnaire</p>
          <p className="font-medium text-gray-900">
            {formatBoolean(inscription.est_pensionnaire)}
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500 mb-1">Bourse</p>
          <p className="font-medium text-gray-900">
            {formatBoolean(inscription.a_bourse)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
