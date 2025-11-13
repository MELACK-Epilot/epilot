/**
 * Modal de Création d'Abonnement
 * Permet au Super Admin de créer un nouvel abonnement pour un groupe
 * @module CreateSubscriptionModal
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCreateSubscription } from '../../hooks/useSubscriptions';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Calendar, DollarSign, Package, Building2, CreditCard, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { format, addMonths, addYears } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SchoolGroup {
  id: string;
  name: string;
  code: string;
  schoolsCount?: number;
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  billing_period: 'monthly' | 'yearly';
  description?: string;
}

export const CreateSubscriptionModal = ({ isOpen, onClose }: CreateSubscriptionModalProps) => {
  const { toast } = useToast();
  const { mutate: createSubscription, isPending } = useCreateSubscription();

  // États du formulaire
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>('');
  const [autoRenew, setAutoRenew] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<string>('bank_transfer');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [useCustomAmount, setUseCustomAmount] = useState<boolean>(false);

  // Récupérer les groupes scolaires
  const { data: schoolGroups, isLoading: loadingGroups } = useQuery({
    queryKey: ['school-groups-for-subscription'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('school_groups')
        .select('id, name, code')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;

      // Compter les écoles par groupe
      const { data: schools } = await supabase
        .from('schools')
        .select('school_group_id')
        .eq('status', 'active');

      const schoolCountMap = new Map<string, number>();
      (schools || []).forEach((school: any) => {
        const count = schoolCountMap.get(school.school_group_id) || 0;
        schoolCountMap.set(school.school_group_id, count + 1);
      });

      return (data || []).map(group => ({
        ...group,
        schoolsCount: schoolCountMap.get(group.id) || 0,
      })) as SchoolGroup[];
    },
    enabled: isOpen,
  });

  // Récupérer les plans
  const { data: plans, isLoading: loadingPlans } = useQuery({
    queryKey: ['subscription-plans-for-creation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('id, name, slug, price, billing_period, description')
        .eq('status', 'active')
        .order('price');

      if (error) throw error;
      return data as Plan[];
    },
    enabled: isOpen,
  });

  // Plan sélectionné
  const selectedPlan = plans?.find(p => p.id === selectedPlanId);

  // Calculer automatiquement la date de fin
  useEffect(() => {
    if (startDate) {
      const start = new Date(startDate);
      const end = billingPeriod === 'monthly' 
        ? addMonths(start, 1)
        : addYears(start, 1);
      setEndDate(format(end, 'yyyy-MM-dd'));
    }
  }, [startDate, billingPeriod]);

  // Mettre à jour la période de facturation selon le plan
  useEffect(() => {
    if (selectedPlan) {
      setBillingPeriod(selectedPlan.billing_period);
    }
  }, [selectedPlan]);

  // Calculer le montant
  const calculatedAmount = useCustomAmount 
    ? parseFloat(customAmount) || 0
    : selectedPlan?.price || 0;

  // Validation
  const isValid = selectedGroupId && selectedPlanId && startDate && endDate && calculatedAmount >= 0;

  // Soumettre
  const handleSubmit = () => {
    if (!isValid) {
      toast({
        title: 'Formulaire incomplet',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      });
      return;
    }

    createSubscription(
      {
        schoolGroupId: selectedGroupId,
        planId: selectedPlanId,
        startDate,
        endDate,
        autoRenew,
        amount: calculatedAmount,
        currency: 'FCFA',
        paymentMethod,
      },
      {
        onSuccess: () => {
          toast({
            title: '✅ Abonnement créé',
            description: 'Le nouvel abonnement a été créé avec succès',
          });
          handleClose();
        },
        onError: (error) => {
          console.error('Erreur création abonnement:', error);
          toast({
            title: '❌ Erreur',
            description: 'Impossible de créer l\'abonnement',
            variant: 'destructive',
          });
        },
      }
    );
  };

  // Fermer et réinitialiser
  const handleClose = () => {
    setSelectedGroupId('');
    setSelectedPlanId('');
    setBillingPeriod('monthly');
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setEndDate('');
    setAutoRenew(true);
    setPaymentMethod('bank_transfer');
    setCustomAmount('');
    setUseCustomAmount(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-[#2A9D8F]" />
            Créer un Nouvel Abonnement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Groupe Scolaire */}
          <div className="space-y-2">
            <Label htmlFor="school-group" className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#2A9D8F]" />
              Groupe Scolaire *
            </Label>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger id="school-group" disabled={loadingGroups}>
                <SelectValue placeholder="Sélectionner un groupe scolaire" />
              </SelectTrigger>
              <SelectContent>
                {schoolGroups?.map(group => (
                  <SelectItem key={group.id} value={group.id}>
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{group.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({group.code}) - {group.schoolsCount} école(s)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Plan */}
          <div className="space-y-2">
            <Label htmlFor="plan" className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#2A9D8F]" />
              Plan d'Abonnement *
            </Label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger id="plan" disabled={loadingPlans}>
                <SelectValue placeholder="Sélectionner un plan" />
              </SelectTrigger>
              <SelectContent>
                {plans?.map(plan => (
                  <SelectItem key={plan.id} value={plan.id}>
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{plan.name}</span>
                      <span className="text-sm text-gray-600 ml-2">
                        {plan.price.toLocaleString()} FCFA/{plan.billing_period === 'monthly' ? 'mois' : 'an'}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPlan?.description && (
              <p className="text-sm text-gray-500 mt-1">{selectedPlan.description}</p>
            )}
          </div>

          {/* Période de Facturation */}
          <div className="space-y-2">
            <Label htmlFor="billing-period" className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#2A9D8F]" />
              Période de Facturation *
            </Label>
            <Select value={billingPeriod} onValueChange={(value: 'monthly' | 'yearly') => setBillingPeriod(value)}>
              <SelectTrigger id="billing-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensuel</SelectItem>
                <SelectItem value="yearly">Annuel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Date de Début *</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Date de Fin *</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Calculée automatiquement selon la période
              </p>
            </div>
          </div>

          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#2A9D8F]" />
              Montant *
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="amount"
                type="number"
                min="0"
                step="1000"
                value={useCustomAmount ? customAmount : selectedPlan?.price || ''}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setUseCustomAmount(true);
                }}
                placeholder="Montant en FCFA"
                className="flex-1"
              />
              <span className="text-sm font-medium text-gray-600">FCFA</span>
            </div>
            {selectedPlan && !useCustomAmount && (
              <p className="text-sm text-gray-500">
                Montant du plan : {selectedPlan.price.toLocaleString()} FCFA
              </p>
            )}
            {useCustomAmount && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUseCustomAmount(false);
                  setCustomAmount('');
                }}
                className="text-xs"
              >
                Réinitialiser au montant du plan
              </Button>
            )}
          </div>

          {/* Méthode de Paiement */}
          <div className="space-y-2">
            <Label htmlFor="payment-method" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#2A9D8F]" />
              Méthode de Paiement
            </Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="payment-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Virement Bancaire</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                <SelectItem value="cash">Espèces</SelectItem>
                <SelectItem value="check">Chèque</SelectItem>
                <SelectItem value="card">Carte Bancaire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Renouvellement Automatique */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="auto-renew"
              checked={autoRenew}
              onChange={(e) => setAutoRenew(e.target.checked)}
              className="rounded border-gray-300 text-[#2A9D8F] focus:ring-[#2A9D8F]"
            />
            <Label htmlFor="auto-renew" className="cursor-pointer">
              Renouvellement automatique
            </Label>
          </div>

          {/* Résumé */}
          <AnimatePresence>
            {selectedPlan && selectedGroupId && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-gradient-to-br from-[#2A9D8F]/10 to-[#1D3557]/10 rounded-xl p-4 border-2 border-[#2A9D8F]/20"
              >
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#2A9D8F]" />
                  Résumé de l'Abonnement
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Groupe :</span>
                    <span className="font-medium">
                      {schoolGroups?.find(g => g.id === selectedGroupId)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan :</span>
                    <span className="font-medium">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Période :</span>
                    <span className="font-medium">
                      {billingPeriod === 'monthly' ? 'Mensuel' : 'Annuel'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Durée :</span>
                    <span className="font-medium">
                      {format(new Date(startDate), 'dd MMM yyyy', { locale: fr })} → {' '}
                      {format(new Date(endDate), 'dd MMM yyyy', { locale: fr })}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#2A9D8F]/20">
                    <span className="text-gray-900 font-semibold">Montant Total :</span>
                    <span className="text-lg font-bold text-[#2A9D8F]">
                      {calculatedAmount.toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Avertissement si groupe déjà abonné */}
          {selectedGroupId && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Note importante</p>
                <p className="mt-1">
                  Vérifiez que ce groupe n'a pas déjà un abonnement actif avant de créer un nouveau.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || isPending}
            className="bg-[#2A9D8F] hover:bg-[#238276]"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Créer l'Abonnement
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
