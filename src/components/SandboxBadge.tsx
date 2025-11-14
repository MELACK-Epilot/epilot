/**
 * Badge visuel pour indiquer l'environnement sandbox
 * @module SandboxBadge
 */

import { Badge } from '@/components/ui/badge';
import { useIsSandbox } from '@/hooks/useIsSandbox';
import { TestTube2 } from 'lucide-react';

/**
 * Badge sandbox affiché quand l'utilisateur est dans l'environnement de test
 */
export function SandboxBadge() {
  const isSandbox = useIsSandbox();

  if (!isSandbox) return null;

  return (
    <Badge className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5 px-3 py-1">
      <TestTube2 className="w-3.5 h-3.5" />
      SANDBOX
    </Badge>
  );
}

/**
 * Badge inline pour les listes
 */
export function SandboxBadgeInline() {
  const isSandbox = useIsSandbox();

  if (!isSandbox) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
      <TestTube2 className="w-3 h-3" />
      Test
    </span>
  );
}

/**
 * Banner sandbox affiché en haut de page
 */
export function SandboxBanner() {
  const isSandbox = useIsSandbox();

  if (!isSandbox) return null;

  return (
    <div className="bg-orange-500 text-white px-4 py-2 text-center text-sm font-medium">
      <div className="flex items-center justify-center gap-2">
        <TestTube2 className="w-4 h-4" />
        <span>
          🧪 Environnement SANDBOX - Données fictives pour tests et développement
        </span>
      </div>
    </div>
  );
}
