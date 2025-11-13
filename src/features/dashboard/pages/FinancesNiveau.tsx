/**
 * Page Finances par Niveau - Drill-down niveau 2
 * Admin Groupe peut voir les détails financiers d'un niveau spécifique
 */

import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, DollarSign, AlertCircle, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface LevelDetail {
  schoolId: string;
  schoolName: string;
  level: string;
  totalRevenue: number;
  overdueAmount: number;
  recoveryRate: number;
  totalStudents: number;
  revenuePerStudent: number;
}

export default function FinancesNiveau() {
  const { schoolId, level } = useParams<{ schoolId: string; level: string }>();
  const navigate = useNavigate();

  const { data: levelData, isLoading } = useQuery<LevelDetail>({
    queryKey: ['level-financial-detail', schoolId, level],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('level_financial_stats')
        .select('*')
        .eq('school_id', schoolId)
        .eq('level', level)
        .single();

      if (error) throw error;

      return {
        schoolId: data.school_id,
        schoolName: data.school_name,
        level: data.level,
        totalRevenue: Number(data.total_revenue) || 0,
        overdueAmount: Number(data.overdue_amount) || 0,
        recoveryRate: Number(data.recovery_rate) || 0,
        totalStudents: Number(data.total_students) || 0,
        revenuePerStudent: Number(data.revenue_per_student) || 0,
      };
    },
    enabled: !!schoolId && !!level,
  });

  // Récupérer les élèves en retard de ce niveau
  const { data: overdueStudents } = useQuery({
    queryKey: ['overdue-students', schoolId, level],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name,
          student_fees!inner(
            amount,
            amount_paid,
            amount_remaining,
            status
          )
        `)
        .eq('school_id', schoolId)
        .eq('level', level)
        .eq('student_fees.status', 'overdue')
        .limit(20);

      if (error) throw error;

      return data?.map((student: any) => ({
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        overdueAmount: student.student_fees.reduce((sum: number, fee: any) => 
          sum + (Number(fee.amount_remaining) || 0), 0
        ),
      })) || [];
    },
    enabled: !!schoolId && !!level,
  });

  const formatCurrency = (amount: number) => {
    return `${(amount / 1000000).toFixed(2)}M FCFA`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2A9D8F]"></div>
      </div>
    );
  }

  if (!levelData) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Niveau non trouvé</h3>
          <Button onClick={() => navigate(`/dashboard/finances/ecole/${schoolId}`)}>
            Retour à l'école
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header avec retour */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/dashboard/finances/ecole/${schoolId}`)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-[#1D3557] flex items-center gap-2">
            <Users className="w-8 h-8 text-[#2A9D8F]" />
            {levelData.schoolName} - {levelData.level}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Détails financiers du niveau
          </p>
        </div>
      </div>

      {/* KPIs Niveau */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Élèves */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Élèves</span>
            <Users className="w-5 h-5 text-gray-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{levelData.totalStudents}</p>
        </Card>

        {/* Revenus */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Revenus Totaux</span>
            <DollarSign className="w-5 h-5 text-[#2A9D8F]" />
          </div>
          <p className="text-2xl font-bold text-[#2A9D8F]">{formatCurrency(levelData.totalRevenue)}</p>
        </Card>

        {/* Revenus par élève */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Revenus/Élève</span>
            <TrendingUp className="w-5 h-5 text-gray-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(levelData.revenuePerStudent)}</p>
        </Card>

        {/* Taux recouvrement */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Taux Recouvrement</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{levelData.recoveryRate.toFixed(1)}%</p>
          <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-[#2A9D8F] rounded-full transition-all"
              style={{ width: `${Math.min(levelData.recoveryRate, 100)}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Alerte retards */}
      {levelData.overdueAmount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 bg-red-50 border-red-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">Retards de paiement</h3>
                <p className="text-sm text-red-800">
                  {formatCurrency(levelData.overdueAmount)} de retards à recouvrer
                </p>
                <p className="text-xs text-red-700 mt-1">
                  {overdueStudents?.length || 0} élève(s) en retard
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Liste élèves en retard */}
      {overdueStudents && overdueStudents.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Élèves en Retard de Paiement</h3>
          <div className="space-y-3">
            {overdueStudents.map((student: any) => (
              <div 
                key={student.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-900">{student.name}</span>
                <Badge variant="destructive">
                  {formatCurrency(student.overdueAmount)}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Message si pas de retards */}
      {(!overdueStudents || overdueStudents.length === 0) && levelData.overdueAmount === 0 && (
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🎉</span>
            </div>
            <div>
              <h3 className="font-semibold text-green-900">Excellent !</h3>
              <p className="text-sm text-green-700">Aucun retard de paiement pour ce niveau</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
