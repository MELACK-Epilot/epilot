/**
 * Utilitaires pour le tableau comparatif des plans
 * @module comparison-utils
 */

import type { PlanWithContent } from '../hooks/usePlanWithContent';

/**
 * Calcule le score de valeur d'un plan (rapport qualité/prix)
 */
export const calculateValueScore = (plan: PlanWithContent): number => {
  let score = 0;

  // Points pour les limites (40 points max)
  score += plan.maxSchools === -1 ? 10 : Math.min(plan.maxSchools / 10, 10);
  score += plan.maxStudents === -1 ? 10 : Math.min(plan.maxStudents / 1000, 10);
  score += plan.maxStaff === -1 ? 5 : Math.min(plan.maxStaff / 10, 5);
  score += Math.min(plan.maxStorage / 10, 5);

  // Points pour les fonctionnalités (30 points max)
  if (plan.customBranding) score += 10;
  if (plan.apiAccess) score += 10;
  if (plan.trialDays > 0) score += 5;
  if (plan.supportLevel === '24/7') score += 5;

  // Points pour le support (10 points max)
  if (plan.supportLevel === '24/7') score += 10;
  else if (plan.supportLevel === 'priority') score += 5;
  else score += 2;

  // Points pour le contenu (20 points max)
  score += Math.min((plan.categories?.length || 0) * 2, 10);
  score += Math.min((plan.modules?.length || 0) * 0.5, 10);

  // Score total sur 100
  const totalScore = score;

  // Diviser par le prix pour obtenir le rapport qualité/prix
  // Si gratuit, retourner le score brut
  if (plan.price === 0) {
    return Math.min(totalScore / 10, 10); // Score sur 10
  }

  // Sinon, calculer le rapport qualité/prix
  const priceInThousands = plan.price / 10000;
  const valueScore = totalScore / priceInThousands;

  // Normaliser sur 10
  return Math.min(Math.round(valueScore * 10) / 10, 10);
};

/**
 * Filtre les plans selon les critères
 */
export interface PlanFilters {
  priceRange: 'all' | 'free' | 'low' | 'medium' | 'high';
  features: string[];
  minSchools: number;
  searchQuery: string;
}

export const filterPlans = (
  plans: PlanWithContent[],
  filters: PlanFilters
): PlanWithContent[] => {
  return plans.filter((plan) => {
    // Filtre par prix
    if (filters.priceRange !== 'all') {
      if (filters.priceRange === 'free' && plan.price > 0) return false;
      if (filters.priceRange === 'low' && (plan.price < 1 || plan.price > 200000)) return false;
      if (filters.priceRange === 'medium' && (plan.price < 200000 || plan.price > 500000)) return false;
      if (filters.priceRange === 'high' && plan.price < 500000) return false;
    }

    // Filtre par fonctionnalités
    if (filters.features.length > 0) {
      if (filters.features.includes('apiAccess') && !plan.apiAccess) return false;
      if (filters.features.includes('customBranding') && !plan.customBranding) return false;
      if (filters.features.includes('trial') && !plan.trialDays) return false;
    }

    // Filtre par nombre d'écoles
    if (filters.minSchools > 0) {
      if (plan.maxSchools !== -1 && plan.maxSchools < filters.minSchools) return false;
    }

    // Filtre par recherche
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const searchableText = `${plan.name} ${plan.slug}`.toLowerCase();
      if (!searchableText.includes(query)) return false;
    }

    return true;
  });
};

/**
 * Compare deux plans et retourne les différences
 */
