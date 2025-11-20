/**
 * Composant Graphiques pour Groupes Scolaires
 * Visualisation des statistiques avec Recharts
 * @module SchoolGroupsCharts
 */

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { SchoolGroup } from '../../types/dashboard.types';

interface SchoolGroupsChartsProps {
  data: SchoolGroup[];
}

const COLORS = {
  gratuit: '#94a3b8',
  premium: '#3b82f6',
  pro: '#8b5cf6',
  institutionnel: '#eab308',
  active: '#10b981',
  inactive: '#6b7280',
  suspended: '#ef4444',
};

export const SchoolGroupsCharts = ({ data }: SchoolGroupsChartsProps) => {
  // Données pour le graphique par plan
  const planData = useMemo(() => {
    const counts = data.reduce((acc, group) => {
      const plan = group.plan || 'gratuit';
      acc[plan] = (acc[plan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: COLORS[name as keyof typeof COLORS] || '#gray',
    }));
  }, [data]);

  // Données pour le graphique par statut
  const statusData = useMemo(() => {
    const counts = data.reduce((acc, group) => {
      acc[group.status] = (acc[group.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([name, value]) => ({
      name: name === 'active' ? 'Actif' : name === 'inactive' ? 'Inactif' : 'Suspendu',
      value,
      color: COLORS[name as keyof typeof COLORS],
    }));
  }, [data]);

  // Données pour le graphique par région
  const regionData = useMemo(() => {
    const counts = data.reduce((acc, group) => {
      const region = group.region || 'Non défini';
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 régions
  }, [data]);

  // Données pour le graphique écoles par groupe
  const schoolsData = useMemo(() => {
    return data
      .map(group => ({
        name: group.name.length > 20 ? group.name.substring(0, 20) + '...' : group.name,
        ecoles: group.schoolCount || 0,
        eleves: group.studentCount || 0,
      }))
      .sort((a, b) => b.ecoles - a.ecoles)
      .slice(0, 10); // Top 10 groupes
  }, [data]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Graphique par Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par Plan</CardTitle>
          <CardDescription>Distribution des groupes selon leur plan d'abonnement</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={planData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {planData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Graphique par Statut */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par Statut</CardTitle>
          <CardDescription>Distribution des groupes selon leur statut</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Graphique par Région */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Régions</CardTitle>
          <CardDescription>Régions avec le plus de groupes scolaires</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={regionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" name="Groupes" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Graphique Écoles et Élèves */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Groupes</CardTitle>
          <CardDescription>Groupes avec le plus d'écoles et d'élèves</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={schoolsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="ecoles" fill="#8b5cf6" name="Écoles" />
              <Bar dataKey="eleves" fill="#10b981" name="Élèves" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
