/**
 * Système de prévisions financières avec IA
 * Utilise régression linéaire et détection d'anomalies
 */

import { MonthlyFinancialData } from '../features/dashboard/hooks/useFinancialHistory';
import { addMonths, format } from 'date-fns';

interface ForecastResult {
  month: string;
  monthLabel: string;
  predictedRevenue: number;
  predictedExpenses: number;
  predictedProfit: number;
  confidence: number; // 0-100
  trend: 'up' | 'down' | 'stable';
}

interface Anomaly {
  month: string;
  type: 'revenue' | 'expense';
  value: number;
  expectedValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Calcule la régression linéaire simple
 */
const linearRegression = (data: number[]): { slope: number; intercept: number } => {
  const n = data.length;
  const xValues = Array.from({ length: n }, (_, i) => i);
  
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = data.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * data[i], 0);
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
};

/**
 * Calcule la moyenne
 */
const mean = (data: number[]): number => {
  return data.reduce((a, b) => a + b, 0) / data.length;
};

/**
 * Calcule l'écart-type
 */
const standardDeviation = (data: number[]): number => {
  const avg = mean(data);
  const squareDiffs = data.map((value) => Math.pow(value - avg, 2));
  return Math.sqrt(mean(squareDiffs));
};

/**
 * Calcule la saisonnalité (moyenne par mois de l'année)
 */
const calculateSeasonality = (data: MonthlyFinancialData[]): Record<number, number> => {
  const seasonality: Record<number, number[]> = {};
  
  data.forEach((item) => {
    const monthIndex = new Date(item.month + '-01').getMonth();
    if (!seasonality[monthIndex]) {
      seasonality[monthIndex] = [];
    }
    seasonality[monthIndex].push(item.revenue);
  });
  
  const seasonalityAvg: Record<number, number> = {};
  Object.keys(seasonality).forEach((month) => {
    const monthNum = parseInt(month);
    seasonalityAvg[monthNum] = mean(seasonality[monthNum]);
  });
  
  return seasonalityAvg;
};

/**
 * Génère des prévisions financières
 */
export const forecastFinancials = (
  historicalData: MonthlyFinancialData[],
  monthsAhead: number = 3
): ForecastResult[] => {
  if (historicalData.length < 3) {
    return [];
  }

  // Extraire les données
  const revenues = historicalData.map((d) => d.revenue);
  const expenses = historicalData.map((d) => d.expenses);
  
  // Calculer les régressions
  const revenueRegression = linearRegression(revenues);
  const expenseRegression = linearRegression(expenses);
  
  // Calculer la saisonnalité
  const seasonality = calculateSeasonality(historicalData);
  
  // Calculer la confiance (basée sur la variance)
  const revenueStdDev = standardDeviation(revenues);
  const revenueAvg = mean(revenues);
  const coefficientOfVariation = (revenueStdDev / revenueAvg) * 100;
  
  // Confiance inversement proportionnelle à la variation
  const baseConfidence = Math.max(50, 100 - coefficientOfVariation);
  
  // Générer les prévisions
  const forecasts: ForecastResult[] = [];
  const lastMonth = new Date(historicalData[historicalData.length - 1].month + '-01');
  
  for (let i = 1; i <= monthsAhead; i++) {
    const futureMonth = addMonths(lastMonth, i);
    const monthIndex = futureMonth.getMonth();
    const xValue = historicalData.length + i - 1;
    
    // Prévision de base (régression)
    let predictedRevenue = revenueRegression.slope * xValue + revenueRegression.intercept;
    let predictedExpenses = expenseRegression.slope * xValue + expenseRegression.intercept;
    
    // Ajustement saisonnier (si données disponibles)
    if (seasonality[monthIndex]) {
      const seasonalFactor = seasonality[monthIndex] / revenueAvg;
      predictedRevenue *= seasonalFactor;
    }
    
    // Calcul du profit
    const predictedProfit = predictedRevenue - predictedExpenses;
    
    // Tendance
    const lastRevenue = revenues[revenues.length - 1];
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (predictedRevenue > lastRevenue * 1.05) trend = 'up';
    else if (predictedRevenue < lastRevenue * 0.95) trend = 'down';
    
    // Confiance décroissante avec la distance
    const confidence = Math.max(30, baseConfidence - (i - 1) * 10);
    
    forecasts.push({
      month: format(futureMonth, 'yyyy-MM'),
      monthLabel: format(futureMonth, 'MMM yyyy'),
      predictedRevenue: Math.max(0, predictedRevenue),
      predictedExpenses: Math.max(0, predictedExpenses),
      predictedProfit,
      confidence,
      trend,
    });
  }
  
  return forecasts;
};

