/**
 * Cards de statistiques par niveau d'enseignement
 * 8 cards avec gradients et animations
 */

import { motion } from 'framer-motion';
import { GraduationCap, Users, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsData {
  total: number;
  maternel: number;
  primaire: number;
  college_general: number;
  college_technique: number;
  lycee_general: number;
  lycee_technique: number;
  formation: number;
  universite: number;
}

interface InscriptionsStatsCardsProps {
  stats: StatsData;
}

export const InscriptionsStatsCards = ({ stats }: InscriptionsStatsCardsProps) => {
  const levels = [
    {
      key: 'maternel',
      title: 'Maternel',
      value: stats.maternel,
      description: 'Petite, Moyenne, Grande section',
      age: '3-6 ans',
      gradient: 'from-pink-500 to-pink-600',
      icon: Users,
      delay: 0.1,
    },
    {
      key: 'primaire',
      title: 'Primaire',
      value: stats.primaire,
      description: 'CP, CE1, CE2, CM1, CM2',
      age: '6-11 ans',
      gradient: 'from-purple-500 to-purple-600',
      icon: GraduationCap,
      delay: 0.15,
    },
    {
      key: 'college_general',
      title: 'Collège Général',
      value: stats.college_general,
      description: '6ème, 5ème, 4ème, 3ème',
      age: '11-15 ans',
      gradient: 'from-[#2A9D8F] to-[#1d7a6f]',
      icon: GraduationCap,
      delay: 0.2,
    },
    {
      key: 'college_technique',
      title: 'Collège Technique',
      value: stats.college_technique,
      description: 'Formation technique niveau collège',
      age: '11-15 ans',
      gradient: 'from-orange-500 to-orange-600',
      icon: FileText,
      delay: 0.25,
    },
    {
      key: 'lycee_general',
      title: 'Lycée Général',
      value: stats.lycee_general,
      description: '2nde, 1ère, Terminale',
      age: '15-18 ans',
      gradient: 'from-blue-500 to-blue-600',
      icon: GraduationCap,
      delay: 0.3,
    },
    {
      key: 'lycee_technique',
      title: 'Lycée Technique',
      value: stats.lycee_technique,
      description: 'STI, STG, Bac Technique',
      age: '15-18 ans',
      gradient: 'from-amber-500 to-amber-600',
      icon: FileText,
      delay: 0.35,
    },
    {
      key: 'formation',
      title: 'Centre de Formation',
      value: stats.formation,
      description: 'CAP, BEP, Bac Pro',
      age: 'Formation pro',
      gradient: 'from-indigo-500 to-indigo-600',
      icon: FileText,
      delay: 0.4,
    },
    {
      key: 'universite',
      title: 'Université',
      value: stats.universite,
      description: 'Licence, Master, Doctorat',
      age: 'Supérieur',
      gradient: 'from-[#E9C46A] to-[#d4a84f]',
      icon: GraduationCap,
      delay: 0.45,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {levels.map((level) => {
        const Icon = level.icon;
        const percentage = stats.total > 0 ? ((level.value / stats.total) * 100).toFixed(0) : 0;

        return (
          <motion.div
            key={level.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: level.delay, type: "spring", stiffness: 100 }}
            className="group cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 h-full">
              <div className={`absolute inset-0 bg-gradient-to-br ${level.gradient} opacity-90`} />
              <CardContent className="relative p-6 h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-white/70 uppercase tracking-wide">
                      {level.title}
                    </p>
                    <p className="text-4xl font-bold text-white">{level.value}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="mt-auto">
                  <p className="text-xs text-white/80">{level.description}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-white/70">
                    <span>{level.age}</span>
                    <span className="font-semibold">{percentage}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};
