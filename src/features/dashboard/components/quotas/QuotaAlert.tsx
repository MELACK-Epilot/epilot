/**
 * Composant d'alerte pour afficher un message de quota dépassé
 * Utilisé dans les formulaires de création
 */

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuotaAlertProps {
  resourceType: 'school' | 'student' | 'personnel';
  current: number;
  max: number;
  planName: string;
  onUpgrade?: () => void;
  className?: string;
}

export const QuotaAlert = ({
  resourceType,
  current,
  max,
  planName,
  onUpgrade,
  className,
}: QuotaAlertProps) => {
  const resourceNames = {
    school: { singular: 'école', plural: 'écoles' },
    student: { singular: 'élève', plural: 'élèves' },
    personnel: { singular: 'personnel', plural: 'personnel' },
  };

  const resource = resourceNames[resourceType];

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Limite atteinte</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p>
          Vous avez atteint la limite de votre plan <strong>{planName}</strong> : 
          <span className="font-semibold"> {current}/{max} {resource.plural}</span>.
        </p>
        <p>
          Pour créer plus de {resource.plural}, veuillez passer à un plan supérieur.
        </p>
        {onUpgrade && (
          <Button
            size="sm"
            onClick={onUpgrade}
            className="mt-2 bg-white text-red-600 hover:bg-red-50 border border-red-200"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Mettre à niveau mon plan
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};
