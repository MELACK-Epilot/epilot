/**
 * Card Informations Parents/Tuteurs
 * Affiche les informations des parents et tuteurs
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Inscription } from '../../types/inscription.types';

interface InscriptionParentsCardProps {
  inscription: Inscription;
}

export const InscriptionParentsCard = ({ inscription }: InscriptionParentsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          👨‍👩‍👧 Informations Parents / Tuteurs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Parent 1 */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Parent 1 (Père)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Nom complet</p>
              <p className="font-medium text-gray-900">
                {inscription.parent1_first_name} {inscription.parent1_last_name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Téléphone</p>
              <p className="font-medium text-gray-900">{inscription.parent1_phone}</p>
            </div>
            {inscription.parent1_email && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Email</p>
                <p className="font-medium text-gray-900">{inscription.parent1_email}</p>
              </div>
            )}
            {inscription.parent1_profession && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Profession</p>
                <p className="font-medium text-gray-900">{inscription.parent1_profession}</p>
              </div>
            )}
            {inscription.parent1_address && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500 mb-1">Adresse</p>
                <p className="font-medium text-gray-900">{inscription.parent1_address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Parent 2 */}
        {inscription.parent2_first_name && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Parent 2 (Mère)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Nom complet</p>
                <p className="font-medium text-gray-900">
                  {inscription.parent2_first_name} {inscription.parent2_last_name}
                </p>
              </div>
              {inscription.parent2_phone && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Téléphone</p>
                  <p className="font-medium text-gray-900">{inscription.parent2_phone}</p>
                </div>
              )}
              {inscription.parent2_email && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <p className="font-medium text-gray-900">{inscription.parent2_email}</p>
                </div>
              )}
              {inscription.parent2_profession && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Profession</p>
                  <p className="font-medium text-gray-900">{inscription.parent2_profession}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tuteur */}
        {inscription.tuteur_first_name && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Tuteur</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Nom complet</p>
                <p className="font-medium text-gray-900">
                  {inscription.tuteur_first_name} {inscription.tuteur_last_name}
                </p>
              </div>
              {inscription.tuteur_phone && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Téléphone</p>
                  <p className="font-medium text-gray-900">{inscription.tuteur_phone}</p>
                </div>
              )}
              {inscription.tuteur_relation && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Lien de parenté</p>
                  <p className="font-medium text-gray-900">{inscription.tuteur_relation}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Adresse commune */}
        {inscription.address && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Adresse</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500 mb-1">Adresse complète</p>
                <p className="font-medium text-gray-900">{inscription.address}</p>
              </div>
              {inscription.city && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Ville</p>
                  <p className="font-medium text-gray-900">{inscription.city}</p>
                </div>
              )}
              {inscription.region && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Région</p>
                  <p className="font-medium text-gray-900">{inscription.region}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
