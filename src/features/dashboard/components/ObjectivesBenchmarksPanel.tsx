/**
 * Composant Objectifs & Benchmarks
 * Affiche les objectifs et la position par rapport au secteur
 */

import { motion } from 'framer-motion';
import { Target, TrendingUp, Award, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useObjectivesBenchmarks } from '../hooks/useObjectivesBenchmarks';
import { formatCurrency } from '@/utils/formatters';

export function ObjectivesBenchmarksPanel() {
  const { data: objectives, isLoading } = useObjectivesBenchmarks();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-500" />
            Objectifs & Benchmarks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!objectives) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-500" />
            Objectifs & Benchmarks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            Données insuffisantes pour calculer les objectifs
          </p>
        </CardContent>
      </Card>
    );
  }

  const monthlyProgress = Math.min(
    (objectives.current_revenue / objectives.monthly_target) * 100,
    100
  );

  const annualProgress = Math.min(
    (objectives.current_revenue / objectives.annual_target) * 100,
    100
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-500" />
          Objectifs & Benchmarks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Objectif Mensuel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Objectif Mensuel</p>
                <p className="text-xs text-gray-500">Basé sur moyenne 3 derniers mois +10%</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-700">
                {objectives.monthly_achievement_rate.toFixed(0)}%
              </p>
              <p className="text-xs text-gray-600">Réalisé</p>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Actuel: {formatCurrency(objectives.current_revenue)}</span>
              <span>Cible: {formatCurrency(objectives.monthly_target)}</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${monthlyProgress}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-end pr-2"
              >
                {monthlyProgress > 20 && (
                  <span className="text-[10px] font-bold text-white">
                    {monthlyProgress.toFixed(0)}%
                  </span>
                )}
              </motion.div>
            </div>
          </div>

          {/* Message de motivation */}
          {objectives.monthly_achievement_rate >= 100 ? (
            <div className="mt-3 p-2 bg-green-100 rounded-lg flex items-center gap-2">
              <Award className="w-4 h-4 text-green-600" />
              <p className="text-xs font-medium text-green-700">
                🎉 Objectif mensuel atteint ! Excellent travail !
              </p>
            </div>
          ) : objectives.monthly_achievement_rate >= 80 ? (
            <div className="mt-3 p-2 bg-yellow-100 rounded-lg flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-yellow-600" />
              <p className="text-xs font-medium text-yellow-700">
                Presque ! Encore {(100 - objectives.monthly_achievement_rate).toFixed(0)}% pour atteindre l'objectif
              </p>
            </div>
          ) : (
            <div className="mt-3 p-2 bg-orange-100 rounded-lg flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-600" />
              <p className="text-xs font-medium text-orange-700">
                Il reste {formatCurrency(objectives.monthly_target - objectives.current_revenue)} à réaliser
              </p>
            </div>
          )}
        </motion.div>

        {/* Objectif Annuel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-500 rounded-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Objectif Annuel</p>
                <p className="text-xs text-gray-500">Année précédente +15%</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-700">
                {annualProgress.toFixed(0)}%
              </p>
              <p className="text-xs text-gray-600">Réalisé</p>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Actuel: {formatCurrency(objectives.current_revenue)}</span>
              <span>Cible: {formatCurrency(objectives.annual_target)}</span>
            </div>
            <div className="w-full bg-purple-200 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${annualProgress}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-end pr-2"
              >
                {annualProgress > 20 && (
                  <span className="text-[10px] font-bold text-white">
                    {annualProgress.toFixed(0)}%
                  </span>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Benchmark Secteur */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-500 rounded-lg">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Position Secteur</p>
                <p className="text-xs text-gray-500">Comparaison avec autres groupes</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-700">
                {objectives.benchmark_position.toFixed(0)}%
              </p>
              <p className="text-xs text-gray-600">vs Moyenne</p>
            </div>
          </div>

          {/* Comparaison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 bg-white rounded-lg">
              <p className="text-xs text-gray-500">Votre Groupe</p>
              <p className="text-sm font-bold text-gray-900">
                {formatCurrency(objectives.current_revenue)}
              </p>
            </div>
            <div className="p-2 bg-white rounded-lg">
              <p className="text-xs text-gray-500">Moyenne Secteur</p>
              <p className="text-sm font-bold text-gray-900">
                {formatCurrency(objectives.sector_benchmark)}
              </p>
            </div>
          </div>

          {/* Message de performance */}
          {objectives.benchmark_position >= 120 ? (
            <div className="mt-3 p-2 bg-green-200 rounded-lg flex items-center gap-2">
              <Award className="w-4 h-4 text-green-700" />
              <p className="text-xs font-bold text-green-800">
                🏆 Excellent ! Vous êtes {(objectives.benchmark_position - 100).toFixed(0)}% au-dessus de la moyenne !
              </p>
            </div>
          ) : objectives.benchmark_position >= 100 ? (
            <div className="mt-3 p-2 bg-green-100 rounded-lg flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <p className="text-xs font-medium text-green-700">
                ✅ Vous êtes au-dessus de la moyenne du secteur
              </p>
            </div>
          ) : objectives.benchmark_position >= 80 ? (
            <div className="mt-3 p-2 bg-yellow-100 rounded-lg flex items-center gap-2">
              <Target className="w-4 h-4 text-yellow-600" />
              <p className="text-xs font-medium text-yellow-700">
                Proche de la moyenne, continuez vos efforts !
              </p>
            </div>
          ) : (
            <div className="mt-3 p-2 bg-orange-100 rounded-lg flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-orange-600" />
              <p className="text-xs font-medium text-orange-700">
                Marge de progression : {(100 - objectives.benchmark_position).toFixed(0)}%
              </p>
            </div>
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
}
