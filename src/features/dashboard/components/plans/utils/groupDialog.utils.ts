/**
 * Utilitaires pour l'export et l'impression du dialogue de détails du groupe
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { type PlanSubscription } from '../../../hooks/usePlanSubscriptions';
import { type GroupDetails } from '../../../hooks/useGroupDetails';
import { formatDate } from './subscriptions.utils';
import { toast } from 'sonner';

/**
 * Formate la période de facturation
 */
export const formatBillingPeriod = (period: string): string => {
  switch (period) {
    case 'monthly': return 'Mensuel';
    case 'quarterly': return 'Trimestriel';
    case 'biannual': return 'Semestriel';
    case 'yearly': return 'Annuel';
    default: return period;
  }
};

/**
 * Formate le prix avec la devise
 */
export const formatPrice = (price: number, currency: string): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency === 'FCFA' ? 'XOF' : currency,
    minimumFractionDigits: 0,
  }).format(price).replace('XOF', 'FCFA');
};

/**
 * Exporte les détails du groupe vers Excel
 */
export const exportGroupToExcel = (
  group: PlanSubscription,
  details: GroupDetails | null
): void => {
  try {
    const wb = XLSX.utils.book_new();

    // Feuille 1: Informations générales
    const generalData = [
      ['DÉTAILS DU GROUPE SCOLAIRE', ''],
      ['', ''],
      ['Nom du groupe', group.school_group_name],
      ['Plan', group.plan_name],
      ['Prix', formatPrice(group.plan_price || 0, group.plan_currency || 'FCFA')],
      ['Période', formatBillingPeriod(group.plan_billing_period || 'monthly')],
      ['Statut', group.status],
      ['Date de début', formatDate(group.start_date)],
      ['Date de fin', formatDate(group.end_date)],
      ['Auto-renouvellement', group.auto_renew ? 'Activé' : 'Désactivé'],
      ['Nombre d\'écoles', group.schools_count || 0],
      ['Nombre d\'utilisateurs', group.users_count || 0],
    ];

    if (details?.contact) {
      generalData.push(
        ['', ''],
        ['CONTACT', ''],
        ['Nom', details.contact.name || 'N/A'],
        ['Email', details.contact.email || 'N/A'],
        ['Téléphone', details.contact.phone || 'N/A'],
        ['Adresse', details.contact.address || 'N/A'],
        ['Site web', details.contact.website || 'N/A']
      );
    }

    const ws1 = XLSX.utils.aoa_to_sheet(generalData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Informations générales');

    // Feuille 2: Écoles
    if (details?.schools && details.schools.length > 0) {
      const schoolsData = details.schools.map(school => ({
        'Nom': school.name,
        'Adresse': school.address || 'N/A',
        'Téléphone': school.phone || 'N/A',
        'Email': school.email || 'N/A',
        'Élèves': school.students_count || 0,
        'Enseignants': school.teachers_count || 0,
      }));

      const ws2 = XLSX.utils.json_to_sheet(schoolsData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Écoles');
    }

    // Feuille 3: Utilisateurs
    if (details?.users && details.users.length > 0) {
      const usersData = details.users.map(user => ({
        'Nom complet': user.full_name,
        'Email': user.email,
        'Rôle': user.role,
        'Date d\'inscription': formatDate(user.created_at),
      }));

      const ws3 = XLSX.utils.json_to_sheet(usersData);
      XLSX.utils.book_append_sheet(wb, ws3, 'Utilisateurs');
    }

    // Feuille 4: Paiements
    if (details?.payments && details.payments.length > 0) {
      const paymentsData = details.payments.map(payment => ({
        'Montant': formatPrice(payment.amount, payment.currency),
        'Statut': payment.status,
        'Date': formatDate(payment.payment_date),
        'Méthode': payment.payment_method || 'N/A',
      }));

      const ws4 = XLSX.utils.json_to_sheet(paymentsData);
      XLSX.utils.book_append_sheet(wb, ws4, 'Paiements');
    }

    const fileName = `details_${group.school_group_name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast.success('Détails exportés vers Excel');
  } catch (error) {
    console.error('Erreur export Excel:', error);
    toast.error('Erreur lors de l\'export Excel');
  }
};

/**
 * Exporte les détails du groupe vers PDF
 */
export const exportGroupToPDF = (
  group: PlanSubscription,
  details: GroupDetails | null
): void => {
  try {
    const pdf = new jsPDF();
    let yPosition = 20;

    // Titre
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DÉTAILS DU GROUPE SCOLAIRE', 20, yPosition);
    yPosition += 20;

    // Informations générales
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Informations générales', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const generalInfo = [
      `Nom du groupe: ${group.school_group_name}`,
      `Plan: ${group.plan_name}`,
      `Prix: ${formatPrice(group.plan_price || 0, group.plan_currency || 'FCFA')}`,
      `Période: ${formatBillingPeriod(group.plan_billing_period || 'monthly')}`,
      `Statut: ${group.status}`,
      `Date de début: ${formatDate(group.start_date)}`,
      `Date de fin: ${formatDate(group.end_date)}`,
      `Auto-renouvellement: ${group.auto_renew ? 'Activé' : 'Désactivé'}`,
      `Nombre d'écoles: ${group.schools_count || 0}`,
      `Nombre d'utilisateurs: ${group.users_count || 0}`,
    ];

    generalInfo.forEach(info => {
      pdf.text(info, 20, yPosition);
      yPosition += 6;
    });

    // Contact
    if (details?.contact) {
      yPosition += 10;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Contact', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const contactInfo = [
        `Nom: ${details.contact.name || 'N/A'}`,
        `Email: ${details.contact.email || 'N/A'}`,
        `Téléphone: ${details.contact.phone || 'N/A'}`,
        `Adresse: ${details.contact.address || 'N/A'}`,
        `Site web: ${details.contact.website || 'N/A'}`,
      ];

      contactInfo.forEach(info => {
        pdf.text(info, 20, yPosition);
        yPosition += 6;
      });
    }

    // Écoles (résumé)
    if (details?.schools && details.schools.length > 0) {
      yPosition += 10;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Écoles (${details.schools.length})`, 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      details.schools.slice(0, 10).forEach(school => {
        pdf.text(`• ${school.name} - ${school.students_count || 0} élèves, ${school.teachers_count || 0} enseignants`, 20, yPosition);
        yPosition += 6;
        
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
      });
    }

    const fileName = `details_${group.school_group_name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    toast.success('Détails exportés vers PDF');
  } catch (error) {
    console.error('Erreur export PDF:', error);
    toast.error('Erreur lors de l\'export PDF');
  }
};

/**
 * Lance l'impression du dialogue
 */
export const printGroupDetails = (): void => {
  window.print();
};
