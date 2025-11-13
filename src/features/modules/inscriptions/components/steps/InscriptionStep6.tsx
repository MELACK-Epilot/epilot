/**
 * Étape 6 : Validation et récapitulatif
 * Affichage de toutes les informations avant soumission
 */

import { UseFormReturn } from 'react-hook-form';
import { 
  User, Users, GraduationCap, DollarSign, FileText,
  CheckCircle, AlertCircle, Calendar, Phone, Mail, MapPin
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { InscriptionFormData } from '../../utils/validation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface InscriptionStep6Props {
  form: UseFormReturn<InscriptionFormData>;
}

export const InscriptionStep6 = ({ form }: InscriptionStep6Props) => {
  const values = form.getValues();

  // ========================================================================
  // CALCULS
  // ========================================================================

  const fraisTotal = 
    (values.frais_inscription || 0) +
    (values.frais_scolarite || 0) +
    (values.frais_cantine || 0) +
    (values.frais_transport || 0);

  const soldeRestant = fraisTotal - (values.montant_paye || 0);

  // ========================================================================
  // FORMATAGE
  // ========================================================================

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CG', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'dd MMMM yyyy', { locale: fr });
    } catch {
      return date;
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="space-y-6">
      {/* EN-TÊTE OFFICIEL DU DOCUMENT */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
        {/* Logos et Titre */}
        <div className="flex items-start justify-between mb-6">
          {/* Logo Groupe Scolaire - Gauche */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#1D3557] to-[#2A9D8F] rounded-full flex items-center justify-center mb-2">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <p className="text-xs text-gray-600 text-center font-medium">Groupe Scolaire</p>
          </div>

          {/* Titre Central */}
          <div className="flex-1 text-center px-4">
            <h1 className="text-2xl font-bold text-[#1D3557] mb-2">
              FICHE D'INSCRIPTION
            </h1>
            <p className="text-sm text-gray-600 mb-1">
              Année Académique {values.academic_year}
            </p>
            <div className="inline-block bg-[#1D3557] text-white px-4 py-1 rounded-full text-xs font-semibold">
              {values.type_inscription === 'nouvelle' ? 'NOUVELLE INSCRIPTION' :
               values.type_inscription === 'reinscription' ? 'RÉINSCRIPTION' :
               'TRANSFERT'}
            </div>
          </div>

          {/* Logo E-Pilot SVG - Droite */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 mb-2">
              <img
                src="/images/logo/logo.svg"
                alt="E-Pilot Logo"
                className="w-full h-full drop-shadow-lg"
              />
            </div>
            <p className="text-xs text-gray-600 text-center font-medium">E-Pilot</p>
          </div>
        </div>

        {/* Ligne de séparation décorative */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 h-1 bg-gradient-to-r from-[#1D3557] via-[#2A9D8F] to-[#E9C46A] rounded"></div>
        </div>

        {/* Informations du document */}
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="text-center">
            <p className="text-gray-500">Date d'inscription</p>
            <p className="font-semibold text-gray-900">
              {format(new Date(), 'dd/MM/yyyy', { locale: fr })}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">Niveau demandé</p>
            <p className="font-semibold text-gray-900">{values.requested_level}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">Statut</p>
            <p className="font-semibold text-green-600">EN COURS</p>
          </div>
        </div>
      </div>

      {/* 1. INFORMATIONS ÉLÈVE */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Photo de l'élève remplace l'icône */}
              {values.student_photo ? (
                <div className="relative">
                  <img
                    src={values.student_photo}
                    alt={`${values.student_first_name} ${values.student_last_name}`}
                    className="w-16 h-16 rounded-full object-cover border-3 border-blue-600 shadow-md"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                </div>
              ) : (
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
              )}
              <CardTitle className="text-base">Informations de l'élève</CardTitle>
            </div>
            {values.student_photo && (
              <div className="text-xs text-gray-500">
                Photo d'identité
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <InfoItem label="Nom" value={values.student_last_name} />
            {values.student_postnom && (
              <InfoItem label="Post-nom" value={values.student_postnom} />
            )}
            <InfoItem label="Prénom" value={values.student_first_name} />
            <InfoItem 
              label="Sexe" 
              value={values.student_gender === 'M' ? 'Masculin' : 'Féminin'} 
            />
            <InfoItem 
              label="Date de naissance" 
              value={formatDate(values.student_date_of_birth)} 
            />
            {values.student_place_of_birth && (
              <InfoItem label="Lieu de naissance" value={values.student_place_of_birth} />
            )}
            <InfoItem label="Nationalité" value={values.student_nationality || 'Congolaise'} />
          </div>
          
          {(values.address || values.student_phone || values.student_email) && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {values.address && (
                  <InfoItem label="Adresse" value={values.address} icon={MapPin} />
                )}
                {values.student_phone && (
                  <InfoItem label="Téléphone" value={values.student_phone} icon={Phone} />
                )}
                {values.student_email && (
                  <InfoItem label="Email" value={values.student_email} icon={Mail} />
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 2. PARENTS / TUTEURS */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <CardTitle className="text-base">Parents / Tuteurs</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Père */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Père</p>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem 
                label="Nom complet" 
                value={`${values.parent1_first_name || ''} ${values.parent1_last_name || ''}`.trim() || 'Non renseigné'} 
              />
              <InfoItem label="Téléphone" value={values.parent1_phone} icon={Phone} />
              {values.parent1_profession && (
                <InfoItem label="Profession" value={values.parent1_profession} />
              )}
            </div>
          </div>

          <Separator />

          {/* Mère */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Mère</p>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem 
                label="Nom complet" 
                value={`${values.parent2_first_name || ''} ${values.parent2_last_name || ''}`.trim() || 'Non renseigné'} 
              />
              {values.parent2_phone && (
                <InfoItem label="Téléphone" value={values.parent2_phone} icon={Phone} />
              )}
              {values.parent2_profession && (
                <InfoItem label="Profession" value={values.parent2_profession} />
              )}
            </div>
          </div>

          {/* Tuteur */}
          {(values.tuteur_first_name || values.tuteur_phone) && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Tuteur</p>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem 
                    label="Nom complet" 
                    value={`${values.tuteur_first_name || ''} ${values.tuteur_last_name || ''}`.trim()} 
                  />
                  {values.tuteur_phone && (
                    <InfoItem label="Téléphone" value={values.tuteur_phone} icon={Phone} />
                  )}
                  {values.tuteur_relation && (
                    <InfoItem label="Lien de parenté" value={values.tuteur_relation} />
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 3. INFORMATIONS SCOLAIRES */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <GraduationCap className="w-5 h-5 text-purple-600" />
            </div>
            <CardTitle className="text-base">Informations scolaires</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <InfoItem label="Année académique" value={values.academic_year} icon={Calendar} />
            <InfoItem label="Niveau" value={values.requested_level} />
            {values.filiere && <InfoItem label="Filière" value={values.filiere} />}
            {values.option_specialite && <InfoItem label="Option" value={values.option_specialite} />}
            <InfoItem 
              label="Type d'inscription" 
              value={
                values.type_inscription === 'nouvelle' ? 'Nouvelle inscription' :
                values.type_inscription === 'reinscription' ? 'Réinscription' :
                'Transfert'
              } 
            />
          </div>

          {values.ancienne_ecole && (
            <>
              <Separator />
              <InfoItem label="Ancienne école" value={values.ancienne_ecole} />
            </>
          )}

          <div className="flex gap-4">
            {values.est_redoublant && (
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                Redoublant
              </Badge>
            )}
            {values.est_affecte && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Affecté
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 4. INFORMATIONS FINANCIÈRES */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-orange-600" />
            </div>
            <CardTitle className="text-base">Informations financières</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InfoItem label="Droit d'inscription" value={formatCurrency(values.frais_inscription || 0)} />
            <InfoItem label="Frais de scolarité" value={formatCurrency(values.frais_scolarite || 0)} />
            {values.frais_cantine && values.frais_cantine > 0 && (
              <InfoItem label="Frais de cantine" value={formatCurrency(values.frais_cantine)} />
            )}
            {values.frais_transport && values.frais_transport > 0 && (
              <InfoItem label="Frais de transport" value={formatCurrency(values.frais_transport)} />
            )}
          </div>

          <Separator />

          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total des frais</span>
              <span className="font-semibold">{formatCurrency(fraisTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Montant payé</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(values.montant_paye || 0)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="font-semibold">Solde restant</span>
              <span className={`font-bold text-lg ${soldeRestant > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(soldeRestant)}
              </span>
            </div>
          </div>

          {values.mode_paiement && (
            <InfoItem label="Mode de paiement" value={values.mode_paiement} />
          )}

          <div className="flex gap-4">
            {values.a_aide_sociale && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Aide sociale
              </Badge>
            )}
            {values.est_pensionnaire && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                Pensionnaire
              </Badge>
            )}
            {values.a_bourse && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Boursier
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 5. OBSERVATIONS */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Observations administratives</CardTitle>
          <CardDescription>
            Ajoutez des notes ou observations si nécessaire (optionnel)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            {...form.register('observations')}
            placeholder="Observations, remarques particulières..."
            rows={4}
            className="resize-none"
          />
        </CardContent>
      </Card>

      {/* Avertissement final */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
        <CardContent className="pt-6 pb-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="font-bold text-lg text-green-800 mb-1">
                  Prêt à soumettre l'inscription
                </p>
                <p className="text-sm text-green-700">
                  En cliquant sur "Enregistrer", vous confirmez que toutes les informations sont correctes.
                  Un numéro d'inscription sera automatiquement généré.
                </p>
              </div>
              
              <div className="flex items-start gap-2 bg-white/50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800">
                  <span className="font-semibold">Important:</span> Après validation, vous pourrez imprimer cette fiche d'inscription 
                  pour la remettre à l'administration de l'établissement.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PIED DE PAGE OFFICIEL */}
      <div className="bg-gradient-to-r from-[#1D3557] to-[#2A9D8F] text-white rounded-xl p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <p className="text-sm font-semibold">Document officiel d'inscription</p>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-xs mb-4">
          <div>
            <p className="text-white/70">Généré par</p>
            <p className="font-semibold">E-Pilot Platform</p>
          </div>
          <div>
            <p className="text-white/70">Date de génération</p>
            <p className="font-semibold">
              {format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}
            </p>
          </div>
          <div>
            <p className="text-white/70">Version</p>
            <p className="font-semibold">v1.0</p>
          </div>
        </div>

        <div className="border-t border-white/20 pt-3">
          <p className="text-xs text-white/80">
            Ce document est confidentiel et destiné uniquement à l'usage de l'établissement scolaire.
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPOSANT HELPER : InfoItem
// ============================================================================

interface InfoItemProps {
  label: string;
  value: string | number;
  icon?: React.ElementType;
}

const InfoItem = ({ label, value, icon: Icon }: InfoItemProps) => (
  <div>
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4 text-gray-400" />}
      <p className="text-sm font-medium text-gray-900">{value || 'Non renseigné'}</p>
    </div>
  </div>
);

// Ensure proper module export
export default InscriptionStep6;
