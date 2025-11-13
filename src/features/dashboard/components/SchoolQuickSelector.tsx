/**
 * Sélecteur rapide d'école avec aperçu financier
 * Version minimaliste - Focus sur les chiffres
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { School, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

interface SchoolSummary {
  schoolId: string;
  schoolName: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  overdueAmount: number;
  recoveryRate: number;
}

interface SchoolQuickSelectorProps {
  schools: SchoolSummary[];
}

export const SchoolQuickSelector = ({ schools }: SchoolQuickSelectorProps) => {
  const navigate = useNavigate();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [open, setOpen] = useState(false);

  const selectedSchool = schools.find((s) => s.schoolId === selectedSchoolId);

  const formatCurrency = (amount: number) => {
    return `${(amount / 1000000).toFixed(2)}M FCFA`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const handleViewDetails = () => {
    if (selectedSchoolId) {
      navigate(`/dashboard/finances/ecole/${selectedSchoolId}`);
      setOpen(false);
    }
  };

  const handleSchoolSelect = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    // Fermeture automatique après 2 secondes pour permettre de voir la sélection
    setTimeout(() => {
      navigate(`/dashboard/finances/ecole/${schoolId}`);
      setOpen(false);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="p-4 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-blue-300 h-full">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <School className="w-5 h-5" />
            </div>
            <Eye className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Sélectionner une École</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {schools.length} École{schools.length > 1 ? 's' : ''}
          </p>
          <p className="text-xs text-gray-500">Cliquer pour choisir</p>
        </Card>
      </DialogTrigger>

      <DialogContent className="fixed right-4 top-20 max-w-sm w-full m-0 translate-x-0 translate-y-0 data-[state=open]:slide-in-from-right-full data-[state=closed]:slide-out-to-right-full shadow-2xl border-0 rounded-xl bg-white/95 backdrop-blur-md">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <div className="p-2 bg-blue-100 rounded-lg">
              <School className="w-5 h-5 text-blue-600" />
            </div>
            Sélection Rapide d'École
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">Choisissez une école pour voir ses détails financiers</p>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Sélecteur */}
          <Select value={selectedSchoolId} onValueChange={handleSchoolSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choisir une école..." />
            </SelectTrigger>
            <SelectContent>
              {schools.map((school) => (
                <SelectItem key={school.schoolId} value={school.schoolId}>
                  <div className="flex items-center justify-between w-full gap-4">
                    <span className="font-medium">{school.schoolName}</span>
                    <span className="text-xs text-gray-500">
                      {formatCurrency(school.totalRevenue)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Aperçu financier - FOCUS CHIFFRES */}
          {selectedSchool ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Tableau de chiffres clair */}
              <div className="grid grid-cols-2 gap-4">
                {/* Revenus */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-emerald-700 mb-1">REVENUS TOTAUX</p>
                  <p className="text-3xl font-bold text-emerald-900">
                    {formatCurrency(selectedSchool.totalRevenue)}
                  </p>
                </div>

                {/* Dépenses */}
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-rose-700 mb-1">DÉPENSES TOTALES</p>
                  <p className="text-3xl font-bold text-rose-900">
                    {formatCurrency(selectedSchool.totalExpenses)}
                  </p>
                </div>
              </div>

              {/* Profit Net */}
              <div className={`${selectedSchool.netProfit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'} border rounded-lg p-4`}>
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-xs font-medium ${selectedSchool.netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                    PROFIT NET
                  </p>
                  {selectedSchool.netProfit >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-orange-600" />
                  )}
                </div>
                <p className={`text-3xl font-bold ${selectedSchool.netProfit >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                  {formatCurrency(selectedSchool.netProfit)}
                </p>
              </div>

              {/* Retards & Recouvrement */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-amber-700 mb-1">RETARDS</p>
                  <p className="text-2xl font-bold text-amber-900">
                    {formatCurrency(selectedSchool.overdueAmount)}
                  </p>
                </div>

                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-teal-700 mb-1">RECOUVREMENT</p>
                  <p className="text-2xl font-bold text-teal-900">
                    {formatPercentage(selectedSchool.recoveryRate)}
                  </p>
                  <div className="mt-2 h-2 bg-teal-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-600 rounded-full transition-all"
                      style={{ width: `${Math.min(selectedSchool.recoveryRate, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bouton Voir Détails */}
              <Button
                onClick={handleViewDetails}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <Eye className="w-4 h-4 mr-2" />
                Voir les Détails Complets
              </Button>
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <School className="w-16 h-16 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Sélectionnez une école pour voir ses finances</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
