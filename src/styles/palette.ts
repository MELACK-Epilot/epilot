/**
 * Palette officielle E-Pilot
 * Couleurs de la charte graphique
 * 
 * @module palette
 */

export const EPILOT_COLORS = {
  // Couleurs principales
  primary: {
    blue: '#1D3557',        // Bleu Foncé Institutionnel
    teal: '#2A9D8F',        // Vert Cité Positive (couleur signature)
    gold: '#E9C46A',        // Or Républicain
    red: '#E63946',         // Rouge Sobre
  },
  
  // Couleurs secondaires
  secondary: {
    lightBlue: '#DCE3EA',   // Gris Bleu Clair
    cream: '#F9F9F9',       // Blanc Cassé
  },
  
  // Dégradés
  gradients: {
    blueTeal: 'from-[#1D3557] to-[#2A9D8F]',
    tealGold: 'from-[#2A9D8F] to-[#E9C46A]',
    goldRed: 'from-[#E9C46A] to-[#E63946]',
    primary: 'from-[#2A9D8F] to-[#238b7e]',
  },
  
  // États
  states: {
    success: '#2A9D8F',     // Vert Cité Positive
    warning: '#E9C46A',     // Or Républicain
    error: '#E63946',       // Rouge Sobre
    info: '#1D3557',        // Bleu Foncé Institutionnel
  },
  
  // Texte
  text: {
    primary: '#1D3557',     // Bleu foncé
    secondary: '#6B7280',   // Gris
    light: '#9CA3AF',       // Gris clair
    white: '#FFFFFF',       // Blanc
  },
  
  // Backgrounds
  background: {
    primary: '#FFFFFF',     // Blanc
    secondary: '#F9F9F9',   // Blanc Cassé
    tertiary: '#DCE3EA',    // Gris Bleu Clair
  }
} as const;

export type EPilotColor = typeof EPILOT_COLORS;
