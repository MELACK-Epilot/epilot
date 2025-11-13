/**
 * Composant pour afficher les badges des niveaux scolaires
 * Utilisé dans la liste et les détails des écoles
 */

import { Badge } from '@/components/ui/badge';
import { GraduationCap, BookOpen, School as SchoolIcon, Building2 } from 'lucide-react';

interface SchoolLevelBadgesProps {
  has_preschool?: boolean;
  has_primary?: boolean;
  has_middle?: boolean;
  has_high?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showIcons?: boolean;
}

const LEVEL_CONFIG = {
  preschool: {
    label: 'Maternelle',
    emoji: '🎓',
    icon: GraduationCap,
    color: 'bg-pink-100 text-pink-700 border-pink-300',
  },
  primary: {
    label: 'Primaire',
    emoji: '📚',
    icon: BookOpen,
    color: 'bg-blue-100 text-blue-700 border-blue-300',
  },
  middle: {
    label: 'Collège',
    emoji: '🏫',
    icon: SchoolIcon,
    color: 'bg-green-100 text-green-700 border-green-300',
  },
  high: {
    label: 'Lycée',
    emoji: '🎓',
    icon: Building2,
    color: 'bg-purple-100 text-purple-700 border-purple-300',
  },
};

export function SchoolLevelBadges({
  has_preschool,
  has_primary,
  has_middle,
  has_high,
  size = 'md',
  showIcons = false,
}: SchoolLevelBadgesProps) {
  const levels = [
    { key: 'preschool', active: has_preschool },
    { key: 'primary', active: has_primary },
    { key: 'middle', active: has_middle },
    { key: 'high', active: has_high },
  ].filter(level => level.active);

  if (levels.length === 0) {
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-300">
        Aucun niveau
      </Badge>
    );
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {levels.map(({ key }) => {
        const config = LEVEL_CONFIG[key as keyof typeof LEVEL_CONFIG];
        const Icon = config.icon;

        return (
          <Badge
            key={key}
            variant="outline"
            className={`${config.color} ${sizeClasses[size]} font-medium border flex items-center gap-1.5`}
          >
            {showIcons ? (
              <Icon className="w-3.5 h-3.5" />
            ) : (
              <span>{config.emoji}</span>
            )}
            {config.label}
          </Badge>
        );
      })}
    </div>
  );
}

/**
 * Variante compacte pour affichage dans les tableaux
 */
export function SchoolLevelBadgesCompact({
  has_preschool,
  has_primary,
  has_middle,
  has_high,
}: Omit<SchoolLevelBadgesProps, 'size' | 'showIcons'>) {
  const levels = [
    { key: 'preschool', active: has_preschool, emoji: '🎓' },
    { key: 'primary', active: has_primary, emoji: '📚' },
    { key: 'middle', active: has_middle, emoji: '🏫' },
    { key: 'high', active: has_high, emoji: '🎓' },
  ].filter(level => level.active);

  if (levels.length === 0) {
    return <span className="text-gray-400 text-xs">-</span>;
  }

  return (
    <div className="flex gap-1">
      {levels.map(({ key, emoji }) => (
        <span key={key} className="text-base" title={LEVEL_CONFIG[key as keyof typeof LEVEL_CONFIG].label}>
          {emoji}
        </span>
      ))}
    </div>
  );
}

/**
 * Fonction utilitaire pour obtenir le texte des niveaux
 */
export function getSchoolLevelsText(
  has_preschool?: boolean,
  has_primary?: boolean,
  has_middle?: boolean,
  has_high?: boolean
): string {
  const levels = [];
  if (has_preschool) levels.push('Maternelle');
  if (has_primary) levels.push('Primaire');
  if (has_middle) levels.push('Collège');
  if (has_high) levels.push('Lycée');
  
  return levels.length > 0 ? levels.join(', ') : 'Aucun niveau';
}
