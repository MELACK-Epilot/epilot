/**
 * invoicePDF - Utilitaire pour générer des PDF de factures
 * Export professionnel avec jsPDF et autoTable
 * @module invoicePDF
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Étendre jsPDF pour autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface InvoicePDFData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  schoolGroupName: string;
  schoolGroupCode: string;
  planName: string;
  periodStart: string;
  periodEnd: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  status: string;
}

export const generateInvoicePDF = (invoiceData: InvoicePDFData): Promise<Blob> => {
  return new Promise((resolve) => {
    const doc = new jsPDF();

    // Couleurs
    const primaryColor = [42, 157, 143]; // #2A9D8F
    const secondaryColor = [69, 123, 157]; // #457B9D
    const accentColor = [233, 196, 106]; // #E9C46A
    const textColor = [31, 41, 55]; // #1F2937

    // Configuration de la page
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let yPosition = margin;

    // Fonction helper pour ajouter du texte stylisé
    const addStyledText = (
      text: string,
      x: number,
      y: number,
      options: {
        fontSize?: number;
        fontStyle?: 'normal' | 'bold' | 'italic';
        color?: number[];
        align?: 'left' | 'center' | 'right';
      } = {}
    ) => {
      const {
        fontSize = 10,
        fontStyle = 'normal',
        color = textColor,
        align = 'left'
      } = options;

      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      doc.setTextColor(color[0], color[1], color[2]);

      const textWidth = doc.getTextWidth(text);
      let xPos = x;

      if (align === 'center') {
        xPos = (pageWidth - textWidth) / 2;
      } else if (align === 'right') {
        xPos = pageWidth - margin - textWidth;
      }

      doc.text(text, xPos, y);
    };

    // En-tête avec logo/branding
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');

    addStyledText('E-PILOT', margin, 20, {
      fontSize: 24,
      fontStyle: 'bold',
      color: [255, 255, 255],
    });

    addStyledText('Plateforme de Gestion Éducative', margin, 30, {
      fontSize: 10,
      color: [255, 255, 255],
    });

    yPosition = 60;

    // Titre de la facture
    addStyledText('FACTURE', margin, yPosition, {
      fontSize: 20,
      fontStyle: 'bold',
      color: primaryColor,
    });

    yPosition += 20;

    // Informations de la facture
    const invoiceInfo = [
      [`Numéro de facture: ${invoiceData.invoiceNumber}`, `Date: ${new Date(invoiceData.invoiceDate).toLocaleDateString('fr-FR')}`],
      [`Échéance: ${new Date(invoiceData.dueDate).toLocaleDateString('fr-FR')}`, `Statut: ${getStatusLabel(invoiceData.status)}`],
    ];

    invoiceInfo.forEach(row => {
      addStyledText(row[0], margin, yPosition);
      addStyledText(row[1], pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 8;
    });

    yPosition += 10;

    // Informations client
    doc.setFillColor(249, 250, 251); // bg-gray-50
    doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 30, 'F');

    addStyledText('CLIENT', margin, yPosition, {
      fontSize: 12,
      fontStyle: 'bold',
      color: secondaryColor,
    });

    yPosition += 8;
    addStyledText(invoiceData.schoolGroupName, margin, yPosition, {
      fontSize: 11,
      fontStyle: 'bold',
    });

    addStyledText(`Code: ${invoiceData.schoolGroupCode}`, margin, yPosition + 6);
    addStyledText(`Plan: ${invoiceData.planName}`, pageWidth - margin, yPosition + 6, { align: 'right' });

    yPosition += 25;

    // Période facturée
    addStyledText('PÉRIODE FACTURÉE', margin, yPosition, {
      fontSize: 12,
      fontStyle: 'bold',
      color: accentColor,
    });

    yPosition += 8;
    const periodText = `Du ${new Date(invoiceData.periodStart).toLocaleDateString('fr-FR')} au ${new Date(invoiceData.periodEnd).toLocaleDateString('fr-FR')}`;
    addStyledText(periodText, margin, yPosition);

    yPosition += 20;

    // Tableau des prestations
    const tableColumns = ['Description', 'Qté', 'Prix unit.', 'Total'];
    const tableRows = invoiceData.items.map(item => [
      item.description,
      item.quantity.toString(),
      `${item.unitPrice.toLocaleString()} FCFA`,
      `${item.totalPrice.toLocaleString()} FCFA`,
    ]);

    doc.autoTable({
      head: [tableColumns],
      body: tableRows,
      startY: yPosition,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        cellPadding: 5,
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Résumé des montants
    const summaryX = pageWidth - margin - 80;

    addStyledText('RÉSUMÉ', summaryX, yPosition, {
      fontSize: 12,
      fontStyle: 'bold',
      color: secondaryColor,
    });

    yPosition += 10;

    // Lignes du résumé
    const summaryLines = [
      ['Sous-total', `${invoiceData.subtotal.toLocaleString()} FCFA`],
    ];

    if (invoiceData.taxAmount > 0) {
      summaryLines.push([`TVA (${invoiceData.taxRate}%)`, `${invoiceData.taxAmount.toLocaleString()} FCFA`]);
    }

    if (invoiceData.discountAmount > 0) {
      summaryLines.push(['Remise', `-${invoiceData.discountAmount.toLocaleString()} FCFA`]);
    }

    summaryLines.forEach(([label, value]) => {
      addStyledText(label, summaryX, yPosition);
      addStyledText(value, pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 6;
    });

    // Total
    yPosition += 5;
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(summaryX, yPosition - 3, 80, 10, 'F');

    addStyledText('TOTAL', summaryX, yPosition + 2, {
      fontStyle: 'bold',
      color: [255, 255, 255],
    });

    addStyledText(`${invoiceData.totalAmount.toLocaleString()} FCFA`, pageWidth - margin, yPosition + 2, {
      align: 'right',
      fontStyle: 'bold',
      color: [255, 255, 255],
    });

    yPosition += 20;

    // Notes
    if (invoiceData.notes) {
      addStyledText('NOTES', margin, yPosition, {
        fontSize: 10,
        fontStyle: 'bold',
      });

      yPosition += 8;

      // Gestion du texte multiligne pour les notes
      const splitNotes = doc.splitTextToSize(invoiceData.notes, pageWidth - 2 * margin);
      addStyledText(splitNotes, margin, yPosition, { fontSize: 9 });

      yPosition += splitNotes.length * 5 + 10;
    }

    // Pied de page
    const footerY = pageHeight - 30;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, footerY, pageWidth - margin, footerY);

    addStyledText('E-PILOT - Plateforme de Gestion Éducative', pageWidth / 2, footerY + 10, {
      fontSize: 8,
      align: 'center',
      color: [107, 114, 128],
    });

    addStyledText(`Facture générée le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, pageWidth / 2, footerY + 15, {
      fontSize: 7,
      align: 'center',
      color: [107, 114, 128],
    });

    // Retourner le PDF comme Blob
    const pdfBlob = doc.output('blob');
    resolve(pdfBlob);
  });
};

// Fonction helper pour obtenir le label du statut
const getStatusLabel = (status: string): string => {
  const labels = {
    draft: 'Brouillon',
    sent: 'Envoyée',
    paid: 'Payée',
    overdue: 'En retard',
    cancelled: 'Annulée',
  };
  return labels[status as keyof typeof labels] || status;
};

// Fonction pour télécharger le PDF
export const downloadInvoicePDF = async (invoiceData: InvoicePDFData, filename?: string) => {
  const pdfBlob = await generateInvoicePDF(invoiceData);

  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `facture-${invoiceData.invoiceNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Fonction pour ouvrir le PDF dans un nouvel onglet
export const openInvoicePDF = async (invoiceData: InvoicePDFData) => {
  const pdfBlob = await generateInvoicePDF(invoiceData);

  const url = URL.createObjectURL(pdfBlob);
  window.open(url, '_blank');
  // Nettoyer l'URL après un délai
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
