/**
 * Constantes pour les pages Finances
 * Gradients, couleurs et configurations de statut
 */

export const FINANCE_GRADIENTS = {
  blue: 'from-[#1D3557] to-[#0F1F35]',
  green: 'from-[#2A9D8F] to-[#1D8A7E]',
  gold: 'from-[#E9C46A] to-[#D4AF37]',
  lightBlue: 'from-[#457B9D] to-[#2A5F7F]',
  red: 'from-[#E63946] to-[#C72030]',
  purple: 'from-[#9333EA] to-[#7C3AED]',
  orange: 'from-[#F97316] to-[#EA580C]',
} as const;

export const STATUS_CONFIGS = {
  active: { 
    color: 'bg-[#2A9D8F]/10 text-[#2A9D8F] border-[#2A9D8F]/20 border', 
    label: 'Actif' 
  },
  inactive: { 
    color: 'bg-gray-100 text-gray-600 border-gray-200 border', 
    label: 'Inactif' 
  },
  pending: { 
    color: 'bg-[#E9C46A]/10 text-[#E9C46A] border-[#E9C46A]/20 border', 
    label: 'En attente' 
  },
  cancelled: { 
    color: 'bg-[#E63946]/10 text-[#E63946] border-[#E63946]/20 border', 
    label: 'Annulé' 
  },
  completed: { 
    color: 'bg-[#2A9D8F]/10 text-[#2A9D8F] border-[#2A9D8F]/20 border', 
    label: 'Complété' 
  },
  expired: { 
    color: 'bg-gray-100 text-gray-600 border-gray-200 border', 
    label: 'Expiré' 
  },
  failed: { 
    color: 'bg-[#E63946]/10 text-[#E63946] border-[#E63946]/20 border', 
    label: 'Échoué' 
  },
  refunded: { 
    color: 'bg-gray-100 text-gray-600 border-gray-200 border', 
    label: 'Remboursé' 
  },
  paid: { 
    color: 'bg-[#2A9D8F]/10 text-[#2A9D8F] border-[#2A9D8F]/20 border', 
    label: 'Payé' 
  },
  overdue: { 
    color: 'bg-[#E63946]/10 text-[#E63946] border-[#E63946]/20 border', 
    label: 'En retard' 
  },
} as const;

export const FINANCE_COLORS = {
  primary: '#1D3557',
  success: '#2A9D8F',
  warning: '#E9C46A',
  danger: '#E63946',
  info: '#457B9D',
} as const;
