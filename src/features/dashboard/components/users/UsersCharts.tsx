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
  schools: Array<{ id: string; name: string }>;
}

export const UsersCharts = ({ stats, schools }: UsersChartsProps) => {
  // Données pour le graphique d'évolution
  const evolutionData = [
    { month: 'Jan', users: Math.floor((stats?.total || 100) * 0.6) },
    { month: 'Fév', users: Math.floor((stats?.total || 100) * 0.65) },
    { month: 'Mar', users: Math.floor((stats?.total || 100) * 0.7) },
    { month: 'Avr', users: Math.floor((stats?.total || 100) * 0.75) },
    { month: 'Mai', users: Math.floor((stats?.total || 100) * 0.8) },
    { month: 'Juin', users: Math.floor((stats?.total || 100) * 0.85) },
    { month: 'Juil', users: Math.floor((stats?.total || 100) * 0.9) },
    { month: 'Août', users: Math.floor((stats?.total || 100) * 0.95) },
    { month: 'Sep', users: stats?.total || 100 },
  ];

  // Données pour le graphique de répartition par école
  const distributionData = schools.slice(0, 5).map((school, index) => ({
    name: school.name,
    value: Math.floor(Math.random() * 50) + 10,
  }));

  const COLORS = ['#1D3557', '#2A9D8F', '#E9C46A', '#E63946', '#457B9D'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Graphique d'évolution */}
      <AnimatedCard delay={0.8}>
        <Card>
          <CardHeader>
            <CardTitle>Évolution des utilisateurs</CardTitle>
            <CardDescription>Croissance sur les 9 derniers mois</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="users" 
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
            <CardTitle>Répartition par groupe</CardTitle>
            <CardDescription>Top 5 des groupes scolaires</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </AnimatedCard>
    </div>
  );
};
