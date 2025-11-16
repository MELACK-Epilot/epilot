/**
 * Module pour charger les niveaux scolaires dynamiquement
 */

import { supabase } from '@/lib/supabase';
import type { SchoolLevel } from './types';

interface LoadSchoolLevelsParams {
  schoolId: string;
}

export async function loadSchoolLevels({ schoolId }: LoadSchoolLevelsParams): Promise<SchoolLevel[]> {
  console.log('🔍 DEBUG loadSchoolLevels - schoolId:', schoolId);

  if (!schoolId) {
    console.error('⚠️ Pas de schoolId, chargement annulé');
    return [];
  }

  try {
    console.log('🔄 Chargement dashboard pour école:', schoolId);
    
    // ✅ Récupérer les niveaux actifs de l'école depuis la table schools
    const { data: schoolData, error: schoolError } = await supabase
      .from('schools')
      .select('has_preschool, has_primary, has_middle, has_high')
      .eq('id', schoolId)
      .single<{
        has_preschool: boolean;
        has_primary: boolean;
        has_middle: boolean;
        has_high: boolean;
      }>();

    if (schoolError) {
      console.error('❌ Erreur récupération niveaux école:', schoolError);
      throw schoolError;
    }

    if (!schoolData) {
      console.warn('⚠️ École non trouvée');
      return [];
    }

    console.log('🏫 Niveaux actifs de l\'école:', schoolData);
    
    // Mapping des niveaux avec leurs propriétés visuelles (Couleurs officielles E-Pilot)
    const niveauxMapping = [
      { 
        key: 'has_preschool' as const,
        id: 'maternelle', 
        name: 'Maternelle', 
        color: 'bg-[#1D3557]',  // Bleu Foncé Institutionnel
        icon: 'Baby', 
        level_key: 'maternelle',
        enabled: schoolData.has_preschool 
      },
      { 
        key: 'has_primary' as const,
        id: 'primaire', 
        name: 'Primaire', 
        color: 'bg-[#2A9D8F]',  // Vert Cité Positive
        icon: 'BookOpen', 
        level_key: 'primaire',
        enabled: schoolData.has_primary 
      },
      { 
        key: 'has_middle' as const,
        id: 'college', 
        name: 'Collège', 
        color: 'bg-[#E9C46A]',  // Or Républicain
        icon: 'Building2', 
        level_key: 'college',
        enabled: schoolData.has_middle 
      },
      { 
        key: 'has_high' as const,
        id: 'lycee', 
        name: 'Lycée', 
        color: 'bg-[#E63946]',  // Rouge Sobre
        icon: 'GraduationCap', 
        level_key: 'lycee',
        enabled: schoolData.has_high 
      },
    ];

    // Filtrer uniquement les niveaux actifs pour cette école
    const niveauxActifs = niveauxMapping.filter(niveau => niveau.enabled);
    
    console.log(`✅ ${niveauxActifs.length} niveau(x) actif(s):`, niveauxActifs.map(n => n.name).join(', '));

    const schoolLevels: SchoolLevel[] = [];
    
    // Boucler uniquement sur les niveaux actifs de l'école
    for (const niveau of niveauxActifs) {
      // Compter les étudiants par niveau depuis la table students
      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('level', niveau.level_key)
        .eq('status', 'active');

      // Compter les classes par niveau depuis la table classes
      const { count: classesCount } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .ilike('level', `%${niveau.level_key}%`)
        .eq('status', 'active');

      // Compter les enseignants actifs (via la table users avec role enseignant)
      const { data: teachersData } = await supabase
        .from('users')
        .select('id')
        .eq('school_id', schoolId)
        .eq('role', 'enseignant')
        .eq('status', 'active');

      const teachersCount = teachersData?.length || 0;

      // ✅ Calculer le VRAI taux de réussite depuis les notes (table grades)
      let successRate = 0;
      
      // Récupérer les IDs des élèves de ce niveau
      const { data: studentsIds } = await supabase
        .from('students')
        .select('id')
        .eq('school_id', schoolId)
        .eq('level', niveau.level_key)
        .eq('status', 'active');

      const studentIdsList = studentsIds?.map((s: any) => s.id) || [];

      if (studentIdsList.length > 0) {
        // Récupérer toutes les notes des élèves de ce niveau
        const { data: gradesData } = await supabase
          .from('grades')
          .select('grade')
          .in('student_id', studentIdsList);

        if (gradesData && gradesData.length > 0) {
          // Calculer la moyenne des notes (sur 20)
          const totalGrades = gradesData.reduce((sum: number, g: any) => sum + (g.grade || 0), 0);
          const averageGrade = totalGrades / gradesData.length;
          
          // Convertir en pourcentage (note/20 * 100)
          successRate = Math.round((averageGrade / 20) * 100);
          
          console.log(`📊 Taux réussite ${niveau.name}: ${successRate}% (${gradesData.length} notes)`);
        } else {
          // Si pas de notes, essayer avec les bulletins (report_cards)
          const { data: reportCardsData } = await supabase
            .from('report_cards')
            .select('overall_average')
            .in('student_id', studentIdsList);

          if (reportCardsData && reportCardsData.length > 0) {
            const totalAverages = reportCardsData.reduce((sum: number, rc: any) => sum + (rc.overall_average || 0), 0);
            const overallAverage = totalAverages / reportCardsData.length;
            successRate = Math.round((overallAverage / 20) * 100);
            
            console.log(`📊 Taux réussite ${niveau.name}: ${successRate}% (${reportCardsData.length} bulletins)`);
          } else {
            // Aucune donnée de notes disponible
            successRate = 0;
            console.log(`⚠️ Pas de notes pour ${niveau.name}, taux = 0%`);
          }
        }
      } else {
        successRate = 0;
        console.log(`⚠️ Pas d'élèves pour ${niveau.name}, taux = 0%`);
      }

      // Calculer les revenus du mois (basé sur fee_payments)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: paymentsData } = await supabase
        .from('fee_payments')
        .select('amount')
        .eq('school_id', schoolId)
        .in('status', ['paid', 'completed'])
        .gte('created_at', startOfMonth.toISOString());

      const revenue = paymentsData?.reduce((sum, payment: any) => sum + (payment.amount || 0), 0) || 0;

      // Calculer la tendance (comparaison avec le mois dernier)
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      lastMonth.setDate(1);
      lastMonth.setHours(0, 0, 0, 0);

      const { count: lastMonthStudents } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('level', niveau.level_key)
        .eq('status', 'active')
        .lt('created_at', startOfMonth.toISOString());

      const trend = (studentsCount || 0) > (lastMonthStudents || 0) ? 'up' : 
                   (studentsCount || 0) < (lastMonthStudents || 0) ? 'down' : 'stable';

      // ✅ TOUJOURS ajouter le niveau, même s'il est vide
      // Cela permet au Proviseur de voir tous les niveaux actifs
      schoolLevels.push({
        id: niveau.id,
        name: niveau.name,
        color: niveau.color,
        icon: niveau.icon,
        students_count: studentsCount || 0,
        classes_count: classesCount || 0,
        teachers_count: teachersCount,
        success_rate: successRate,
        revenue,
        trend,
      });
    }

    console.log('✅ Niveaux chargés:', schoolLevels.length);
    return schoolLevels;
  } catch (error) {
    console.error('❌ Erreur lors du chargement des niveaux:', error);
    throw error;
  }
}
