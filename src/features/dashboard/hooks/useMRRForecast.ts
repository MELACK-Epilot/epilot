/**
 * Hook pour récupérer les prévisions MRR basées sur l'IA
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface MRRForecastData {
  months: string[];
  values: number[];
  total: number;
  confidence: number;
}

export const useMRRForecast = (monthsAhead: number = 3) => {
  return useQuery({
    queryKey: ['mrr-forecast', monthsAhead],
    queryFn: async (): Promise<MRRForecastData> => {
      try {
        // Appeler la fonction RPC Supabase
        const { data, error } = await supabase.rpc('forecast_mrr_ai', {
          months_ahead: monthsAhead,
        });

        if (error) {
          console.error('Erreur RPC forecast_mrr_ai:', error);
          throw error;
        }

        // Si pas de données, retourner des prévisions mock
        if (!data || (data as any[]).length === 0) {
          return generateMockForecast(monthsAhead);
        }

        const total = (data as any[]).reduce((sum: number, d: any) => sum + d.forecast_mrr, 0);

        return {
          months: (data as any[]).map((d: any) => d.month_name),
          values: (data as any[]).map((d: any) => d.forecast_mrr),
          total,
          confidence: (data as any)[0]?.confidence_score || 85,
        };
      } catch (error) {
        console.error('Erreur useMRRForecast:', error);
        return generateMockForecast(monthsAhead);
      }
    },
    staleTime: 30 * 60 * 1000, // 30 minutes (prévisions changent moins souvent)
    gcTime: 60 * 60 * 1000, // 1 heure
  });
};

/**
 * Génère des prévisions mock basées sur une croissance linéaire
 */
function generateMockForecast(monthsAhead: number): MRRForecastData {
  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  const currentMonth = new Date().getMonth();
  
  const months: string[] = [];
  const values: number[] = [];
  
  // Valeur MRR actuelle estimée
  const currentMRR = 12500000; // 12.5M FCFA
  const monthlyGrowthRate = 0.08; // 8% de croissance mensuelle
  
  for (let i = 1; i <= monthsAhead; i++) {
    const monthIndex = (currentMonth + i) % 12;
    months.push(monthNames[monthIndex]);
    
    // Prévision avec croissance + variation aléatoire
    const forecast = currentMRR * Math.pow(1 + monthlyGrowthRate, i);
    const randomVariation = (Math.random() - 0.5) * 500000; // ±250k variation
    values.push(Math.round(forecast + randomVariation));
  }
  
  const total = values.reduce((sum, val) => sum + val, 0);
  
  return {
    months,
    values,
    total,
    confidence: 85, // 85% de confiance
  };
}
