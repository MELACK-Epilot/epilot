/**
 * Card Informations Scolaires
 * Affiche les informations scolaires de l'inscription
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTypeInscription, formatBoolean } from '../../utils/inscription-formatters';
import type { Inscription } from '../../types/inscription.types';

interface InscriptionScolaireCardProps {
  inscription: Inscription;
}

export const InscriptionScolaireCard = ({ inscription }: InscriptionScolaireCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          🎓 Informations Scolaires
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">Niveau demandé</p>
          <p className="font-medium text-gray-900">{inscription.requested_level}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500 mb-1">Type d'inscription</p>
          <p className="font-medium text-gray-900">
            {inscription.type_inscription ? formatTypeInscription(inscription.type_inscription) : 'Non renseigné'}
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500 mb-1">Année académique</p>
          <p className="font-medium text-gray-900">{inscription.academic_year}</p>
        </div>
        
        {inscription.serie && (
          <div>
            <p className="text-sm text-gray-500 mb-1">Série</p>
            <p className="font-medium text-gray-900">{inscription.serie}</p>
          </div>
        )}
        
        {inscription.filiere && (
          <div>
            <p className="text-sm text-gray-500 mb-1">Filière</p>
            <p className="font-medium text-gray-900">{inscription.filiere}</p>
          </div>
        )}
        
        {inscription.option_specialite && (
          <div>
            <p className="text-sm text-gray-500 mb-1">Option/Spécialité</p>
            <p className="font-medium text-gray-900">{inscription.option_specialite}</p>
          </div>
        )}
        
        <div>
          <p className="text-sm text-gray-500 mb-1">Redoublant</p>
          <p className="font-medium text-gray-900">
            {formatBoolean(inscription.est_redoublant)}
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500 mb-1">Affecté</p>
          <p className="font-medium text-gray-900">
            {formatBoolean(inscription.est_affecte)}
          </p>
        </div>
        
        {inscription.numero_affectation && (
          <div>
            <p className="text-sm text-gray-500 mb-1">N° Affectation</p>
            <p className="font-medium text-gray-900">{inscription.numero_affectation}</p>
          </div>
        )}
        
        {inscription.ancienne_ecole && (
          <div>
            <p className="text-sm text-gray-500 mb-1">Ancienne école</p>
            <p className="font-medium text-gray-900">{inscription.ancienne_ecole}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
