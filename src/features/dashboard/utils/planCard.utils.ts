/**
 * Utilitaires pour les cartes de plans
 * @module planCard.utils
 */

export const getPlanTheme = (slug: string) => {
  const themes = {
    gratuit: {
      gradient: 'from-[#DCE3EA] via-slate-700 to-slate-800',
      accent: 'slate',
      icon: 'Package',
      bgPattern: 'from-[#DCE3EA]/5 to-slate-600/5'
    },
    premium: {
      gradient: 'from-[#2A9D8F] via-[#1D3557] to-[#2A9D8F]',
      accent: 'teal',
      icon: 'Zap',
      bgPattern: 'from-[#2A9D8F]/5 to-[#1D3557]/5'
    },
    pro: {
      gradient: 'from-[#1D3557] via-[#2A9D8F] to-[#1D3557]',
      accent: 'indigo',
      icon: 'Crown',
      bgPattern: 'from-[#1D3557]/5 to-[#2A9D8F]/5'
    },
    institutionnel: {
      gradient: 'from-[#E9C46A] via-[#1D3557] to-[#E9C46A]',
      accent: 'amber',
      icon: 'Building2',
      bgPattern: 'from-[#E9C46A]/5 to-[#1D3557]/5'
    },
  };
  return themes[slug as keyof typeof themes] || themes.gratuit;
};

export const formatBillingPeriod = (period: string): string => {
  const periods: Record<string, string> = {
    monthly: 'mois',
    quarterly: 'trimestre',
    biannual: 'semestre',
    yearly: 'an',
  };
  return periods[period] || 'mois';
};

export const formatSupportLevel = (level: string): string => {
  const levels: Record<string, string> = {
    email: 'Email',
    priority: 'Prioritaire',
    '24/7': '24/7',
  };
  return levels[level] || 'Email';
};