/**
 * Détecte les anomalies dans les données historiques
 */
export const detectAnomalies = (
  historicalData: MonthlyFinancialData[]
): Anomaly[] => {
  if (historicalData.length < 6) {
    return [];
  }

  const anomalies: Anomaly[] = [];
  
  // Calculer les moyennes et écarts-types
  const revenues = historicalData.map((d) => d.revenue);
  const expenses = historicalData.map((d) => d.expenses);
  
  const revenueMean = mean(revenues);
  const revenueStdDev = standardDeviation(revenues);
  const expenseMean = mean(expenses);
  const expenseStdDev = standardDeviation(expenses);
  
  // Détecter les anomalies (Z-score > 2)
  historicalData.forEach((data) => {
    // Anomalie revenus
    const revenueZScore = Math.abs((data.revenue - revenueMean) / revenueStdDev);
    if (revenueZScore > 2) {
      const deviation = ((data.revenue - revenueMean) / revenueMean) * 100;
      anomalies.push({
        month: data.monthLabel,
        type: 'revenue',
        value: data.revenue,
        expectedValue: revenueMean,
        deviation,
        severity: revenueZScore > 3 ? 'high' : revenueZScore > 2.5 ? 'medium' : 'low',
      });
    }
    
    // Anomalie dépenses
    const expenseZScore = Math.abs((data.expenses - expenseMean) / expenseStdDev);
    if (expenseZScore > 2) {
      const deviation = ((data.expenses - expenseMean) / expenseMean) * 100;
      anomalies.push({
        month: data.monthLabel,
        type: 'expense',
        value: data.expenses,
        expectedValue: expenseMean,
        deviation,
        severity: expenseZScore > 3 ? 'high' : expenseZScore > 2.5 ? 'medium' : 'low',
      });
    }
  });
  
  return anomalies;
};

/**
 * Génère des recommandations basées sur les prévisions
 */
export const generateRecommendations = (
  forecasts: ForecastResult[],
  currentStats: { totalRevenue: number; totalExpenses: number; profitMargin: number }
): string[] => {
  const recommendations: string[] = [];
  
  if (forecasts.length === 0) {
    return ['Pas assez de données historiques pour générer des recommandations.'];
  }
  
  const nextMonth = forecasts[0];
  const threeMonthsAhead = forecasts[forecasts.length - 1];
  
  // Recommandation 1 : Tendance négative
  if (nextMonth.trend === 'down') {
    recommendations.push(
      `⚠️ Baisse des revenus prévue le mois prochain (-${((currentStats.totalRevenue - nextMonth.predictedRevenue) / currentStats.totalRevenue * 100).toFixed(1)}%). Envisagez des actions commerciales.`
    );
  }
  
  // Recommandation 2 : Déficit prévu
  if (threeMonthsAhead.predictedProfit < 0) {
    recommendations.push(
      `🔴 ALERTE : Risque de déficit dans 3 mois. Réduisez les dépenses ou augmentez les revenus dès maintenant.`
    );
  }
  
  // Recommandation 3 : Marge faible
  const predictedMargin = (threeMonthsAhead.predictedProfit / threeMonthsAhead.predictedRevenue) * 100;
  if (predictedMargin < 15) {
    recommendations.push(
      `🟠 Marge prévue faible (${predictedMargin.toFixed(1)}%). Optimisez vos dépenses opérationnelles.`
    );
  }
  
  // Recommandation 4 : Tendance positive
  if (nextMonth.trend === 'up' && threeMonthsAhead.trend === 'up') {
    recommendations.push(
      `✅ Tendance positive confirmée ! Profitez-en pour investir dans le développement.`
    );
  }
  
  // Recommandation 5 : Confiance faible
  if (nextMonth.confidence < 60) {
    recommendations.push(
      `⚠️ Prévisions peu fiables (confiance: ${nextMonth.confidence.toFixed(0)}%). Collectez plus de données historiques.`
    );
  }
  
  return recommendations.length > 0 
    ? recommendations 
    : ['✅ Situation financière stable. Continuez sur cette lancée !'];
};
