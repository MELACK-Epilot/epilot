/**
 * Configuration des couleurs et icônes par catégorie
 * Système de différenciation visuelle pour identification rapide
 */

import {
  GraduationCap,
  BookOpen,
  DollarSign,
  Users,
  Shield,
  Wrench,
  FileText,
  MessageSquare,
  ClipboardList,
  type LucideIcon
} from 'lucide-react';

export interface CategoryTheme {
  id: string;
  name: string;
  icon: LucideIcon;
  gradient: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  badgeColor: string;
  iconColor: string;
  description: string;
}

/**
 * Thèmes visuels par catégorie
 * Chaque catégorie a une identité visuelle unique
 */
export const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  'scolarite-admissions': {
    id: 'scolarite-admissions',
    name: 'Scolarité & Admissions',
    icon: GraduationCap,
    gradient: 'from-blue-500 to-blue-700',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    badgeColor: 'bg-blue-100 text-blue-700',
    iconColor: 'text-blue-600',
    description: 'Gestion des inscriptions et suivi scolaire'
  },
  'pedagogie-evaluations': {
    id: 'pedagogie-evaluations',
    name: 'Pédagogie & Évaluations',
    icon: BookOpen,
    gradient: 'from-purple-500 to-purple-700',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    badgeColor: 'bg-purple-100 text-purple-700',
    iconColor: 'text-purple-600',
    description: 'Enseignement, notes et bulletins'
  },
  'finances-comptabilite': {
    id: 'finances-comptabilite',
    name: 'Finances & Comptabilité',
    icon: DollarSign,
    gradient: 'from-green-500 to-green-700',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    badgeColor: 'bg-green-100 text-green-700',
    iconColor: 'text-green-600',
    description: 'Gestion financière et comptable'
  },
  'ressources-humaines': {
    id: 'ressources-humaines',
    name: 'Ressources Humaines',
    icon: Users,
    gradient: 'from-orange-500 to-orange-700',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    badgeColor: 'bg-orange-100 text-orange-700',
    iconColor: 'text-orange-600',
    description: 'Gestion du personnel et RH'
  },
  'vie-scolaire-discipline': {
    id: 'vie-scolaire-discipline',
    name: 'Vie Scolaire & Discipline',
    icon: ClipboardList,
    gradient: 'from-red-500 to-red-700',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    badgeColor: 'bg-red-100 text-red-700',
    iconColor: 'text-red-600',
    description: 'Discipline, absences et sanctions'
  },
  'services-infrastructures': {
    id: 'services-infrastructures',
    name: 'Services & Infrastructures',
    icon: Wrench,
    gradient: 'from-yellow-500 to-yellow-700',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
    badgeColor: 'bg-yellow-100 text-yellow-700',
    iconColor: 'text-yellow-600',
    description: 'Cantine, transport, bibliothèque'
  },
  'securite-acces': {
    id: 'securite-acces',
    name: 'Sécurité & Accès',
    icon: Shield,
    gradient: 'from-indigo-500 to-indigo-700',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200',
    badgeColor: 'bg-indigo-100 text-indigo-700',
    iconColor: 'text-indigo-600',
    description: 'Rôles, permissions et sécurité'
  },
  'documents-rapports': {
    id: 'documents-rapports',
    name: 'Documents & Rapports',
    icon: FileText,
    gradient: 'from-gray-500 to-gray-700',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
    badgeColor: 'bg-gray-100 text-gray-700',
    iconColor: 'text-gray-600',
    description: 'Génération de documents et rapports'
  },
  'communication': {
    id: 'communication',
    name: 'Communication',
    icon: MessageSquare,
    gradient: 'from-teal-500 to-teal-700',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700',
    borderColor: 'border-teal-200',
    badgeColor: 'bg-teal-100 text-teal-700',
    iconColor: 'text-teal-600',
    description: 'Messagerie et notifications'
  }
};

/**
 * Fonction pour obtenir le thème d'une catégorie par son nom
 */
export function getCategoryTheme(categoryName: string): CategoryTheme {
  // Normaliser le nom pour la recherche
  const normalizedName = categoryName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Chercher le thème correspondant
  const theme = CATEGORY_THEMES[normalizedName];
  
  if (theme) {
    return theme;
  }

  // Thème par défaut si non trouvé
  return {
    id: 'default',
    name: categoryName,
    icon: FileText,
    gradient: 'from-gray-400 to-gray-600',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
    badgeColor: 'bg-gray-100 text-gray-700',
    iconColor: 'text-gray-600',
    description: 'Catégorie personnalisée'
  };
}

/**
 * Fonction pour obtenir le thème par ID de catégorie
 */
export function getCategoryThemeById(categoryName: string): CategoryTheme {
  return getCategoryTheme(categoryName);
}

/**
 * Liste de toutes les catégories avec leurs thèmes
 */
export function getAllCategoryThemes(): CategoryTheme[] {
  return Object.values(CATEGORY_THEMES);
}
