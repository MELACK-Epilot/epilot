/**
 * Composant de sélection de plan avec mise à jour temps réel
 * Utilise React 19 + Suspense + useTransition pour une UX fluide
 */

import { useState, useTransition, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, AlertCircle, Zap, Crown, Star } from 'lucide-react';
import { useSubscriptionStore, subscriptionSelectors } from '@/stores/subscription.store';
import { useReactiveModules, useSubscriptionStats } from '@/hooks/useReactiveModules';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PlanSelectorProps {
  schoolGroupId: string;
  onPlanChanged?: (planId: string) => void;
}

/**
 * Composant principal de sélection de plan
 */
export const PlanSelector: React.FC<PlanSelectorProps> = ({
  schoolGroupId,
  onPlanChanged,
}) => {
  const [isPending, startTransition] = useTransition();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  
  // État du store
  const currentSubscription = useSubscriptionStore((state) => state.currentSubscription);
  const isLoading = useSubscriptionStore(subscriptionSelectors.isLoading);
  const error = useSubscriptionStore(subscriptionSelectors.error);
  const updateSubscriptionPlan = useSubscriptionStore((state) => state.updateSubscriptionPlan);
  
  // Hooks réactifs
  const { modules, changePlan } = useReactiveModules(schoolGroupId);
  const stats = useSubscriptionStats(schoolGroupId);

  /**
   * Query pour récupérer les plans disponibles
   */
  const { data: availablePlans, isLoading: plansLoading } = useQuery({
    queryKey: ['available-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select(`
          id,
          name,
          slug,
          description,
          price,
          status,
          plan_modules(
            modules(id, name)
          )
        `)
        .eq('status', 'active')
        .order('price');

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  /**
   * Gestionnaire de changement de plan avec optimistic updates
   */
  const handlePlanChange = async (planId: string, planSlug: string) => {
    if (planId === currentSubscription?.plan_id) return;

    setSelectedPlanId(planId);
    
    startTransition(async () => {
      try {
        await changePlan(planId, planSlug);
        onPlanChanged?.(planId);
      } catch (error) {
        console.error('Erreur changement de plan:', error);
      } finally {
        setSelectedPlanId(null);
      }
    });
  };

  if (plansLoading) {
    return <PlanSelectorSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          Choisir votre plan d'abonnement
        </h2>
        <p className="text-gray-600">
          Accédez à {stats.accessibleModules} modules sur {stats.totalModules} disponibles
        </p>
      </div>

      {/* Alerte d'erreur */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grille des plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {availablePlans?.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={plan.id === currentSubscription?.plan_id}
            isSelected={selectedPlanId === plan.id}
            isPending={isPending && selectedPlanId === plan.id}
            onSelect={() => handlePlanChange(plan.id, plan.slug)}
            modules={modules}
          />
        ))}
      </div>

      {/* Aperçu des modules avec le plan sélectionné */}
      <Suspense fallback={<ModulePreviewSkeleton />}>
        <ModulePreview modules={modules} />
      </Suspense>
    </div>
  );
};

/**
 * Carte de plan individuelle
 */
interface PlanCardProps {
  plan: any;
  isCurrentPlan: boolean;
  isSelected: boolean;
  isPending: boolean;
  onSelect: () => void;
  modules: any;
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  isCurrentPlan,
  isSelected,
  isPending,
  onSelect,
  modules,
}) => {
  const planIcons = {
    gratuit: <Star className="h-6 w-6" />,
    premium: <Zap className="h-6 w-6" />,
    pro: <Crown className="h-6 w-6" />,
    institutionnel: <Crown className="h-6 w-6" />,
  };

  const planColors = {
    gratuit: 'from-gray-500 to-gray-600',
    premium: 'from-blue-500 to-blue-600',
    pro: 'from-purple-500 to-purple-600',
    institutionnel: 'from-gold-500 to-gold-600',
  };

  const moduleCount = plan.plan_modules?.length || 0;
  const accessibleCount = modules.accessible.length;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative"
    >
      <Card 
        className={`p-6 cursor-pointer transition-all duration-200 ${
          isCurrentPlan 
            ? 'ring-2 ring-green-500 bg-green-50' 
            : isSelected 
            ? 'ring-2 ring-blue-500 bg-blue-50'
            : 'hover:shadow-lg'
        }`}
        onClick={onSelect}
      >
        {/* Badge plan actuel */}
        {isCurrentPlan && (
          <div className="absolute -top-2 -right-2">
            <Badge className="bg-green-500 text-white">
              <Check className="h-3 w-3 mr-1" />
              Actuel
            </Badge>
          </div>
        )}

        {/* Header du plan */}
        <div className="text-center space-y-4">
          <div className={`w-12 h-12 mx-auto rounded-full bg-gradient-to-r ${planColors[plan.slug as keyof typeof planColors]} flex items-center justify-center text-white`}>
            {planIcons[plan.slug as keyof typeof planIcons]}
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
            <p className="text-gray-600 text-sm">{plan.description}</p>
          </div>

          <div className="space-y-1">
            <div className="text-3xl font-bold text-gray-900">
              {plan.price === 0 ? 'Gratuit' : `${plan.price.toLocaleString()} FCFA`}
            </div>
            {plan.price > 0 && (
              <div className="text-gray-500 text-sm">par mois</div>
            )}
          </div>
        </div>

        {/* Statistiques */}
        <div className="mt-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Modules inclus</span>
            <Badge variant="secondary">{moduleCount}</Badge>
          </div>
          
          {isCurrentPlan && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Accessibles</span>
              <Badge variant="default">{accessibleCount}</Badge>
            </div>
          )}
        </div>

        {/* Bouton d'action */}
        <div className="mt-6">
          <Button
            className="w-full"
            variant={isCurrentPlan ? "secondary" : "default"}
            disabled={isCurrentPlan || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Activation...
              </>
            ) : isCurrentPlan ? (
              'Plan actuel'
            ) : (
              'Choisir ce plan'
            )}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

/**
 * Aperçu des modules
 */
const ModulePreview: React.FC<{ modules: any }> = ({ modules }) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">
        Modules disponibles ({modules.accessible.length})
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {modules.accessible.slice(0, 8).map((module: any) => (
          <div
            key={module.id}
            className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
          >
            <span className="text-lg">{module.icon}</span>
            <span className="text-sm font-medium truncate">{module.name}</span>
          </div>
        ))}
        
        {modules.accessible.length > 8 && (
          <div className="flex items-center justify-center p-2 bg-gray-100 rounded-lg text-gray-500">
            +{modules.accessible.length - 8} autres
          </div>
        )}
      </div>
    </Card>
  );
};

/**
 * Skeletons pour le chargement
 */
const PlanSelectorSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: 4 }).map((_, i) => (
      <Card key={i} className="p-6 animate-pulse">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
            <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto" />
          </div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </Card>
    ))}
  </div>
);

const ModulePreviewSkeleton = () => (
  <Card className="p-6 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-10 bg-gray-200 rounded" />
      ))}
    </div>
  </Card>
);
