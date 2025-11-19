/**
 * Utilitaires pour l'export de données
 */

import * as XLSX from 'xlsx';
import { type PlanSubscription } from '../../../hooks/usePlanSubscriptions';
import { formatDate } from './subscriptions.utils';
import { toast } from 'sonner';

/**
 * Exporte les abonnements vers Excel
 */
export const exportToExcel = (
  subscriptions: PlanSubscription[],
  planName: string
): void => {
  try {
    const csvData = subscriptions.map(sub => ({
      'Groupe': sub.school_group_name,
      'Plan': sub.plan_name,
      'Statut': sub.status,
      'Début': formatDate(sub.start_date),
      'Fin': formatDate(sub.end_date),
      'Écoles': sub.schools_count || 0,
      'Utilisateurs': sub.users_count || 0,
      'Auto-renew': sub.auto_renew ? 'Oui' : 'Non'
    }));
    
    const ws = XLSX.utils.json_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Abonnements');
    
    const fileName = `abonnements_${planName}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast.success(`${csvData.length} abonnement(s) exporté(s)`);
  } catch (error) {
    console.error('Erreur export Excel:', error);
    toast.error('Erreur lors de l\'export');
  }
};

/**
 * Lance l'impression de la page
 */
export const handlePrint = (): void => {
  window.print();
};
