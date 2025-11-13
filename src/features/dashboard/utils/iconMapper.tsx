/**
 * Mapper pour convertir les noms d'icônes Lucide en composants React
 * @module iconMapper
 */

import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

/**
 * Convertit un nom d'icône Lucide en composant React
 * @param iconName - Le nom de l'icône (ex: "GraduationCap", "BookOpen")
 * @param props - Props à passer au composant icône
 * @returns Le composant icône ou null si non trouvé
 */
export const getLucideIcon = (iconName: string, props?: React.ComponentProps<LucideIcon>) => {
  // Vérifier si l'icône existe dans Lucide
  const IconComponent = (LucideIcons as any)[iconName] as LucideIcon | undefined;
  
  if (!IconComponent) {
    console.warn(`Icône Lucide "${iconName}" non trouvée`);
    // Retourner une icône par défaut
    return <LucideIcons.Package {...props} />;
  }
  
  return <IconComponent {...props} />;
};

/**
 * Obtient le composant icône Lucide
 * @param iconName - Le nom de l'icône
 * @returns Le composant icône ou Package par défaut
 */
export const getIconComponent = (iconName: string): LucideIcon => {
  const IconComponent = (LucideIcons as any)[iconName] as LucideIcon | undefined;
  return IconComponent || LucideIcons.Package;
};
