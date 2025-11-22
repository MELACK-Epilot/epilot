/**
 * Composant Graphiques pour la page Utilisateurs
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AnimatedCard } from '../AnimatedCard';

interface UsersChartsProps {
  stats: {
    total: number;
  } | undefined;
  evolutionStats?: Array<{ month_label: string; user_count: number }>;
  distributionStats?: Array<{ name: string; value: number }>;
  isLoading?: boolean;
}

export const UsersCharts = ({ evolutionStats, distributionStats, isLoading }: Omit<UsersChartsProps, 'stats'> & { stats?: any }) => {
  // Données par défaut pour éviter les erreurs de rendu si vide
  const defaultEvolutionData = [
    { month_label: 'Jan', user_count: 0 },
    { month_label: 'Fév', user_count: 0 },
    { month_label: 'Mar', user_count: 0 },
  ];

  const defaultDistributionData = [
    { name: 'Aucune donnée', value: 1 },
  ];

  const evolutionData = (evolutionStats && evolutionStats.length > 0) 
    ? evolutionStats 
    : defaultEvolutionData;

  const distributionData = (distributionStats && distributionStats.length > 0)
    ? distributionStats
    : defaultDistributionData;

  const COLORS = ['#1D3557', '#2A9D8F', '#E9C46A', '#E63946', '#457B9D'];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[300px] bg-gray-100 animate-pulse rounded-lg" />
        <div className="h-[300px] bg-gray-100 animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Graphique d'évolution */}
      <AnimatedCard delay={0.8}>
        <Card>
          <CardHeader>
            <CardTitle>Évolution des utilisateurs</CardTitle>
            <CardDescription>Croissance sur les 12 derniers mois</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month_label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="user_count" 
                  stroke="#1D3557" 
                  strokeWidth={2}
                  name="Utilisateurs"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </AnimatedCard>

      {/* Graphique de répartition */}
      <AnimatedCard delay={0.9}>
        <Card>
          <CardHeader>
            <CardTitle>Répartition des utilisateurs</CardTitle>
            <CardDescription>Top 5 des regroupements</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: { name?: string, percent?: number }) => (percent && percent > 0.05 && name) ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distributionData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, 'Utilisateurs']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </AnimatedCard>
    </div>
  );
};
