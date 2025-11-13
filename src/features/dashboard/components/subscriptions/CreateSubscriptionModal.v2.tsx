/**
 * Modal de Création d'Abonnement - VERSION SIMPLIFIÉE
 * ✅ React 19 + Best Practices 2025
 * ✅ 3 champs seulement (groupe, date, paiement)
 * ✅ Tout le reste est automatique (plan, montant, période)
 * @module CreateSubscriptionModal
 */

import { useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCreateSubscription } from '../../hooks/useSubscriptions';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Calendar, DollarSign, Building2, CreditCard, Loader2, CheckCircle2, AlertCircle, Package } from 'lucide-react';
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
  plan: string;
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

  // ✅ États du formulaire (SEULEMENT 3 CHAMPS)
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState<string>('bank_transfer');

  // ✅ Récupérer les groupes scolaires
  const { data: schoolGroups, isLoading: loadingGroups } = useQuery({
    queryKey: ['school-groups-for-subscription'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('school_groups')
        .select('id, name, code, plan')
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

  // ✅ Groupe sélectionné
  const selectedGroup = useMemo(() => 
    schoolGroups?.find(g => g.id === selectedGroupId),
    [schoolGroups, selectedGroupId]
  );

  // ✅ Récupérer le plan du groupe automatiquement
  const { data: plan, isLoading: loadingPlan } = useQuery({
    queryKey: ['plan-for-group', selectedGroup?.plan],
    queryFn: async () => {
      if (!selectedGroup?.plan) return null;

      const { data, error } = await supabase
        .from('subscription_plans')
        .select('id, name, slug, price, billing_period, description')
        .eq('slug', selectedGroup.plan)
        .single();

      if (error) throw error;
      return data as Plan;
    },
    enabled: !!selectedGroup?.plan,
  });

  // ✅ Calculer automatiquement la date de fin
  const endDate = useMemo(() => {
    if (!startDate || !plan) return '';
    
    const start = new Date(startDate);
    const end = plan.billing_period === 'monthly' 
      ? addMonths(start, 1)
      : addYears(start, 1);
    
    return format(end, 'yyyy-MM-dd');
  }, [startDate, plan]);

  // ✅ Validation
  const isValid = selectedGroupId && startDate && plan;

  // ✅ Soumettre (useCallback pour stabilité)
  const handleSubmit = useCallback(() => {
    if (!isValid || !plan) {
      toast({
        title: 'Formulaire incomplet',
        description: 'Veuillez sélectionner un groupe',
        variant: 'destructive',
      });
      return;
    }

    createSubscription(
      {
        schoolGroupId: selectedGroupId,
        planId: plan.id,
        startDate,
        endDate,
        autoRenew: true,
        amount: plan.price,
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
  }, [isValid, plan, selectedGroupId, startDate, endDate, paymentMethod, createSubscription, toast]);

  // ✅ Fermer et réinitialiser
  const handleClose = useCallback(() => {
    setSelectedGroupId('');
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setPaymentMethod('bank_transfer');
    onClose();
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-[#2A9D8F]" />
            Créer un Nouvel Abonnement
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-2">
            Sélectionnez un groupe. Le plan, le montant et la période seront récupérés automatiquement.
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 1. Groupe Scolaire */}
          <div className="space-y-2">
            <Label htmlFor="school-group" className="flex items-center gap-2 text-base font-semibold">
              <Building2 className="w-5 h-5 text-[#2A9D8F]" />
              Groupe Scolaire *
            </Label>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger id="school-group" disabled={loadingGroups} className="h-12">
                <SelectValue placeholder="Sélectionner un groupe scolaire" />
              </SelectTrigger>
              <SelectContent>
                {schoolGroups?.map(group => (
                  <SelectItem key={group.id} value={group.id}>
                    <div className="flex flex-col py-1">
                      <span className="font-medium">{group.name}</span>
                      <span className="text-xs text-gray-500">
                        {group.code} • Plan: {group.plan} • {group.schoolsCount} école(s)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Date de Début */}
          <div className="space-y-2">
            <Label htmlFor="start-date" className="flex items-center gap-2 text-base font-semibold">
              <Calendar className="w-5 h-5 text-[#2A9D8F]" />
              Date de Début *
            </Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-12"
            />
          </div>

          {/* 3. Méthode de Paiement */}
          <div className="space-y-2">
            <Label htmlFor="payment-method" className="flex items-center gap-2 text-base font-semibold">
              <CreditCard className="w-5 h-5 text-[#2A9D8F]" />
              Méthode de Paiement
            </Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="payment-method" className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">🏦 Virement Bancaire</SelectItem>
                <SelectItem value="mobile_money">📱 Mobile Money</SelectItem>
                <SelectItem value="cash">💵 Espèces</SelectItem>
                <SelectItem value="check">📝 Chèque</SelectItem>
                <SelectItem value="card">💳 Carte Bancaire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Résumé Automatique */}
          <AnimatePresence>
            {selectedGroup && plan && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-gradient-to-br from-[#2A9D8F]/10 to-[#1D3557]/10 rounded-xl p-6 border-2 border-[#2A9D8F]/20"
              >
                <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-[#2A9D8F]" />
                  Résumé de l'Abonnement
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Groupe :</span>
                    <span className="font-semibold text-gray-900">{selectedGroup.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Plan :</span>
                    <span className="font-semibold text-gray-900">{plan.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Période :</span>
                    <span className="font-semibold text-gray-900">
                      {plan.billing_period === 'monthly' ? '📅 Mensuel' : '📆 Annuel'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Durée :</span>
                    <span className="font-semibold text-gray-900">
                      {format(new Date(startDate), 'dd MMM yyyy', { locale: fr })} → {' '}
                      {format(new Date(endDate), 'dd MMM yyyy', { locale: fr })}
                    </span>
                  </div>
                  <div className="pt-3 border-t-2 border-[#2A9D8F]/20 flex justify-between items-center">
                    <span className="text-gray-900 font-bold text-lg">Montant Total :</span>
                    <span className="text-2xl font-bold text-[#2A9D8F]">
                      {plan.price.toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info : Plan récupéré automatiquement */}
          {selectedGroup && !loadingPlan && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">✨ Informations automatiques</p>
                <p>
                  Le plan, le montant et la période de facturation sont récupérés automatiquement 
                  depuis le plan du groupe sélectionné (<strong>{selectedGroup.plan}</strong>).
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
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
            disabled={!isValid || isPending || loadingPlan}
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
