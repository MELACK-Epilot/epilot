/**
 * AttendanceWidget - Widget des absences et retards
 * Affiche les absences du jour et les statistiques
 * 
 * @module ChefEtablissement/Components
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  UserX, 
  Clock,
  ChevronRight,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AttendanceWidgetData } from '../../../types/chef-etablissement.types';

interface AttendanceWidgetProps {
  readonly data: AttendanceWidgetData;
  readonly onViewDetails?: () => void;
}

/**
 * Widget des absences
 */
export const AttendanceWidget = memo<AttendanceWidgetProps>(({
  data,
  onViewDetails,
}) => {
  const hasIssues = data.todayAbsent > 0 || data.todayLate > 0;

  return (
    <Card className="border-0 shadow-lg h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="p-1.5 bg-red-100 rounded-lg">
              <UserX className="h-4 w-4 text-red-600" />
            </div>
            Présences
          </CardTitle>
          <Badge 
            variant="secondary" 
            className={hasIssues ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}
          >
            {data.weeklyRate.toFixed(1)}% cette semaine
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Stats du jour */}
        <div className="grid grid-cols-2 gap-3">
          {/* Absents */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`
              p-4 rounded-xl text-center
              ${data.todayAbsent > 0 ? 'bg-red-50 border border-red-100' : 'bg-gray-50'}
            `}
          >
            <UserX className={`h-6 w-6 mx-auto mb-2 ${data.todayAbsent > 0 ? 'text-red-500' : 'text-gray-400'}`} />
            <p className={`text-2xl font-bold ${data.todayAbsent > 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {data.todayAbsent}
            </p>
            <p className="text-xs text-gray-500">Absents aujourd'hui</p>
          </motion.div>

          {/* Retards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className={`
              p-4 rounded-xl text-center
              ${data.todayLate > 0 ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50'}
            `}
          >
            <Clock className={`h-6 w-6 mx-auto mb-2 ${data.todayLate > 0 ? 'text-amber-500' : 'text-gray-400'}`} />
            <p className={`text-2xl font-bold ${data.todayLate > 0 ? 'text-amber-600' : 'text-gray-600'}`}>
              {data.todayLate}
            </p>
            <p className="text-xs text-gray-500">Retards aujourd'hui</p>
          </motion.div>
        </div>

        {/* Liste des absences récentes */}
        {data.recentAbsences.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Absences récentes
            </p>
            <div className="space-y-2 max-h-[140px] overflow-y-auto">
              {data.recentAbsences.slice(0, 3).map((absence, index) => (
                <motion.div
                  key={absence.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                >
                  {/* Status icon */}
                  {absence.isJustified ? (
                    <div className="p-1 bg-green-100 rounded-full">
                      <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                    </div>
                  ) : (
                    <div className="p-1 bg-red-100 rounded-full">
                      <XCircle className="h-3.5 w-3.5 text-red-600" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {absence.studentName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {absence.className}
                      {absence.reason && ` • ${absence.reason}`}
                    </p>
                  </div>

                  {/* Badge */}
                  <Badge 
                    variant="secondary"
                    className={`text-xs ${absence.isJustified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                  >
                    {absence.isJustified ? 'Justifié' : 'Non justifié'}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* État vide */}
        {!hasIssues && data.recentAbsences.length === 0 && (
          <div className="text-center py-4">
            <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-600">
              Tout le monde est présent !
            </p>
            <p className="text-xs text-gray-500">
              Aucune absence ni retard aujourd'hui
            </p>
          </div>
        )}

        {/* Bouton voir plus */}
        {onViewDetails && (
          <Button
            variant="ghost"
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={onViewDetails}
          >
            Gérer les absences
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
});

AttendanceWidget.displayName = 'AttendanceWidget';

export default AttendanceWidget;
