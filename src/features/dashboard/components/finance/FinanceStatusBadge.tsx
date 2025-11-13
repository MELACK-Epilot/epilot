/**
 * Badge de statut pour les pages Finances
 * Composant réutilisable avec configurations prédéfinies
 */

import { Badge } from '@/components/ui/badge';
import { STATUS_CONFIGS } from '../../constants/finance.constants';

interface FinanceStatusBadgeProps {
  status: keyof typeof STATUS_CONFIGS;
}

export const FinanceStatusBadge = ({ status }: FinanceStatusBadgeProps) => {
  const config = STATUS_CONFIGS[status] || STATUS_CONFIGS.pending;

  return (
    <Badge className={config.color}>
      {config.label}
    </Badge>
  );
};
