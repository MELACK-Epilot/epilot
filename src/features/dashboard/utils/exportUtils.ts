/**
 * Utilitaires d'export pour les permissions (Excel, PDF, CSV)
 * @module exportUtils
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PermissionExportData {
  userName: string;
  email: string;
  role: string;
  moduleName: string;
  categoryName: string;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canExport: boolean;
  assignedAt: string;
}

/**
 * Export vers Excel avec plusieurs feuilles
 */
export const exportToExcel = (data: PermissionExportData[], schoolGroupName: string = 'Groupe Scolaire') => {
  try {
    // Créer un nouveau workbook
    const wb = XLSX.utils.book_new();

    // Feuille 1: Données complètes
    const wsData = data.map(item => ({
      'Utilisateur': item.userName,
      'Email': item.email,
      'Rôle': item.role,
      'Module': item.moduleName,
      'Catégorie': item.categoryName,
      'Lecture': item.canRead ? 'Oui' : 'Non',
      'Écriture': item.canWrite ? 'Oui' : 'Non',
      'Suppression': item.canDelete ? 'Oui' : 'Non',
      'Export': item.canExport ? 'Oui' : 'Non',
      'Assigné le': item.assignedAt,
    }));

    const ws1 = XLSX.utils.json_to_sheet(wsData);
    
    // Largeur des colonnes
    ws1['!cols'] = [
      { wch: 20 }, // Utilisateur
      { wch: 25 }, // Email
      { wch: 15 }, // Rôle
      { wch: 25 }, // Module
      { wch: 20 }, // Catégorie
      { wch: 10 }, // Lecture
      { wch: 10 }, // Écriture
      { wch: 12 }, // Suppression
      { wch: 10 }, // Export
      { wch: 12 }, // Assigné le
    ];

    XLSX.utils.book_append_sheet(wb, ws1, 'Permissions');

    // Feuille 2: Statistiques
    const stats = calculateStats(data);
    const wsStats = XLSX.utils.json_to_sheet([
      { 'Métrique': 'Total Utilisateurs', 'Valeur': stats.totalUsers },
      { 'Métrique': 'Total Permissions', 'Valeur': stats.totalPermissions },
      { 'Métrique': 'Utilisateurs avec Modules', 'Valeur': stats.usersWithModules },
      { 'Métrique': 'Modules Uniques', 'Valeur': stats.uniqueModules },
      { 'Métrique': 'Catégories Uniques', 'Valeur': stats.uniqueCategories },
      { 'Métrique': 'Taux de Couverture', 'Valeur': `${stats.coverageRate}%` },
    ]);

    wsStats['!cols'] = [{ wch: 30 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsStats, 'Statistiques');

    // Feuille 3: Répartition par rôle
    const roleDistribution = calculateRoleDistribution(data);
    const wsRoles = XLSX.utils.json_to_sheet(roleDistribution);
    wsRoles['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsRoles, 'Par Rôle');

    // Feuille 4: Répartition par module
    const moduleDistribution = calculateModuleDistribution(data);
    const wsModules = XLSX.utils.json_to_sheet(moduleDistribution);
    wsModules['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsModules, 'Par Module');

    // Télécharger
    const fileName = `permissions-${schoolGroupName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    return true;
  } catch (error) {
    console.error('Erreur export Excel:', error);
    throw new Error('Erreur lors de la génération du fichier Excel');
  }
};

/**
 * Export vers PDF avec mise en page professionnelle
 */
export const exportToPDF = (data: PermissionExportData[], schoolGroupName: string = 'Groupe Scolaire') => {
  try {
    const doc = new jsPDF('landscape'); // Format paysage pour plus de colonnes

    // En-tête
    doc.setFontSize(20);
    doc.setTextColor(42, 157, 143); // Couleur E-Pilot
    doc.text('E-PILOT CONGO', 15, 20);
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Rapport des Permissions & Modules', 15, 30);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Groupe Scolaire: ${schoolGroupName}`, 15, 38);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 15, 44);
    doc.text(`Heure: ${new Date().toLocaleTimeString('fr-FR')}`, 15, 50);

    // Ligne de séparation
    doc.setDrawColor(42, 157, 143);
    doc.setLineWidth(0.5);
    doc.line(15, 55, 282, 55);

    // Statistiques en haut
    const stats = calculateStats(data);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    const statsY = 62;
    doc.text(`Total Utilisateurs: ${stats.totalUsers}`, 15, statsY);
    doc.text(`Total Permissions: ${stats.totalPermissions}`, 80, statsY);
    doc.text(`Modules Uniques: ${stats.uniqueModules}`, 150, statsY);
    doc.text(`Taux Couverture: ${stats.coverageRate}%`, 220, statsY);

    // Tableau des permissions
    const tableData = data.map(item => [
      item.userName,
      item.email,
      item.role,
      item.moduleName,
      item.categoryName,
      item.canRead ? '✓' : '✗',
      item.canWrite ? '✓' : '✗',
      item.canDelete ? '✓' : '✗',
      item.canExport ? '✓' : '✗',
      item.assignedAt,
    ]);

    autoTable(doc, {
      head: [[
        'Utilisateur',
        'Email',
        'Rôle',
        'Module',
        'Catégorie',
        'Lect.',
        'Écr.',
        'Supp.',
        'Exp.',
        'Assigné le'
      ]],
      body: tableData,
      startY: 70,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [42, 157, 143],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 30 }, // Utilisateur
        1: { cellWidth: 40 }, // Email
        2: { cellWidth: 25 }, // Rôle
        3: { cellWidth: 40 }, // Module
        4: { cellWidth: 30 }, // Catégorie
        5: { cellWidth: 12, halign: 'center' }, // Lecture
        6: { cellWidth: 12, halign: 'center' }, // Écriture
        7: { cellWidth: 12, halign: 'center' }, // Suppression
        8: { cellWidth: 12, halign: 'center' }, // Export
        9: { cellWidth: 25 }, // Assigné le
      },
      margin: { left: 15, right: 15 },
    });

    // Pied de page
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} sur ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
      doc.text(
        'Généré par E-Pilot Congo',
        15,
        doc.internal.pageSize.height - 10
      );
    }

    // Télécharger
    const fileName = `permissions-${schoolGroupName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    return true;
  } catch (error) {
    console.error('Erreur export PDF:', error);
    throw new Error('Erreur lors de la génération du fichier PDF');
  }
};

/**
 * Calculer les statistiques
 */
function calculateStats(data: PermissionExportData[]) {
  const uniqueUsers = new Set(data.map(item => item.email));
  const uniqueModules = new Set(data.map(item => item.moduleName));
  const uniqueCategories = new Set(data.map(item => item.categoryName));

  const totalUsers = uniqueUsers.size;
  const totalPermissions = data.length;
  const usersWithModules = uniqueUsers.size;
  const coverageRate = totalUsers > 0 ? Math.round((usersWithModules / totalUsers) * 100) : 0;

  return {
    totalUsers,
    totalPermissions,
    usersWithModules,
    uniqueModules: uniqueModules.size,
    uniqueCategories: uniqueCategories.size,
    coverageRate,
  };
}

/**
 * Calculer la répartition par rôle
 */
function calculateRoleDistribution(data: PermissionExportData[]) {
  const roleMap = new Map<string, { users: Set<string>; permissions: number }>();

  data.forEach(item => {
    if (!roleMap.has(item.role)) {
      roleMap.set(item.role, { users: new Set(), permissions: 0 });
    }
    const roleData = roleMap.get(item.role)!;
    roleData.users.add(item.email);
    roleData.permissions++;
  });

  return Array.from(roleMap.entries()).map(([role, data]) => ({
    'Rôle': role,
    'Utilisateurs': data.users.size,
    'Permissions': data.permissions,
  }));
}

/**
 * Calculer la répartition par module
 */
function calculateModuleDistribution(data: PermissionExportData[]) {
  const moduleMap = new Map<string, { category: string; users: Set<string> }>();

  data.forEach(item => {
    if (!moduleMap.has(item.moduleName)) {
      moduleMap.set(item.moduleName, { category: item.categoryName, users: new Set() });
    }
    moduleMap.get(item.moduleName)!.users.add(item.email);
  });

  return Array.from(moduleMap.entries()).map(([module, data]) => ({
    'Module': module,
    'Catégorie': data.category,
    'Utilisateurs': data.users.size,
  }));
}