export const compareTwoPlans = (
  plan1: PlanWithContent,
  plan2: PlanWithContent
): {
  key: string;
  label: string;
  plan1Value: any;
  plan2Value: any;
  isDifferent: boolean;
}[] => {
  const comparisons = [
    {
      key: 'price',
      label: 'Prix',
      plan1Value: plan1.price,
      plan2Value: plan2.price,
    },
    {
      key: 'maxSchools',
      label: 'Écoles',
      plan1Value: plan1.maxSchools,
      plan2Value: plan2.maxSchools,
    },
    {
      key: 'maxStudents',
      label: 'Élèves',
      plan1Value: plan1.maxStudents,
      plan2Value: plan2.maxStudents,
    },
    {
      key: 'maxStaff',
      label: 'Personnel',
      plan1Value: plan1.maxStaff,
      plan2Value: plan2.maxStaff,
    },
    {
      key: 'maxStorage',
      label: 'Stockage',
      plan1Value: plan1.maxStorage,
      plan2Value: plan2.maxStorage,
    },
    {
      key: 'supportLevel',
      label: 'Support',
      plan1Value: plan1.supportLevel,
      plan2Value: plan2.supportLevel,
    },
    {
      key: 'customBranding',
      label: 'Branding',
      plan1Value: plan1.customBranding,
      plan2Value: plan2.customBranding,
    },
    {
      key: 'apiAccess',
      label: 'API',
      plan1Value: plan1.apiAccess,
      plan2Value: plan2.apiAccess,
    },
    {
      key: 'trialDays',
      label: 'Essai',
      plan1Value: plan1.trialDays,
      plan2Value: plan2.trialDays,
    },
    {
      key: 'modules',
      label: 'Modules',
      plan1Value: plan1.modules?.length || 0,
      plan2Value: plan2.modules?.length || 0,
    },
  ];

  return comparisons.map((comp) => ({
    ...comp,
    isDifferent: JSON.stringify(comp.plan1Value) !== JSON.stringify(comp.plan2Value),
  }));
};

/**
 * Exporte les plans en format Excel
 */
export const exportPlansToExcel = (plans: PlanWithContent[]): void => {
  const data = plans.map((plan) => ({
    Plan: plan.name,
    Prix: `${plan.price.toLocaleString()} ${plan.currency}`,
    'Période': plan.billingPeriod === 'yearly' ? 'Annuel' : 'Mensuel',
    'Écoles': plan.maxSchools === -1 ? 'Illimité' : plan.maxSchools,
    'Élèves': plan.maxStudents === -1 ? 'Illimité' : plan.maxStudents.toLocaleString(),
    'Personnel': plan.maxStaff === -1 ? 'Illimité' : plan.maxStaff,
    'Stockage (GB)': plan.maxStorage,
    'Support': plan.supportLevel,
    'Branding': plan.customBranding ? 'Oui' : 'Non',
    'API': plan.apiAccess ? 'Oui' : 'Non',
    'Essai (jours)': plan.trialDays || 'Non',
    'Catégories': plan.categories?.length || 0,
    'Modules': plan.modules?.length || 0,
    'Score Valeur': calculateValueScore(plan).toFixed(1),
  }));

  // Créer le CSV
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => `"${row[header as keyof typeof row]}"`).join(',')
    ),
  ].join('\n');

  // Télécharger
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `Comparaison_Plans_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exporte les plans en format PDF (simplifié)
 */
export const exportPlansToPDF = (plans: PlanWithContent[]): void => {
  // Pour une vraie implémentation PDF, utiliser jsPDF
  // Pour l'instant, on ouvre une fenêtre d'impression
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Comparaison des Plans</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #1e40af; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #1e40af; color: white; }
        tr:nth-child(even) { background-color: #f9fafb; }
        .score { font-weight: bold; color: #059669; }
      </style>
    </head>
    <body>
      <h1>Comparaison des Plans E-Pilot</h1>
      <p>Date: ${new Date().toLocaleDateString('fr-FR')}</p>
      <table>
        <thead>
          <tr>
            <th>Plan</th>
            <th>Prix</th>
            <th>Écoles</th>
            <th>Élèves</th>
            <th>Support</th>
            <th>Modules</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          ${plans
            .map(
              (plan) => `
            <tr>
              <td><strong>${plan.name}</strong></td>
              <td>${plan.price.toLocaleString()} ${plan.currency}</td>
              <td>${plan.maxSchools === -1 ? 'Illimité' : plan.maxSchools}</td>
              <td>${plan.maxStudents === -1 ? 'Illimité' : plan.maxStudents.toLocaleString()}</td>
              <td>${plan.supportLevel}</td>
              <td>${plan.modules?.length || 0}</td>
              <td class="score">${calculateValueScore(plan).toFixed(1)}/10</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
};
