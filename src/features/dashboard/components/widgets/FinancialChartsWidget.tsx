/**
 * Widget Graphiques Financiers Détaillés
 * Affiche l'évolution MRR, prévisions IA, et breakdown par plan
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Target, Zap } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useMonthlyMRR } from '../../hooks/useMonthlyMRR';
import { usePlanBreakdown } from '../../hooks/usePlanBreakdown';
import { useMRRForecast } from '../../hooks/useMRRForecast';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

export const FinancialChartsWidget = () => {
  const { data: mrrData, isLoading: mrrLoading } = useMonthlyMRR(12);
  const { data: planData, isLoading: planLoading } = usePlanBreakdown();
  const { data: forecast, isLoading: forecastLoading } = useMRRForecast(3);

  const isLoading = mrrLoading || planLoading || forecastLoading;

  // Configuration graphique MRR évolution
  const mrrChartData = {
    labels: [...(mrrData?.months || []), ...(forecast?.months || [])],
    datasets: [
      {
        label: 'MRR Réel',
        data: mrrData?.values || [],
        borderColor: '#2A9D8F',
        backgroundColor: 'rgba(42, 157, 143, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'MRR Prévu (IA)',
        data: [
          ...(mrrData?.values ? new Array(mrrData.values.length).fill(null) : []),
          ...(forecast?.values || []),
        ],
        borderColor: '#E9C46A',
        backgroundColor: 'rgba(233, 196, 106, 0.1)',
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Objectif',
        data: mrrData?.targets || [],
        borderColor: '#E63946',
        backgroundColor: 'rgba(230, 57, 70, 0.05)',
        borderDash: [10, 5],
        fill: false,
        tension: 0,
        pointRadius: 0,
      },
    ],
  };

  const mrrChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            family: 'Inter, sans-serif',
          },
        },
      },
      title: {
        display: true,
        text: 'Évolution MRR (12 derniers mois + 3 mois prévision IA)',
        font: {
          size: 14,
          weight: 'bold' as const,
          family: 'Inter, sans-serif',
        },
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.parsed.y;
            if (value === null) return '';
            return `${context.dataset.label}: ${(value / 1000000).toFixed(2)}M FCFA`;
          },
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 13,
        },
        bodyFont: {
          size: 12,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value: any) => `${(value / 1000000).toFixed(1)}M`,
          font: {
            size: 11,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
  };

  // Configuration graphique breakdown par plan
  const planChartData = {
    labels: planData?.plans || [],
    datasets: [
      {
        label: 'MRR par Plan (FCFA)',
        data: planData?.mrr || [],
        backgroundColor: planData?.colors || [],
        borderWidth: 0,
        borderRadius: 8,
      },
    ],
  };

  const planChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'MRR par Plan d\'Abonnement',
        font: {
          size: 14,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.parsed.y;
            return `MRR: ${(value / 1000000).toFixed(2)}M FCFA`;
          },
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value: any) => `${(value / 1000000).toFixed(1)}M`,
        },
      },
    },
  };

  // Configuration graphique doughnut
  const doughnutData = {
    labels: planData?.plans || [],
    datasets: [
      {
        data: planData?.mrr || [],
        backgroundColor: planData?.colors || [],
        borderWidth: 3,
        borderColor: '#ffffff',
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
          generateLabels: (chart: any) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label: string, i: number) => {
                const value = data.datasets[0].data[i];
                return {
                  text: `${label}: ${(value / 1000000).toFixed(1)}M`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  hidden: false,
                  index: i,
                };
              });
            }
            return [];
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${(value / 1000000).toFixed(2)}M FCFA (${percentage}%)`;
          },
        },
      },
    },
  };

  if (isLoading) {
    return (
      <Card className="col-span-12">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#2A9D8F]" />
            Vue Financière Détaillée
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-[300px] bg-gray-100 rounded-xl" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="h-[250px] bg-gray-100 rounded-xl" />
              <div className="h-[250px] bg-gray-100 rounded-xl" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-12">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-[#2A9D8F]" />
          Vue Financière Détaillée
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Graphique MRR évolution */}
        <div className="h-[350px] bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-200">
          <Line data={mrrChartData} options={mrrChartOptions} />
        </div>

        {/* Métriques clés + Graphiques breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Métriques clés */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 mb-4">📊 Métriques Clés</h3>
            
            <MetricCard
              icon={<TrendingUp className="w-4 h-4" />}
              label="MRR Moyen"
              value={`${((mrrData?.average || 0) / 1000000).toFixed(2)}M FCFA`}
              trend={mrrData?.avgTrend || 0}
              trendLabel="vs période précédente"
            />
            
            <MetricCard
              icon={<Target className="w-4 h-4" />}
              label="Croissance MoM"
              value={`${(mrrData?.momGrowth || 0).toFixed(1)}%`}
              trend={mrrData?.momGrowth || 0}
              trendLabel="mois sur mois"
            />
            
            <MetricCard
              icon={<Zap className="w-4 h-4" />}
              label="Prévision 3 mois"
              value={`${((forecast?.total || 0) / 1000000).toFixed(2)}M FCFA`}
              trend={forecast?.confidence || 0}
              trendLabel={`Confiance: ${forecast?.confidence}%`}
              isConfidence
            />
          </div>

          {/* Graphique Bar */}
          <div className="h-[280px] bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-100">
            <Bar data={planChartData} options={planChartOptions} />
          </div>

          {/* Graphique Doughnut */}
          <div className="h-[280px] bg-gradient-to-br from-emerald-50 to-white p-4 rounded-xl border border-emerald-100">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Composant MetricCard
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: number;
  trendLabel: string;
  isConfidence?: boolean;
}

const MetricCard = ({ icon, label, value, trend, trendLabel, isConfidence }: MetricCardProps) => {
  const isPositive = trend >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  
  return (
    <div className="p-4 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 text-gray-600 mb-2">
        {icon}
        <p className="text-sm font-medium">{label}</p>
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      </div>
      <div className="flex items-center gap-1">
        {!isConfidence && (
          <TrendIcon className={`w-3 h-3 ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`} />
        )}
        <span className={`text-xs font-medium ${
          isConfidence 
            ? 'text-blue-600' 
            : isPositive 
              ? 'text-green-600' 
              : 'text-red-600'
        }`}>
          {!isConfidence && (isPositive ? '+' : '')}{Math.abs(trend).toFixed(1)}%
        </span>
        <span className="text-xs text-gray-500 ml-1">{trendLabel}</span>
      </div>
    </div>
  );
};

export default FinancialChartsWidget;
