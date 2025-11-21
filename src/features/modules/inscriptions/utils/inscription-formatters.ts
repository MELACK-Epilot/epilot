/**
 * Utilitaires de formatage pour les inscriptions
 * Fonctions pures de formatage de données
 */

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Formate un montant en FCFA
 */
export const formatMontant = (montant: number): string => {
  return `${montant.toLocaleString()} FCFA`;
};

/**
 * Formate une date au format français complet
 */
export const formatDateLong = (date: string): string => {
  return format(new Date(date), 'dd MMMM yyyy', { locale: fr });
};

/**
 * Formate une date avec heure
 */
export const formatDateTime = (date: string): string => {
  return format(new Date(date), 'dd/MM/yyyy à HH:mm', { locale: fr });
};

/**
 * Retourne la configuration du badge de statut
 */
export const getStatusConfig = (status: string) => {
  const config = {
    en_attente: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
    validee: { label: 'Validée', className: 'bg-green-100 text-green-800' },
    refusee: { label: 'Refusée', className: 'bg-red-100 text-red-800' },
    brouillon: { label: 'Brouillon', className: 'bg-gray-100 text-gray-800' },
  };
  return config[status as keyof typeof config] || config.en_attente;
};

/**
 * Formate le type d'inscription en français
 */
export const formatTypeInscription = (type: string): string => {
  const types: Record<string, string> = {
    nouvelle: 'Nouvelle inscription',
    reinscription: 'Réinscription',
    transfert: 'Transfert',
  };
  return types[type] || 'Non renseigné';
};

/**
 * Formate le genre en français
 */
export const formatGenre = (genre: 'M' | 'F'): string => {
  return genre === 'M' ? 'Masculin' : 'Féminin';
};

/**
 * Formate une valeur booléenne en Oui/Non
 */
export const formatBoolean = (value: boolean): string => {
  return value ? 'Oui' : 'Non';
};
