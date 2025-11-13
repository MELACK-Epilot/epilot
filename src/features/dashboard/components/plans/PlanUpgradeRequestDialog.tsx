/**
 * Dialog pour demander un changement de plan (Admin Groupe)
 * Permet de comparer les plans et envoyer une demande au Super Admin
 * @module PlanUpgradeRequestDialog
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Zap,
  Crown,
  Building2,
  CheckCircle2,
  Send,
  Loader2,
  TrendingUp,
  Users,
  Database,
  Headphones,
} from 'lucide-react';
import { useAllPlansWithContent } from '../../hooks/usePlanWithContent';
import { useCreatePlanChangeRequest } from '../../hooks/usePlanChangeRequests';
import type { PlanWithContent } from '../../hooks/usePlanWithContent';

interface PlanUpgradeRequestDialogProps {
  currentPlan: {
    id: string;
    name: string;
    slug: string;
    price: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Carte de plan pour la sélection
 */
const PlanCard = ({
  plan,
  isSelected,
  isCurrent,
  onSelect,
}: {
  plan: PlanWithContent;
  isSelected: boolean;
  isCurrent: boolean;
  onSelect: () => void;
}) => {
  const getPlanIcon = (slug: string) => {
    switch (slug) {
      case 'gratuit':
        return <Package className="w-8 h-8" />;
      case 'premium':
        return <Zap className="w-8 h-8" />;
      case 'pro':
        return <Crown className="w-8 h-8" />;
      case 'institutionnel':
        return <Building2 className="w-8 h-8" />;
      default:
        return <Package className="w-8 h-8" />;
    }
  };

  const getPlanColor = (slug: string) => {
    switch (slug) {
      case 'gratuit':
        return 'from-gray-500 to-gray-600';
      case 'premium':
        return 'from-[#2A9D8F] to-[#1d7a6f]';
      case 'pro':
        return 'from-[#1D3557] to-[#0d1f3d]';
      case 'institutionnel':
        return 'from-[#E9C46A] to-[#d4a849]';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: isCurrent ? 1 : 1.02 }}
      whileTap={{ scale: isCurrent ? 1 : 0.98 }}
    >
      <Card
        className={`p-6 cursor-pointer transition-all ${
          isSelected
            ? 'border-2 border-[#2A9D8F] shadow-lg'
            : isCurrent
            ? 'border-2 border-blue-300 bg-blue-50/50'
            : 'border hover:border-gray-300 hover:shadow-md'
        } ${isCurrent ? 'cursor-not-allowed opacity-75' : ''}`}
        onClick={() => !isCurrent && onSelect()}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${getPlanColor(plan.slug)} rounded-lg p-4 mb-4 text-white`}>
          <div className="flex items-center justify-between mb-2">
            {getPlanIcon(plan.slug)}
            {isCurrent && (
              <Badge className="bg-white/20 text-white border-white/30">Actuel</Badge>
            )}
            {isSelected && !isCurrent && (
              <CheckCircle2 className="w-6 h-6" />
            )}
          </div>
          <h3 className="text-xl font-bold">{plan.name}</h3>
          <p className="text-2xl font-bold mt-2">
            {plan.price.toLocaleString()} {plan.currency}
            <span className="text-sm font-normal opacity-80">/{plan.billingPeriod === 'monthly' ? 'mois' : 'an'}</span>
          </p>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">
              {plan.maxSchools === -1 ? 'Illimité' : plan.maxSchools} école{plan.maxSchools > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Package className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">
              {plan.modules?.length || 0} modules
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Database className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">{plan.maxStorage} GB</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Headphones className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">
              Support {plan.supportLevel === 'email' ? 'Email' : plan.supportLevel === 'priority' ? 'Prioritaire' : '24/7'}
            </span>
          </div>
        </div>

        {/* Action */}
        {!isCurrent && (
          <Button
            variant={isSelected ? 'default' : 'outline'}
            className="w-full mt-4"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            {isSelected ? 'Sélectionné' : 'Choisir ce plan'}
          </Button>
        )}
      </Card>
    </motion.div>
  );
};

/**
 * Dialog principal
 */
export const PlanUpgradeRequestDialog = ({
  currentPlan,
  isOpen,
  onClose,
}: PlanUpgradeRequestDialogProps) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [desiredDate, setDesiredDate] = useState('');

  const { data: plans, isLoading: plansLoading } = useAllPlansWithContent();
  const createRequest = useCreatePlanChangeRequest();

  // Trouver le plan actuel par son slug
  const actualCurrentPlan = plans?.find((p: PlanWithContent) => p.slug === currentPlan.slug);
  const selectedPlan = plans?.find((p: PlanWithContent) => p.id === selectedPlanId);

  const handleSubmit = async () => {
    if (!selectedPlanId) return;

    console.log('🔍 Debug - selectedPlanId:', selectedPlanId);
    console.log('🔍 Debug - selectedPlan:', selectedPlan);
    console.log('🔍 Debug - actualCurrentPlan:', actualCurrentPlan);

    try {
      await createRequest.mutateAsync({
        requestedPlanId: selectedPlanId,
        reason: reason || undefined,
        desiredDate: desiredDate || undefined,
      });

      // Réinitialiser le formulaire
      setSelectedPlanId(null);
      setReason('');
      setDesiredDate('');

      onClose();
    } catch (error) {
      // L'erreur est gérée par le hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#1D3557] flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#2A9D8F]" />
            Demande de changement de plan
          </DialogTitle>
          <DialogDescription>
            Sélectionnez le plan souhaité et envoyez votre demande au Super Admin pour validation
          </DialogDescription>
        </DialogHeader>

        {/* Info plan actuel */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Plan actuel :</span> {currentPlan.name} 
            {actualCurrentPlan && ` (${actualCurrentPlan.price.toLocaleString()} FCFA/mois)`}
          </p>
        </div>

        {/* Comparaison des plans */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Comparez les plans disponibles</h3>
          {plansLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#2A9D8F]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans?.map((plan: PlanWithContent) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isSelected={selectedPlanId === plan.id}
                  isCurrent={plan.slug === currentPlan.slug}
                  onSelect={() => setSelectedPlanId(plan.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Avantages du plan sélectionné */}
        {selectedPlan && selectedPlan.slug !== currentPlan.slug && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4"
          >
            <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Avantages du plan {selectedPlan.name}
            </h4>
            <ul className="space-y-1 text-sm text-green-800">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span>{selectedPlan.modules.length} modules pédagogiques</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span>{selectedPlan.categories.length} catégories métiers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span>{selectedPlan.maxSchools === -1 ? 'Écoles illimitées' : `${selectedPlan.maxSchools} école(s)`}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span>{selectedPlan.maxStorage} GB de stockage</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span>Support {selectedPlan.supportLevel === 'email' ? 'Email' : selectedPlan.supportLevel === 'priority' ? 'Prioritaire' : '24/7'}</span>
              </li>
            </ul>
          </motion.div>
        )}

        {/* Formulaire */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="reason">Raison du changement (optionnel)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Besoin de plus de modules pour nos nouvelles écoles..."
              rows={3}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Expliquez pourquoi vous souhaitez changer de plan (optionnel)
            </p>
          </div>

          <div>
            <Label htmlFor="desiredDate">Date souhaitée (optionnel)</Label>
            <Input
              id="desiredDate"
              type="date"
              value={desiredDate}
              onChange={(e) => setDesiredDate(e.target.value)}
              className="mt-1"
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-gray-500 mt-1">
              Quand souhaitez-vous que le changement soit effectif ?
            </p>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={createRequest.isPending}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedPlanId || (actualCurrentPlan && selectedPlanId === actualCurrentPlan.id) || createRequest.isPending}
            className="bg-[#2A9D8F] hover:bg-[#238276] text-white"
          >
            {createRequest.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Envoyer la demande
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
