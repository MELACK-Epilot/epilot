/**
 * Module pour charger les données de tendance sur 6 mois
 */

import { supabase } from '@/lib/supabase';
import type { TrendData } from './types';

interface LoadTrendDataParams {
  schoolId: string;
}

export async function loadTrendData({ schoolId }: LoadTrendDataParams): Promise<TrendData[]> {
  if (!schoolId) return [];

  try {
    const trendData: TrendData[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const period = date.toISOString().slice(0, 7); // Format: YYYY-MM

      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const startOfNextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

      // Requête pour les étudiants actifs à la fin du mois
      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('status', 'active')
        .lte('enrollment_date', endOfMonth.toISOString());

      // Requête pour les revenus de ce mois (table fee_payments)
      const { data: paymentsData } = await supabase
        .from('fee_payments')
        .select('amount')
        .eq('school_id', schoolId)
        .in('status', ['paid', 'completed'])
        .gte('created_at', date.toISOString())
        .lt('created_at', startOfNextMonth.toISOString());

      const revenue = paymentsData?.reduce((sum, payment: any) => sum + (payment.amount || 0), 0) || 0;

      // Requête pour les enseignants actifs (table users)
      const { count: teachersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('role', 'enseignant')
        .eq('status', 'active')
        .lte('created_at', endOfMonth.toISOString());

      // ✅ Calculer le VRAI taux de réussite pour ce mois
      let successRate = 0;

      // Récupérer les IDs des élèves actifs pendant ce mois
      const { data: monthStudentsIds } = await supabase
        .from('students')
        .select('id')
        .eq('school_id', schoolId)
        .eq('status', 'active')
        .lte('enrollment_date', endOfMonth.toISOString());

      const studentIdsList = monthStudentsIds?.map((s: any) => s.id) || [];

      if (studentIdsList.length > 0) {
        // Récupérer les notes de ce mois
        const { data: monthGrades } = await supabase
          .from('grades')
          .select('grade')
          .in('student_id', studentIdsList)
          .gte('created_at', date.toISOString())
          .lt('created_at', startOfNextMonth.toISOString());

        if (monthGrades && monthGrades.length > 0) {
          // Calculer la moyenne des notes (sur 20)
          const totalGrades = monthGrades.reduce((sum: number, g: any) => sum + (g.grade || 0), 0);
          const averageGrade = totalGrades / monthGrades.length;
          
          // Convertir en pourcentage
          successRate = Math.round((averageGrade / 20) * 100);
          
          console.log(`📊 Taux réussite ${period}: ${successRate}% (${monthGrades.length} notes)`);
        } else {
          // Si pas de notes ce mois, essayer avec les bulletins
          const { data: monthReportCards } = await supabase
            .from('report_cards')
            .select('overall_average')
            .in('student_id', studentIdsList)
            .gte('created_at', date.toISOString())
            .lt('created_at', startOfNextMonth.toISOString());

          if (monthReportCards && monthReportCards.length > 0) {
            const totalAverages = monthReportCards.reduce((sum: number, rc: any) => sum + (rc.overall_average || 0), 0);
            const overallAverage = totalAverages / monthReportCards.length;
            successRate = Math.round((overallAverage / 20) * 100);
            
            console.log(`📊 Taux réussite ${period}: ${successRate}% (${monthReportCards.length} bulletins)`);
          } else {
            // Aucune donnée de notes pour ce mois
            successRate = 0;
            console.log(`⚠️ Pas de notes pour ${period}, taux = 0%`);
          }
        }
      } else {
        successRate = 0;
        console.log(`⚠️ Pas d'élèves pour ${period}, taux = 0%`);
      }

      trendData.push({
        period,
        students: studentsCount || 0,
        success_rate: successRate,
        revenue,
        teachers: teachersCount || 0,
      });
    }

    console.log('📈 Tendances chargées:', trendData.length, 'mois (données réelles)');
    return trendData;
  } catch (error) {
    console.error('❌ Erreur lors du chargement des tendances:', error);
    return [];
  }
}
