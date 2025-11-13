/**
 * Constantes pour la page Users
 * @module Users/constants
 */

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const EXPORT_HEADERS = [
  'Nom',
  'Prénom',
  'Email',
  'Téléphone',
  'Genre',
  'Date de naissance',
  'Rôle',
  'Groupe Scolaire',
  'Statut',
  'Dernière Connexion',
];

export const ACTION_LABELS = {
  activate: 'activer',
  deactivate: 'désactiver',
  delete: 'supprimer',
} as const;

export const STATUS_LABELS = {
  active: 'Actif',
  inactive: 'Inactif',
  suspended: 'Suspendu',
} as const;

export const ROLE_LABELS = {
  super_admin: 'Super Admin E-Pilot',
  admin_groupe: 'Administrateur de Groupe',
} as const;

export const GENDER_LABELS = {
  M: 'Masculin',
  F: 'Féminin',
} as const;
