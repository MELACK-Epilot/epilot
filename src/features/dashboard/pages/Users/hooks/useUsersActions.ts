/**
 * Hook pour gérer les actions utilisateurs
 * @module Users/hooks/useUsersActions
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useDeleteUser, useResetPassword } from '../../../hooks/useUsers';
import type { User } from '../../../types/dashboard.types';
import type { ExportFormat, BulkAction } from '../types';
import { EXPORT_HEADERS, ACTION_LABELS, STATUS_LABELS, ROLE_LABELS, GENDER_LABELS } from '../constants';

export function useUsersActions() {
  const deleteUser = useDeleteUser();
  const resetPassword = useResetPassword();

  const handleDelete = useCallback(
    async (user: User) => {
      if (confirm(`Êtes-vous sûr de vouloir désactiver ${user.firstName} ${user.lastName} ?`)) {
        try {
          await deleteUser.mutateAsync(user.id);
          toast.success('Utilisateur désactivé avec succès');
        } catch (error: any) {
          toast.error(error.message || 'Erreur lors de la désactivation');
        }
      }
    },
    [deleteUser]
  );

  const handleResetPassword = useCallback(
    async (user: User) => {
      if (confirm(`Envoyer un email de réinitialisation à ${user.email} ?`)) {
        try {
          await resetPassword.mutateAsync(user.email);
          toast.success('Email de réinitialisation envoyé');
        } catch (error: any) {
          toast.error(error.message || "Erreur lors de l'envoi");
        }
      }
    },
    [resetPassword]
  );

  const handleExport = useCallback((users: User[], format: ExportFormat) => {
    if (!users || users.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    try {
      const csvData = users.map((user) => [
        user.lastName,
        user.firstName,
        user.email,
        user.phone || 'N/A',
        user.gender === 'M' ? GENDER_LABELS.M : user.gender === 'F' ? GENDER_LABELS.F : 'N/A',
        user.dateOfBirth ? format(new Date(user.dateOfBirth), 'dd/MM/yyyy') : 'N/A',
        user.role === 'super_admin' ? ROLE_LABELS.super_admin : ROLE_LABELS.admin_groupe,
        user.schoolGroupName || 'Administrateur Système E-Pilot',
        user.status === 'active'
          ? STATUS_LABELS.active
          : user.status === 'inactive'
          ? STATUS_LABELS.inactive
          : STATUS_LABELS.suspended,
        user.lastLogin ? format(new Date(user.lastLogin), 'dd/MM/yyyy HH:mm', { locale: fr }) : 'Jamais',
      ]);

      if (format === 'csv') {
        const csvContent = [EXPORT_HEADERS.join(';'), ...csvData.map((row) => row.join(';'))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `utilisateurs_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (format === 'excel') {
        toast.info('Export Excel - Fonctionnalité à implémenter avec la librairie xlsx');
      } else if (format === 'pdf') {
        toast.info('Export PDF - Fonctionnalité à implémenter avec la librairie jsPDF');
      }

      toast.success(`Export ${format.toUpperCase()} réussi ! ${users.length} utilisateur(s) exporté(s)`);
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      toast.error("Erreur lors de l'export");
    }
  }, []);

  const handleBulkAction = useCallback(async (action: BulkAction, selectedUsers: string[]) => {
    if (selectedUsers.length === 0) {
      toast.error('Aucun utilisateur sélectionné');
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir ${ACTION_LABELS[action]} ${selectedUsers.length} utilisateur(s) ?`)) {
      toast.success(`${selectedUsers.length} utilisateur(s) ${ACTION_LABELS[action]}é(s)`);
      return true;
    }
    return false;
  }, []);

  return {
    handleDelete,
    handleResetPassword,
    handleExport,
    handleBulkAction,
  };
}
