/**
 * Header de la page détails inscription
 * Affiche le nom, statut et actions disponibles
 */

import { ArrowLeft, Edit, Trash2, CheckCircle, XCircle, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getStatusConfig } from '../../utils/inscription-formatters';
import type { Inscription } from '../../types/inscription.types';

interface InscriptionDetailsHeaderProps {
  inscription: Inscription;
  isValidating: boolean;
  isRejecting: boolean;
  onValidate: () => void;
  onReject: () => void;
  onEdit: () => void;
  onPrint: () => void;
  onExport: () => void;
  onDelete: () => void;
  onBack: () => void;
}

export const InscriptionDetailsHeader = ({
  inscription,
  isValidating,
  isRejecting,
  onValidate,
  onReject,
  onEdit,
  onPrint,
  onExport,
  onDelete,
  onBack,
}: InscriptionDetailsHeaderProps) => {
  const statusConfig = getStatusConfig(inscription.status);
  
  return (
    <div className="flex items-center justify-between">
      {/* Informations */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {inscription.student_first_name} {inscription.student_last_name}
            </h1>
            <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Inscription #{inscription.inscription_number} • {inscription.academic_year}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {/* Actions selon le statut */}
        {inscription.status === 'en_attente' && (
          <>
            <Button
              onClick={onValidate}
              disabled={isValidating}
              className="bg-[#2A9D8F] hover:bg-[#1D3557] gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {isValidating ? 'Validation...' : 'Valider'}
            </Button>
            <Button
              onClick={onReject}
              disabled={isRejecting}
              variant="destructive"
              className="gap-2"
            >
              <XCircle className="w-4 h-4" />
              {isRejecting ? 'Refus...' : 'Refuser'}
            </Button>
          </>
        )}
        
        <Button onClick={onEdit} variant="outline" className="gap-2">
          <Edit className="w-4 h-4" />
          Modifier
        </Button>
        
        <Button onClick={onPrint} variant="outline" className="gap-2">
          <Printer className="w-4 h-4" />
          Imprimer
        </Button>
        
        <Button onClick={onExport} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exporter
        </Button>
        
        <Button onClick={onDelete} variant="destructive" className="gap-2">
          <Trash2 className="w-4 h-4" />
          Supprimer
        </Button>
      </div>
    </div>
  );
};
