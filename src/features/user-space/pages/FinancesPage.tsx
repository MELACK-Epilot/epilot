/**
 * Page Finances pour l'espace Proviseur
 * Gestion financière de l'école
 * React 19 Best Practices + Temps Réel
 * 
 * @module FinancesPage
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  Search,
  CreditCard,
  Wallet,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCurrentUser } from '../hooks/useCurrentUser';

/**
 * KPI Card Component
 */
const KPICard = ({ 
  title, 
  value, 
  change, 
  icon: Icon,
  color = 'blue'
}: {
  title: string;
  value: string | number;
  change?: { value: number; isPositive: boolean };
  icon: any;
  color?: string;
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
  }[color];

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses} shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            change.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {change.isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {Math.abs(change.value)}%
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </Card>
  );
};

/**
 * Page Finances
 */
export const FinancesPage = () => {
  const { data: user } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('month');

  // Données mockées (à remplacer par des vraies données)
  const financialData = useMemo(() => ({
    totalRevenue: '45,250,000',
    pendingPayments: '12,500,000',
    expenses: '18,750,000',
    balance: '26,500,000',
    recentTransactions: [
      {
        id: '1',
        type: 'payment',
        student: 'Jean Dupont',
        amount: 150000,
        date: '2024-11-10',
        status: 'completed',
        method: 'mobile_money',
      },
      {
        id: '2',
        type: 'payment',
        student: 'Marie Martin',
        amount: 150000,
        date: '2024-11-09',
        status: 'pending',
        method: 'bank_transfer',
      },
      {
        id: '3',
        type: 'expense',
        description: 'Fournitures scolaires',
        amount: 500000,
        date: '2024-11-08',
        status: 'completed',
        category: 'supplies',
      },
    ],
  }), []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-[#2A9D8F]" />
            Finances
          </h1>
          <p className="text-gray-600 mt-1">
            Gestion financière de {user?.school?.name || 'votre école'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtrer
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-[#2A9D8F] to-[#238b7e]">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </div>
      </motion.div>

      {/* KPIs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <KPICard
          title="Revenus totaux"
          value={`${financialData.totalRevenue} FCFA`}
          change={{ value: 12, isPositive: true }}
          icon={DollarSign}
          color="green"
        />
        <KPICard
          title="Paiements en attente"
          value={`${financialData.pendingPayments} FCFA`}
          change={{ value: 5, isPositive: false }}
          icon={CreditCard}
          color="orange"
        />
        <KPICard
          title="Dépenses"
          value={`${financialData.expenses} FCFA`}
          change={{ value: 8, isPositive: false }}
          icon={Wallet}
          color="purple"
        />
        <KPICard
          title="Solde"
          value={`${financialData.balance} FCFA`}
          change={{ value: 15, isPositive: true }}
          icon={TrendingUp}
          color="blue"
        />
      </motion.div>

      {/* Filtres et recherche */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher une transaction..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterPeriod} onValueChange={setFilterPeriod}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Aujourd'hui</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Transactions récentes */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Transactions récentes
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {financialData.recentTransactions.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-6 hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                    transaction.type === 'payment'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {transaction.type === 'payment' ? (
                      <CreditCard className="h-5 w-5" />
                    ) : (
                      <Wallet className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {transaction.type === 'payment' 
                        ? transaction.student 
                        : transaction.description}
                    </p>
                    <p className="text-sm text-gray-500">{transaction.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-semibold ${
                    transaction.type === 'payment'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {transaction.type === 'payment' ? '+' : '-'}
                    {transaction.amount.toLocaleString()} FCFA
                  </p>
                  <Badge 
                    variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                    className={transaction.status === 'completed' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-orange-100 text-orange-700'}
                  >
                    {transaction.status === 'completed' ? 'Complété' : 'En attente'}
                  </Badge>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Message d'information */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">
              Fonctionnalité en développement
            </h3>
            <p className="text-sm text-blue-700">
              Cette page affiche actuellement des données de démonstration. 
              Les fonctionnalités complètes de gestion financière seront bientôt disponibles.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
