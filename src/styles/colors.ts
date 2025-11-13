/**
 * Palette de couleurs officielles E-Pilot
 * République du Congo 🇨🇬
 */

export const epilotColors = {
  // Couleur principale - Bleu Foncé Institutionnel
  institutionalBlue: '#1D3557',
  
  // Couleur de fond - Blanc Cassé
  offWhite: '#F9F9F9',
  
  // Couleur secondaire - Gris Bleu Clair
  lightBlueGray: '#DCE3EA',
  
  // Couleur de succès - Vert Cité Positive
  positiveGreen: '#2A9D8F',
  
  // Couleur d'accent - Or Républicain
  republicGold: '#E9C46A',
  
  // Couleur d'erreur - Rouge Sobre
  softRed: '#E63946',
} as const;

/**
 * Classes Tailwind CSS pour les couleurs E-Pilot
 * Utilisez ces classes dans vos composants
 */
export const epilotTailwindClasses = {
  // Backgrounds
  bgInstitutionalBlue: 'bg-[#1D3557]',
  bgOffWhite: 'bg-[#F9F9F9]',
  bgLightBlueGray: 'bg-[#DCE3EA]',
  bgPositiveGreen: 'bg-[#2A9D8F]',
  bgRepublicGold: 'bg-[#E9C46A]',
  bgSoftRed: 'bg-[#E63946]',
  
  // Text colors
  textInstitutionalBlue: 'text-[#1D3557]',
  textOffWhite: 'text-[#F9F9F9]',
  textLightBlueGray: 'text-[#DCE3EA]',
  textPositiveGreen: 'text-[#2A9D8F]',
  textRepublicGold: 'text-[#E9C46A]',
  textSoftRed: 'text-[#E63946]',
  
  // Border colors
  borderInstitutionalBlue: 'border-[#1D3557]',
  borderLightBlueGray: 'border-[#DCE3EA]',
  borderPositiveGreen: 'border-[#2A9D8F]',
  
  // Hover states
  hoverBgInstitutionalBlue: 'hover:bg-[#1D3557]',
  hoverBgPositiveGreen: 'hover:bg-[#2A9D8F]',
  hoverTextInstitutionalBlue: 'hover:text-[#1D3557]',
  hoverTextPositiveGreen: 'hover:text-[#2A9D8F]',
} as const;

/**
 * Exemples d'utilisation :
 * 
 * // Dans un composant React
 * import { epilotColors } from '@/styles/colors';
 * 
 * <div style={{ backgroundColor: epilotColors.institutionalBlue }}>
 *   Contenu
 * </div>
 * 
 * // Avec Tailwind CSS
 * <div className="bg-[#1D3557] text-[#F9F9F9]">
 *   Contenu
 * </div>
 */
