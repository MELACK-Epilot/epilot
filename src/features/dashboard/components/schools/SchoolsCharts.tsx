/**
 * Graphiques pour la page Écoles - Recharts
 * Visualisations avancées
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';

interface SchoolsChartsProps {
  schools: any[];
}

export const SchoolsCharts = ({ schools }: SchoolsChartsProps) => {
  // Données pour le graphique Type (Privé/Public)
  const typeData = [
    {
      name: 'Privé',
      value: schools.filter(s => s.type_etablissement === 'prive').length,
      color: '#3B82F6', // Bleu
    },
    {
      name: 'Public',
      value: schools.filter(s => s.type_etablissement === 'public').length,
      color: '#10B981', // Vert
    },
  ];

  // Données pour le graphique Statut
  const statusData = [
    {
      name: 'Active',
      value: schools.filter(s => s.status === 'active').length,
      color: '#2A9D8F',
    },
    {
      name: 'Inactive',
      value: schools.filter(s => s.status === 'inactive').length,
      color: '#9CA3AF',
    },
    {
      name: 'Suspendue',
      value: schools.filter(s => s.status === 'suspended').length,
      color: '#E63946',
    },
  ];

  // Données pour le graphique Élèves par École (Top 10)
  const studentsData = schools
    .sort((a, b) => (b.nombre_eleves_actuels || 0) - (a.nombre_eleves_actuels || 0))
    .slice(0, 10)
    .map(school => ({
      name: school.name.length > 15 ? school.name.substring(0, 15) + '...' : school.name,
      eleves: school.nombre_eleves_actuels || 0,
      enseignants: school.nombre_enseignants || 0,
    }));

  // Données pour le graphique Évolution (simulé)
  const evolutionData = [
    { mois: 'Jan', ecoles: 12, eleves: 2400 },
    { mois: 'Fév', ecoles: 14, eleves: 2800 },
    { mois: 'Mar', ecoles: 15, eleves: 3200 },
    { mois: 'Avr', ecoles: 16, eleves: 3500 },
    { mois: 'Mai', ecoles: 18, eleves: 3900 },
    { mois: 'Juin', ecoles: schools.length, eleves: schools.reduce((sum, s) => sum + (s.nombre_eleves_actuels || 0), 0) },
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Graphique Type d'Établissement */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            Répartition par Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Graphique Statut */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Répartition par Statut
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Graphique Élèves par École (Top 10) */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            Top 10 Écoles par Nombre d'Élèves
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={studentsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="eleves" fill="#8B5CF6" name="Élèves" />
              <Bar dataKey="enseignants" fill="#F59E0B" name="Enseignants" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Graphique Évolution */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
            Évolution sur 6 Mois
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mois" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="ecoles" stroke="#3B82F6" strokeWidth={2} name="Écoles" />
              <Line yAxisId="right" type="monotone" dataKey="eleves" stroke="#10B981" strokeWidth={2} name="Élèves" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
