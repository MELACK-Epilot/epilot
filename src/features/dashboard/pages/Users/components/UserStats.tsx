/**
 * Composant UserStats - KPIs des utilisateurs
 * @module Users/components/UserStats
 */

import { Users, UserCheck, UserX, UserMinus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface UserStatsProps {
  stats: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
  };
  isLoading?: boolean;
}

export function UserStats({ stats, isLoading }: UserStatsProps) {
  const statCards = [
    {
      title: 'Total Utilisateurs',
      value: stats.total,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      title: 'Actifs',
      value: stats.active,
      icon: UserCheck,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      title: 'Inactifs',
      value: stats.inactive,
      icon: UserX,
      color: 'bg-gray-500',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700',
    },
    {
      title: 'Suspendus',
      value: stats.suspended,
      icon: UserMinus,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className={`text-3xl font-bold mt-2 ${stat.textColor}`}>
                    {stat.value.toLocaleString()}
                  </p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
