/**
 * Fonctions d'export pour la page Assigner des Modules
 */

import * as XLSX from 'xlsx';
import type { AssignModulesUser, ExportConfig } from '@/features/dashboard/types/assign-modules.types';

export const exportUsersToExcel = (
  users: AssignModulesUser[],
  config: ExportConfig
) => {
  const data = users.map(user => ({
    'Prénom': user.firstName,
    'Nom': user.lastName,
    'Email': user.email,
    'Téléphone': user.phone || '',
    'Rôle': user.role,
    'École': user.schoolName || '',
    'Statut': user.status,
    'Modules assignés': user.assignedModulesCount || 0,
    'Date création': new Date(user.createdAt).toLocaleDateString('fr-FR'),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Utilisateurs');

  // Ajuster largeur colonnes
  const colWidths = [
    { wch: 15 }, // Prénom
    { wch: 15 }, // Nom
    { wch: 30 }, // Email
    { wch: 15 }, // Téléphone
    { wch: 15 }, // Rôle
    { wch: 25 }, // École
    { wch: 10 }, // Statut
    { wch: 15 }, // Modules
    { wch: 12 }, // Date
  ];
  ws['!cols'] = colWidths;

  const fileName = `utilisateurs_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

export const exportUsersToCSV = (
  users: AssignModulesUser[],
  config: ExportConfig
) => {
  const headers = [
    'Prénom',
    'Nom',
    'Email',
    'Téléphone',
    'Rôle',
    'École',
    'Statut',
    'Modules assignés',
    'Date création'
  ];

  const rows = users.map(user => [
    user.firstName,
    user.lastName,
    user.email,
    user.phone || '',
    user.role,
    user.schoolName || '',
    user.status,
    user.assignedModulesCount || 0,
    new Date(user.createdAt).toLocaleDateString('fr-FR'),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
