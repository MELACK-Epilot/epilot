/**
 * Card Informations Élève
 * Affiche les informations personnelles de l'élève
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateLong, formatGenre } from '../../utils/inscription-formatters';
import type { Inscription } from '../../types/inscription.types';

interface InscriptionEleveCardProps {
  inscription: Inscription;
}

export const InscriptionEleveCard = ({ inscription }: InscriptionEleveCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          👤 Informations Élève
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">Prénom</p>
          <p className="font-medium text-gray-900">{inscription.student_first_name}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500 mb-1">Nom</p>
          <p className="font-medium text-gray-900">{inscription.student_last_name}</p>
        </div>
        
        {inscription.student_postnom && (
          <div>
            <p className="text-sm text-gray-500 mb-1">Postnom</p>
            <p className="font-medium text-gray-900">{inscription.student_postnom}</p>
          </div>
        )}
        
        <div>
          <p className="text-sm text-gray-500 mb-1">Date de naissance</p>
          <p className="font-medium text-gray-900">
            {formatDateLong(inscription.student_date_of_birth)}
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500 mb-1">Lieu de naissance</p>
          <p className="font-medium text-gray-900">
            {inscription.student_place_of_birth || 'Non renseigné'}
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500 mb-1">Genre</p>
          <p className="font-medium text-gray-900">
            {formatGenre(inscription.student_gender)}
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500 mb-1">Nationalité</p>
          <p className="font-medium text-gray-900">
            {inscription.student_nationality || 'Non renseignée'}
          </p>
        </div>
        
        {inscription.student_phone && (
          <div>
            <p className="text-sm text-gray-500 mb-1">Téléphone</p>
            <p className="font-medium text-gray-900">{inscription.student_phone}</p>
          </div>
        )}
        
        {inscription.student_email && (
          <div>
            <p className="text-sm text-gray-500 mb-1">Email</p>
            <p className="font-medium text-gray-900">{inscription.student_email}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
