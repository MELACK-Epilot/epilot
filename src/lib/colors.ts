/**
 * Couleurs officielles E-Pilot Congo
 * Palette de couleurs cohérente pour toute l'application
 * @module Colors
 */

export const COLORS = {
  // Couleurs primaires
  institutionalBlue: '#1D3557',
  positiveGreen: '#2A9D8F',
  republicanGold: '#E9C46A',
  alertRed: '#E63946',

  // Variantes
  institutionalBlueDark: '#0d1f3d',
  positiveGreenDark: '#1d7a6f',
  republicanGoldDark: '#d4a84f',
  alertRedDark: '#c72030',

  // Neutres
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
} as const;

/**
 * Classes Tailwind pour les couleurs E-Pilot
 */
export const COLOR_CLASSES = {
  // Backgrounds
  bgBlue: 'bg-[#1D3557]',
  bgGreen: 'bg-[#2A9D8F]',
  bgGold: 'bg-[#E9C46A]',
  bgRed: 'bg-[#E63946]',

  // Hover backgrounds
  hoverBgBlue: 'hover:bg-[#0d1f3d]',
  hoverBgGreen: 'hover:bg-[#1d7a6f]',
  hoverBgGold: 'hover:bg-[#d4a84f]',
  hoverBgRed: 'hover:bg-[#c72030]',

  // Text colors
  textBlue: 'text-[#1D3557]',
  textGreen: 'text-[#2A9D8F]',
  textGold: 'text-[#E9C46A]',
  textRed: 'text-[#E63946]',

  // Border colors
  borderBlue: 'border-[#1D3557]',
  borderGreen: 'border-[#2A9D8F]',
  borderGold: 'border-[#E9C46A]',
  borderRed: 'border-[#E63946]',
} as const;

/**
 * Badges de statut avec couleurs E-Pilot
 */
export const STATUS_BADGE_CLASSES = {
  active: 'bg-[#2A9D8F] text-white',
  inactive: 'bg-gray-400 text-white',
  suspended: 'bg-[#E63946] text-white',
  pending: 'bg-[#E9C46A] text-gray-900',
} as const;

/**
 * Badges de rôle avec couleurs E-Pilot
 */
export const ROLE_BADGE_CLASSES = {
  super_admin: 'bg-[#1D3557] text-white',
  admin_groupe: 'bg-[#2A9D8F] text-white',
  proviseur: 'bg-[#E9C46A] text-gray-900',
  directeur: 'bg-[#E9C46A] text-gray-900',
  directeur_etudes: 'bg-[#E9C46A] text-gray-900',
  secretaire: 'bg-blue-500 text-white',
  comptable: 'bg-orange-600 text-white',
  enseignant: 'bg-purple-600 text-white',
  surveillant: 'bg-slate-600 text-white',
  bibliothecaire: 'bg-teal-600 text-white',
  cpe: 'bg-indigo-600 text-white',
  documentaliste: 'bg-cyan-600 text-white',
  eleve: 'bg-green-500 text-white',
  parent: 'bg-pink-500 text-white',
  gestionnaire_cantine: 'bg-amber-600 text-white',
  autre: 'bg-gray-500 text-white',
} as const;

/**
 * Palette pour les graphiques Recharts
 */
export const CHART_COLORS = [
  COLORS.institutionalBlue,
  COLORS.positiveGreen,
  COLORS.republicanGold,
  COLORS.alertRed,
  '#8B5CF6', // Purple
  '#6366F1', // Indigo
  '#F97316', // Orange
  '#EC4899', // Pink
];

/**
 * Obtenir une couleur de badge selon le statut
 */
export const getStatusBadgeClass = (status: 'active' | 'inactive' | 'suspended' | 'pending') => {
  return STATUS_BADGE_CLASSES[status] || STATUS_BADGE_CLASSES.inactive;
};

/**
 * Obtenir une couleur de badge selon le rôle
 */
export const getRoleBadgeClass = (role: string) => {
  return ROLE_BADGE_CLASSES[role as keyof typeof ROLE_BADGE_CLASSES] || 'bg-gray-600 text-white';
};
