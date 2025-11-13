/**
 * Utilitaires d'export CSV et PDF
 */

import type { SchoolWithDetails } from '@/features/dashboard/hooks/useSchools-simple';

// ============================================================================
// EXPORT CSV
// ============================================================================

export const exportToCSV = (schools: SchoolWithDetails[], filename: string = 'ecoles') => {
  // Préparer les données
  const data = schools.map((school) => ({
    'Nom': school.name,
    'Code': school.code,
    'Statut': school.status === 'active' ? 'Active' : school.status === 'inactive' ? 'Inactive' : 'Suspendue',
    'Département': (school as any).departement || '',
    'Ville': (school as any).city || '',
    'Commune': (school as any).commune || '',
    'Code Postal': (school as any).code_postal || '',
    'Adresse': school.address || '',
    'Téléphone': school.phone || '',
    'Email': school.email || '',
    'Nombre d\'élèves': school.student_count,
    'Nombre d\'enseignants': school.staff_count,
    'Groupe Scolaire': school.school_group_name || '',
    'Date de création': new Date(school.created_at).toLocaleDateString('fr-FR'),
  }));

  // Convertir en CSV
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header as keyof typeof row];
        // Échapper les virgules et guillemets
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Télécharger
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ============================================================================
// EXPORT PDF
// ============================================================================

export const exportToPDF = async (schools: SchoolWithDetails[], filename: string = 'ecoles') => {
  // Import dynamique de jspdf
  const { default: jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  const doc = new jsPDF();

  // En-tête
  doc.setFontSize(18);
  doc.setTextColor(29, 53, 87); // #1D3557
  doc.text('Liste des Écoles', 14, 20);

  // Date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, 28);

  // Statistiques
  const activeCount = schools.filter(s => s.status === 'active').length;
  const totalStudents = schools.reduce((sum, s) => sum + s.student_count, 0);
  const totalStaff = schools.reduce((sum, s) => sum + s.staff_count, 0);

  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(`Total: ${schools.length} écoles | Actives: ${activeCount} | Élèves: ${totalStudents} | Personnel: ${totalStaff}`, 14, 36);

  // Tableau
  const tableData = schools.map((school) => [
    school.name,
    school.code,
    school.status === 'active' ? 'Active' : school.status === 'inactive' ? 'Inactive' : 'Suspendue',
    (school as any).city || '-',
    school.student_count.toString(),
    school.staff_count.toString(),
  ]);

  (doc as any).autoTable({
    startY: 44,
    head: [['École', 'Code', 'Statut', 'Ville', 'Élèves', 'Personnel']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [29, 53, 87], // #1D3557
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 30 },
      2: { cellWidth: 25 },
      3: { cellWidth: 35 },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 25, halign: 'center' },
    },
  });

  // Pied de page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} sur ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Télécharger
  doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
};

// ============================================================================
// IMPORT CSV
// ============================================================================

export interface ImportedSchool {
  name: string;
  code: string;
  status: 'active' | 'inactive' | 'suspended';
  departement?: string;
  city?: string;
  commune?: string;
  code_postal?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export const parseCSV = (file: File): Promise<ImportedSchool[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          reject(new Error('Le fichier CSV est vide'));
          return;
        }

        // Parser les en-têtes
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        
        // Parser les données
        const schools: ImportedSchool[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          
          const school: any = {};
          headers.forEach((header, index) => {
            school[header] = values[index] || '';
          });

          // Mapper les colonnes françaises vers les champs anglais
          const mappedSchool: ImportedSchool = {
            name: school['Nom'] || school['name'] || '',
            code: school['Code'] || school['code'] || '',
            status: (school['Statut'] || school['status'] || 'active').toLowerCase() as any,
            departement: school['Département'] || school['departement'] || '',
            city: school['Ville'] || school['city'] || '',
            commune: school['Commune'] || school['commune'] || '',
            code_postal: school['Code Postal'] || school['code_postal'] || '',
            address: school['Adresse'] || school['address'] || '',
            phone: school['Téléphone'] || school['phone'] || '',
            email: school['Email'] || school['email'] || '',
          };

          // Normaliser le statut
          const statusStr = String(mappedSchool.status).toLowerCase();
          if (statusStr === 'active' || statusStr.includes('activ')) {
            mappedSchool.status = 'active';
          } else if (statusStr === 'inactive' || statusStr.includes('inactiv')) {
            mappedSchool.status = 'inactive';
          } else if (statusStr === 'suspended' || statusStr.includes('suspend')) {
            mappedSchool.status = 'suspended';
          } else {
            mappedSchool.status = 'active'; // Par défaut
          }

          if (mappedSchool.name && mappedSchool.code) {
            schools.push(mappedSchool);
          }
        }

        resolve(schools);
      } catch (error) {
        reject(new Error('Erreur lors du parsing du CSV: ' + (error as Error).message));
      }
    };

    reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
    reader.readAsText(file, 'UTF-8');
  });
};
