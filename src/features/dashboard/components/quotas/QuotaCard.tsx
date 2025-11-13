/**
 * Carte d'affichage des quotas d'un groupe scolaire
 * Affiche tous les quotas (écoles, élèves, personnel, stockage)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { School, Users, UserCheck, HardDrive, TrendingUp } from 'lucide-react';
import { QuotaProgressBar } from './QuotaProgressBar';
import type { GroupQuotas } from '@/features/dashboard/types/dashboard.types';

interface QuotaCardProps {
  quotas: GroupQuotas;
  planName?: string;
  onUpgrade?: () => void;
  showUpgradeButton?: boolean;
}

export const QuotaCard = ({
  quotas,
  planName,
  onUpgrade,
  showUpgradeButton = true,
}: QuotaCardProps) => {
  const hasLimitReached = 
    quotas.isSchoolsLimitReached ||
    quotas.isStudentsLimitReached ||
    quotas.isPersonnelLimitReached ||
    quotas.isStorageLimitReached;

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-[#1D3557]">
              Utilisation des quotas
            </CardTitle>
            {planName && (
              <CardDescription className="mt-1">
                Plan actuel : <Badge variant="outline" className="ml-1">{planName}</Badge>
              </CardDescription>
            )}
          </div>
          {hasLimitReached && showUpgradeButton && (
            <Button
              size="sm"
              onClick={onUpgrade}
              className="bg-[#2A9D8F] hover:bg-[#1d7a6f] text-white"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Mettre à niveau
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quota Écoles */}
        <QuotaProgressBar
          label="Écoles"
          current={quotas.currentSchools}
          max={quotas.maxSchools}
          showPercentage
        />

        {/* Quota Élèves */}
        <QuotaProgressBar
          label="Élèves"
          current={quotas.currentStudents}
          max={quotas.maxStudents}
          showPercentage
        />

        {/* Quota Personnel */}
        <QuotaProgressBar
          label="Personnel"
          current={quotas.currentPersonnel}
          max={quotas.maxPersonnel}
          showPercentage
        />

        {/* Quota Stockage */}
        <QuotaProgressBar
          label="Stockage"
          current={parseInt(quotas.currentStorage) || 0}
          max={parseInt(quotas.storageLimit) || 0}
          unit="GB"
          showPercentage
        />

        {/* Message d'avertissement si limite atteinte */}
        {hasLimitReached && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              ⚠️ <strong>Limite atteinte</strong> : Vous avez atteint une ou plusieurs limites de votre plan. 
              Passez à un plan supérieur pour continuer à créer des ressources.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
