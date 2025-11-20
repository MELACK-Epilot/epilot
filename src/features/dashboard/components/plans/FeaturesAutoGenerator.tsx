/**
 * Composant d'auto-génération des fonctionnalités
 * Génère automatiquement les fonctionnalités depuis les modules sélectionnés
 * @module FeaturesAutoGenerator
 */

import { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Plus } from 'lucide-react';

interface Feature {
  id: string;
  label: string;
  checked: boolean;
}

interface Module {
  id: string;
  name: string;
  category_id: string;
}

interface FeaturesAutoGeneratorProps {
  selectedModuleIds: string[];
  allModules: Module[];
  value: string;
  onChange: (features: string) => void;
}

export const FeaturesAutoGenerator = ({
  selectedModuleIds,
  allModules,
  value,
  onChange
}: FeaturesAutoGeneratorProps) => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [customFeatures, setCustomFeatures] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Générer automatiquement les fonctionnalités depuis les modules
  useEffect(() => {
    if (!allModules || allModules.length === 0) return;

    const selectedModules = allModules.filter(m => 
      selectedModuleIds.includes(m.id)
    );

    const autoFeatures: Feature[] = selectedModules.map(module => ({
      id: module.id,
      label: module.name,
      checked: true,
    }));

    setFeatures(autoFeatures);
    
    // Mettre à jour le formulaire
    updateFormValue(autoFeatures, customFeatures);
  }, [selectedModuleIds, allModules]);

  const updateFormValue = (currentFeatures: Feature[], custom: string) => {
    const autoFeaturesString = currentFeatures
      .filter(f => f.checked)
      .map(f => f.label)
      .join('\n');
    
    const customLines = custom
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    const allFeatures = [
      ...autoFeaturesString.split('\n').filter(Boolean),
      ...customLines
    ].join('\n');
    
    onChange(allFeatures);
  };

  const toggleFeature = (featureId: string) => {
    const updated = features.map(f => 
      f.id === featureId ? { ...f, checked: !f.checked } : f
    );
    setFeatures(updated);
    updateFormValue(updated, customFeatures);
  };

  const handleCustomFeaturesChange = (value: string) => {
    setCustomFeatures(value);
    updateFormValue(features, value);
  };

  return (
    <div className="space-y-4">
      {/* Message d'information */}
      <div className="flex items-start gap-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
        <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          <strong>Auto-généré</strong> depuis les modules sélectionnés dans l'onglet "Modules & Catégories". 
          Décochez pour exclure une fonctionnalité.
        </div>
      </div>
      
      {/* Liste des fonctionnalités auto-générées */}
      {features.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto p-4 bg-gray-50 rounded-lg border">
          {features.map(feature => (
            <div key={feature.id} className="flex items-center gap-2">
              <Checkbox
                id={feature.id}
                checked={feature.checked}
                onCheckedChange={() => toggleFeature(feature.id)}
              />
              <Label 
                htmlFor={feature.id} 
                className="cursor-pointer text-sm font-normal"
              >
                {feature.label}
              </Label>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg border border-dashed">
          <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p>Sélectionnez des modules dans l'onglet <strong>"Modules & Catégories"</strong></p>
          <p className="text-xs mt-1">pour générer automatiquement les fonctionnalités.</p>
        </div>
      )}

      {/* Bouton pour ajouter des fonctionnalités personnalisées */}
      {!showCustomInput && (
        <button
          type="button"
          onClick={() => setShowCustomInput(true)}
          className="flex items-center gap-2 text-sm text-[#2A9D8F] hover:text-[#1D8A7E] font-medium"
        >
          <Plus className="w-4 h-4" />
          Ajouter des fonctionnalités personnalisées
        </button>
      )}

      {/* Textarea pour fonctionnalités personnalisées */}
      {showCustomInput && (
        <div className="space-y-2">
          <Label htmlFor="custom-features" className="text-sm font-medium">
            Fonctionnalités personnalisées (optionnel)
          </Label>
          <Textarea
            id="custom-features"
            placeholder="Ajoutez des fonctionnalités supplémentaires (une par ligne)..."
            rows={3}
            value={customFeatures}
            onChange={(e) => handleCustomFeaturesChange(e.target.value)}
            className="text-sm"
          />
          <p className="text-xs text-gray-500">
            Ces fonctionnalités seront ajoutées à celles générées automatiquement
          </p>
        </div>
      )}

      {/* Résumé */}
      <div className="flex items-center justify-between text-sm p-3 bg-green-50 rounded-lg border border-green-200">
        <span className="text-gray-700">Total des fonctionnalités :</span>
        <span className="font-bold text-green-700">
          {features.filter(f => f.checked).length + 
           customFeatures.split('\n').filter(line => line.trim().length > 0).length}
        </span>
      </div>
    </div>
  );
};
