/**
 * Modal de configuration pour appliquer une recommandation
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, TrendingUp, Zap, Lightbulb, CheckCircle2 } from 'lucide-react';
import type { Recommendation } from '../../../types/optimization.types';

interface ApplyRecommendationDialogProps {
  recommendation: Recommendation | null;
  open: boolean;
  onClose: () => void;
  onApply: (recommendation: Recommendation, config: any) => void;
}

export const ApplyRecommendationDialog = ({
  recommendation,
  open,
  onClose,
  onApply,
}: ApplyRecommendationDialogProps) => {
  const [config, setConfig] = useState<any>({});
  const [isApplying, setIsApplying] = useState(false);

  if (!recommendation) return null;

  const getIcon = () => {
    switch (recommendation.type) {
      case 'pricing':
        return <TrendingUp className="w-6 h-6 text-purple-600" />;
      case 'features':
        return <Zap className="w-6 h-6 text-purple-600" />;
      case 'marketing':
        return <Lightbulb className="w-6 h-6 text-purple-600" />;
      case 'retention':
        return <CheckCircle2 className="w-6 h-6 text-purple-600" />;
      default:
        return <AlertCircle className="w-6 h-6 text-purple-600" />;
    }
  };

  const renderConfigFields = () => {
    switch (recommendation.type) {
      case 'pricing':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPrice">Nouveau Prix (FCFA)</Label>
              <Input
                id="newPrice"
                type="number"
                placeholder="Ex: 57500"
                value={config.newPrice || ''}
                onChange={(e) => setConfig({ ...config, newPrice: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Prix actuel: {recommendation.planName ? 'À récupérer de la BD' : 'N/A'}
              </p>
            </div>
            <div>
              <Label htmlFor="effectiveDate">Date d'application</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={config.effectiveDate || ''}
                onChange={(e) => setConfig({ ...config, effectiveDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="notifyUsers">
                <input
                  type="checkbox"
                  id="notifyUsers"
                  checked={config.notifyUsers || false}
                  onChange={(e) => setConfig({ ...config, notifyUsers: e.target.checked })}
                  className="mr-2"
                />
                Notifier les clients existants
              </Label>
            </div>
          </div>
        );

      case 'features':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="featureName">Nom de la fonctionnalité</Label>
              <Input
                id="featureName"
                placeholder="Ex: Bulletins Automatisés"
                value={config.featureName || ''}
                onChange={(e) => setConfig({ ...config, featureName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="featureDescription">Description</Label>
              <Textarea
                id="featureDescription"
                placeholder="Décrivez la fonctionnalité..."
                value={config.featureDescription || ''}
                onChange={(e) => setConfig({ ...config, featureDescription: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="targetPlan">Plan cible</Label>
              <Input
                id="targetPlan"
                value={recommendation.planName || ''}
                disabled
              />
            </div>
          </div>
        );

      case 'marketing':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="campaignName">Nom de la campagne</Label>
              <Input
                id="campaignName"
                placeholder="Ex: Campagne Croissance Q4"
                value={config.campaignName || ''}
                onChange={(e) => setConfig({ ...config, campaignName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="budget">Budget (FCFA)</Label>
              <Input
                id="budget"
                type="number"
                placeholder="Ex: 500000"
                value={config.budget || ''}
                onChange={(e) => setConfig({ ...config, budget: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="duration">Durée (jours)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="Ex: 30"
                value={config.duration || ''}
                onChange={(e) => setConfig({ ...config, duration: e.target.value })}
              />
            </div>
          </div>
        );

      case 'retention':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="programName">Nom du programme</Label>
              <Input
                id="programName"
                placeholder="Ex: Programme Fidélité Premium"
                value={config.programName || ''}
                onChange={(e) => setConfig({ ...config, programName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="targetSegment">Segment cible</Label>
              <select
                id="targetSegment"
                value={config.targetSegment || 'at-risk'}
                onChange={(e) => setConfig({ ...config, targetSegment: e.target.value })}
                className="w-full border rounded-md p-2"
              >
                <option value="at-risk">Clients à risque</option>
                <option value="inactive">Clients inactifs</option>
                <option value="all">Tous les clients</option>
              </select>
            </div>
            <div>
              <Label htmlFor="incentive">Incitation</Label>
              <Textarea
                id="incentive"
                placeholder="Ex: Réduction 20% sur renouvellement"
                value={config.incentive || ''}
                onChange={(e) => setConfig({ ...config, incentive: e.target.value })}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Ajoutez des notes..."
                value={config.notes || ''}
                onChange={(e) => setConfig({ ...config, notes: e.target.value })}
              />
            </div>
          </div>
        );
    }
  };

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApply(recommendation, config);
      onClose();
      setConfig({});
    } catch (error) {
      console.error('Erreur application:', error);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {getIcon()}
            <DialogTitle className="text-xl">Appliquer la recommandation</DialogTitle>
          </div>
          <DialogDescription>
            {recommendation.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Résumé de la recommandation */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-2">Impact estimé</h4>
            <p className="text-sm text-purple-700">{recommendation.impact}</p>
            <p className="text-xs text-purple-600 mt-2">{recommendation.description}</p>
          </div>

          {/* Champs de configuration */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Configuration</h4>
            {renderConfigFields()}
          </div>

          {/* Avertissement */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Important</p>
              <p className="text-xs mt-1">
                Cette action sera enregistrée et l'impact sera suivi automatiquement.
                Vous pourrez consulter les résultats dans le tableau de bord de suivi.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isApplying}>
            Annuler
          </Button>
          <Button
            onClick={handleApply}
            disabled={isApplying}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            {isApplying ? 'Application...' : 'Appliquer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
