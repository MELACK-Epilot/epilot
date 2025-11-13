/**
 * Composant Top 3 Écoles par Revenus
 * Affiche le podium des meilleures écoles
 */

import { motion } from 'framer-motion';
import { Trophy, TrendingUp, DollarSign, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTopSchoolsByRevenue } from '../hooks/useTopSchools';
import { formatCurrency } from '@/utils/formatters';

export function TopSchoolsPanel() {
  const { data: topSchools, isLoading } = useTopSchoolsByRevenue(3);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Top 3 Écoles (Revenus)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!topSchools || topSchools.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Top 3 Écoles (Revenus)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            Aucune donnée disponible
          </p>
        </CardContent>
      </Card>
    );
  }

  const medals = [
    { color: 'from-yellow-400 to-yellow-600', icon: '🥇', rank: 1 },
    { color: 'from-gray-300 to-gray-500', icon: '🥈', rank: 2 },
    { color: 'from-orange-400 to-orange-600', icon: '🥉', rank: 3 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Top 3 Écoles (Revenus)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topSchools.slice(0, 3).map((school, index) => {
            const medal = medals[index];
            
            return (
              <motion.div
                key={school.school_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative overflow-hidden rounded-xl border-2 hover:shadow-lg transition-all duration-300"
                style={{
                  borderColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'
                }}
              >
                {/* Badge Rang */}
                <div className="absolute top-0 left-0 w-16 h-16">
                  <div className={`absolute inset-0 bg-gradient-to-br ${medal.color} transform rotate-45 translate-x-[-20px] translate-y-[-20px]`} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl transform translate-x-[-8px] translate-y-[-8px]">
                      {medal.icon}
                    </span>
                  </div>
                </div>

                <div className="p-4 pl-20">
                  {/* Nom École */}
                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                      {school.school_name}
                    </h3>
                    <p className="text-sm text-gray-500 font-mono">
                      {school.school_code}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Revenus Totaux */}
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                      <div className="p-1.5 bg-green-500 rounded-lg">
                        <DollarSign className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Revenus</p>
                        <p className="text-sm font-bold text-green-700">
                          {formatCurrency(school.total_revenue)}
                        </p>
                      </div>
                    </div>

                    {/* Profit Net */}
                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                      <div className="p-1.5 bg-blue-500 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Profit</p>
                        <p className="text-sm font-bold text-blue-700">
                          {formatCurrency(school.net_profit)}
                        </p>
                      </div>
                    </div>

                    {/* Marge */}
                    <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                      <div className="p-1.5 bg-purple-500 rounded-lg">
                        <Target className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Marge</p>
                        <p className="text-sm font-bold text-purple-700">
                          {school.profit_margin.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {/* Taux Recouvrement */}
                    <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                      <div className="p-1.5 bg-orange-500 rounded-lg">
                        <Trophy className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Recouvrement</p>
                        <p className="text-sm font-bold text-orange-700">
                          {school.recovery_rate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Barre de progression */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Performance</span>
                      <span className="font-semibold">{school.recovery_rate.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${school.recovery_rate}%` }}
                        transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                        className={`h-2 rounded-full bg-gradient-to-r ${medal.color}`}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
