import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  GraduationCap,
  Award,
  Calendar,
  DollarSign,
  Target,
  Activity,
  PieChart,
  LineChart,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

export const AdvancedStatsPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const periods = [
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
    { value: 'quarter', label: 'Ce trimestre' },
    { value: 'year', label: 'Cette année' },
  ];

  const kpiData = [
    {
      title: 'Taux de Réussite',
      value: '87.5%',
      change: '+5.2%',
      trend: 'up',
      icon: Award,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50',
    },
    {
      title: 'Taux de Présence',
      value: '92.3%',
      change: '+2.1%',
      trend: 'up',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
    },
    {
      title: 'Satisfaction Parents',
      value: '4.6/5',
      change: '+0.3',
      trend: 'up',
      icon: Target,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50',
    },
    {
      title: 'Performance Globale',
      value: '89%',
      change: '-1.2%',
      trend: 'down',
      icon: TrendingUp,
      color: 'from-orange-500 to-red-500',
      bgColor: 'from-orange-50 to-red-50',
    },
  ];

  const academicStats = [
    { subject: 'Mathématiques', average: 14.5, progress: 85, trend: 'up', change: '+2.3' },
    { subject: 'Français', average: 13.8, progress: 78, trend: 'up', change: '+1.5' },
    { subject: 'Anglais', average: 15.2, progress: 92, trend: 'up', change: '+3.1' },
    { subject: 'Sciences', average: 13.2, progress: 75, trend: 'down', change: '-0.8' },
    { subject: 'Histoire-Géo', average: 14.0, progress: 80, trend: 'up', change: '+1.2' },
  ];

  const classPerformance = [
    { class: '6ème A', students: 35, average: 14.2, attendance: 95, excellence: 12 },
    { class: '6ème B', students: 32, average: 13.8, attendance: 92, excellence: 10 },
    { class: '5ème A', students: 38, average: 13.5, attendance: 94, excellence: 11 },
    { class: '5ème B', students: 36, average: 14.0, attendance: 93, excellence: 13 },
    { class: '4ème A', students: 34, average: 13.2, attendance: 91, excellence: 9 },
  ];

  const financialMetrics = [
    { label: 'Revenus Mensuels', value: '15,500,000 FCFA', change: '+12%', trend: 'up' },
    { label: 'Dépenses Mensuelles', value: '8,200,000 FCFA', change: '+5%', trend: 'up' },
    { label: 'Marge Bénéficiaire', value: '47%', change: '+7%', trend: 'up' },
    { label: 'Taux de Recouvrement', value: '89%', change: '-3%', trend: 'down' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-[#2A9D8F]" />
              Statistiques Avancées
            </h1>
            <p className="text-gray-600 mt-1">Analyse détaillée des performances de l'école</p>
          </div>
          <div className="flex gap-2">
            {periods.map((period) => (
              <Button
                key={period.value}
                variant={selectedPeriod === period.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(period.value)}
                className={selectedPeriod === period.value ? 'bg-[#2A9D8F]' : ''}
              >
                {period.label}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* KPIs Principaux */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiData.map((kpi, index) => {
            const Icon = kpi.icon;
            const TrendIcon = kpi.trend === 'up' ? TrendingUp : TrendingDown;
            return (
              <motion.div
                key={kpi.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`p-6 bg-gradient-to-br ${kpi.bgColor} border-0 shadow-lg`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <Badge className={kpi.trend === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      <TrendIcon className="h-3 w-3 mr-1" />
                      {kpi.change}
                    </Badge>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{kpi.value}</div>
                  <div className="text-sm text-gray-600">{kpi.title}</div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Tabs pour différentes analyses */}
        <Tabs defaultValue="academic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="academic">
              <GraduationCap className="h-4 w-4 mr-2" />
              Académique
            </TabsTrigger>
            <TabsTrigger value="classes">
              <Users className="h-4 w-4 mr-2" />
              Classes
            </TabsTrigger>
            <TabsTrigger value="financial">
              <DollarSign className="h-4 w-4 mr-2" />
              Financier
            </TabsTrigger>
            <TabsTrigger value="trends">
              <Activity className="h-4 w-4 mr-2" />
              Tendances
            </TabsTrigger>
          </TabsList>

          {/* Onglet Académique */}
          <TabsContent value="academic" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Award className="h-5 w-5 text-[#2A9D8F]" />
                Performance par Matière
              </h3>
              <div className="space-y-4">
                {academicStats.map((stat, index) => {
                  const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
                  return (
                    <motion.div
                      key={stat.subject}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#2A9D8F] to-[#238b7e] rounded-lg flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{stat.subject}</h4>
                            <p className="text-sm text-gray-600">Moyenne: {stat.average}/20</p>
                          </div>
                        </div>
                        <Badge className={stat.trend === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          <TrendIcon className="h-3 w-3 mr-1" />
                          {stat.change}
                        </Badge>
                      </div>
                      <Progress value={stat.progress} className="h-2" />
                      <p className="text-xs text-gray-500 mt-2">Progression: {stat.progress}%</p>
                    </motion.div>
                  );
                })}
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-[#2A9D8F]" />
                  Répartition des Notes
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Excellent (16-20)</span>
                    <Badge className="bg-green-100 text-green-800">28%</Badge>
                  </div>
                  <Progress value={28} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Bien (14-16)</span>
                    <Badge className="bg-blue-100 text-blue-800">35%</Badge>
                  </div>
                  <Progress value={35} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Assez bien (12-14)</span>
                    <Badge className="bg-yellow-100 text-yellow-800">25%</Badge>
                  </div>
                  <Progress value={25} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Passable (10-12)</span>
                    <Badge className="bg-orange-100 text-orange-800">12%</Badge>
                  </div>
                  <Progress value={12} className="h-2" />
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#2A9D8F]" />
                  Objectifs Pédagogiques
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Taux de réussite</span>
                      <span className="text-sm font-bold text-[#2A9D8F]">87.5% / 90%</span>
                    </div>
                    <Progress value={97} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Moyenne générale</span>
                      <span className="text-sm font-bold text-[#2A9D8F]">14.1 / 15</span>
                    </div>
                    <Progress value={94} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Mentions</span>
                      <span className="text-sm font-bold text-[#2A9D8F]">63% / 70%</span>
                    </div>
                    <Progress value={90} className="h-2" />
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Onglet Classes */}
          <TabsContent value="classes" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Users className="h-5 w-5 text-[#2A9D8F]" />
                Performance par Classe
              </h3>
              <div className="space-y-3">
                {classPerformance.map((classData, index) => (
                  <motion.div
                    key={classData.class}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-gray-50 rounded-xl hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#2A9D8F] to-[#238b7e] rounded-lg flex items-center justify-center">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900">{classData.class}</h4>
                          <p className="text-sm text-gray-600">{classData.students} élèves</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-6 text-center">
                        <div>
                          <div className="text-2xl font-bold text-[#2A9D8F]">{classData.average}</div>
                          <div className="text-xs text-gray-600">Moyenne</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{classData.attendance}%</div>
                          <div className="text-xs text-gray-600">Présence</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">{classData.excellence}</div>
                          <div className="text-xs text-gray-600">Excellence</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Onglet Financier */}
          <TabsContent value="financial" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {financialMetrics.map((metric, index) => {
                const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown;
                return (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <DollarSign className="h-8 w-8 text-[#2A9D8F]" />
                        <Badge className={metric.trend === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          <TrendIcon className="h-3 w-3 mr-1" />
                          {metric.change}
                        </Badge>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
                      <div className="text-sm text-gray-600">{metric.label}</div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* Onglet Tendances */}
          <TabsContent value="trends" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <LineChart className="h-5 w-5 text-[#2A9D8F]" />
                Évolution sur 6 mois
              </h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
                <p className="text-gray-500">Graphique d'évolution (à intégrer avec une bibliothèque de charts)</p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
