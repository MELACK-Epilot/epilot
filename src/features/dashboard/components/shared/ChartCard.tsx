/**
 * Wrapper réutilisable pour les graphiques
 * @module ChartCard
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Maximize2, RefreshCw } from 'lucide-react';
import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onExport?: () => void;
  onRefresh?: () => void;
  onFullscreen?: () => void;
  isLoading?: boolean;
  actions?: ReactNode;
}

export const ChartCard = ({
  title,
  subtitle,
  children,
  onExport,
  onRefresh,
  onFullscreen,
  isLoading = false,
  actions,
}: ChartCardProps) => {
  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {actions}
          
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}

          {onExport && (
            <Button variant="ghost" size="sm" onClick={onExport}>
              <Download className="w-4 h-4" />
            </Button>
          )}

          {onFullscreen && (
            <Button variant="ghost" size="sm" onClick={onFullscreen}>
              <Maximize2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={isLoading ? 'opacity-50 pointer-events-none' : ''}>
        {children}
      </div>
    </Card>
  );
};
