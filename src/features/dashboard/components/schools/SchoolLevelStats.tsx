/**
 * Stats par Niveau Scolaire - Composant dédié
 * Affiche les statistiques de répartition des niveaux
 */

import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, School as SchoolIcon, Building2, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SchoolLevelStatsProps {
  stats: {
    schoolsWithPreschool: number;
    schoolsWithPrimary: number;
    schoolsWithMiddle: number;
    schoolsWithHigh: number;
    multiLevelSchools: number;
    completeLevelSchools: number;
    totalSchools: number;
  } | undefined;
}

export function SchoolLevelStats({ stats }: SchoolLevelStatsProps) {
  if (!stats) return null;

  const levelStats = [
    {
      label: 'Maternelle',
      emoji: '🎓',
      icon: GraduationCap,
      count: stats.schoolsWithPreschool,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-700',
    },
    {
      label: 'Primaire',
      emoji: '📚',
      icon: BookOpen,
      count: stats.schoolsWithPrimary,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      label: 'Collège',
      emoji: '🏫',
      icon: SchoolIcon,
      count: stats.schoolsWithMiddle,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      label: 'Lycée',
      emoji: '🎓',
      icon: Building2,
      count: stats.schoolsWithHigh,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
  ];

  const percentage = (count: number) => {
    if (stats.totalSchools === 0) return 0;
    return Math.round((count / stats.totalSchools) * 100);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-[#2A9D8F]" />
          Répartition par Niveau d'Enseignement
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {levelStats.map((level, index) => {
            const Icon = level.icon;
            const percent = percentage(level.count);
            
            return (
              <motion.div
                key={level.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative overflow-hidden rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300"
              >
                <div className={`p-4 ${level.bgColor}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${level.color}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-2xl">{level.emoji}</span>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {level.label}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className={`text-3xl font-bold ${level.textColor}`}>
                        {level.count}
                      </p>
                      <p className="text-sm text-gray-500">
                        écoles
                      </p>
                    </div>
                  </div>

                  {/* Barre de progression */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Couverture</span>
                      <span className="font-semibold">{percent}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                        className={`h-2 rounded-full bg-gradient-to-r ${level.color}`}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Stats supplémentaires */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Multi-niveaux */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">
                  Établissements Multi-Niveaux
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-orange-700">
                    {stats.multiLevelSchools}
                  </p>
                  <p className="text-xs text-gray-500">
                    (2+ niveaux)
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Complexes complets */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">
                  Complexes Complets
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-amber-700">
                    {stats.completeLevelSchools}
                  </p>
                  <p className="text-xs text-gray-500">
                    (4 niveaux)
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
