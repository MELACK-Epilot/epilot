/**
 * Presets de permissions pour assignation rapide
 * Permet de choisir des configurations prédéfinies ou personnalisées
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Download, 
  Shield, 
  AlertTriangle,
  Info
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Permissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canExport: boolean;
}

const PERMISSION_PRESETS = [
  {
    id: 'read-only',
    name: 'Lecture seule',
    icon: '👁️',
    description: 'Consulter uniquement',
    color: 'blue',
    permissions: {
      canRead: true,
      canWrite: false,
      canDelete: false,
      canExport: false,
    },
  },
  {
    id: 'read-write',
    name: 'Lecture + Écriture',
    icon: '✏️',
    description: 'Consulter et modifier',
    color: 'green',
    permissions: {
      canRead: true,
      canWrite: true,
      canDelete: false,
      canExport: false,
    },
  },
  {
    id: 'read-write-export',
    name: 'Lecture + Écriture + Export',
    icon: '📥',
    description: 'Consulter, modifier et exporter',
    color: 'purple',
    permissions: {
      canRead: true,
      canWrite: true,
      canDelete: false,
      canExport: true,
    },
  },
  {
    id: 'full-access',
    name: 'Accès complet',
    icon: '🔧',
    description: 'Toutes les permissions',
    color: 'orange',
    permissions: {
      canRead: true,
      canWrite: true,
      canDelete: true,
      canExport: true,
    },
  },
];

interface PermissionPresetsProps {
  currentPermissions: Permissions;
  onPermissionsChange: (permissions: Permissions) => void;
}

export const PermissionPresets = ({ 
  currentPermissions, 
  onPermissionsChange 
}: PermissionPresetsProps) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('custom');

  // Détecter quel preset correspond aux permissions actuelles
  useEffect(() => {
    const matchingPreset = PERMISSION_PRESETS.find(preset => 
      preset.permissions.canRead === currentPermissions.canRead &&
      preset.permissions.canWrite === currentPermissions.canWrite &&
      preset.permissions.canDelete === currentPermissions.canDelete &&
      preset.permissions.canExport === currentPermissions.canExport
    );
    
    setSelectedPreset(matchingPreset?.id || 'custom');
  }, [currentPermissions]);

  const handlePresetClick = (preset: typeof PERMISSION_PRESETS[0]) => {
    setSelectedPreset(preset.id);
    onPermissionsChange(preset.permissions);
  };

  const handlePermissionChange = (key: keyof Permissions, value: boolean) => {
    setSelectedPreset('custom');
    onPermissionsChange({
      ...currentPermissions,
      [key]: value,
    });
  };

  const getPresetColor = (color: string, selected: boolean) => {
    const colors = {
      blue: selected ? 'bg-blue-500 text-white border-blue-500' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
      green: selected ? 'bg-green-500 text-white border-green-500' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
      purple: selected ? 'bg-purple-500 text-white border-purple-500' : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
      orange: selected ? 'bg-orange-500 text-white border-orange-500' : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-4">
      {/* Presets rapides */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-[#2A9D8F]" />
          <Label className="text-sm font-semibold text-gray-900">
            🎯 Presets rapides
          </Label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {PERMISSION_PRESETS.map((preset) => {
            const isSelected = selectedPreset === preset.id;
            return (
              <Button
                key={preset.id}
                variant="outline"
                className={`h-auto py-3 px-4 flex flex-col items-start gap-1 border-2 transition-all ${
                  getPresetColor(preset.color, isSelected)
                }`}
                onClick={() => handlePresetClick(preset)}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="text-lg">{preset.icon}</span>
                  <span className="font-semibold text-sm">{preset.name}</span>
                </div>
                <span className="text-xs opacity-90">{preset.description}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Badge personnalisé */}
      {selectedPreset === 'custom' && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-3 flex items-start gap-2">
          <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 font-medium">
            Configuration personnalisée active. Sélectionnez un preset ou ajustez manuellement.
          </p>
        </div>
      )}

      {/* Permissions détaillées */}
      <div>
        <Label className="text-sm font-semibold text-gray-900 mb-3 block">
          Permissions détaillées
        </Label>
        <div className="space-y-2">
          <PermissionCheckbox
            id="canRead"
            checked={currentPermissions.canRead}
            onChange={(checked) => handlePermissionChange('canRead', checked)}
            icon={<Eye className="h-4 w-4" />}
            emoji="📖"
            label="Lecture"
            description="Consulter les données, voir les listes, accéder aux rapports"
            required
          />
          <PermissionCheckbox
            id="canWrite"
            checked={currentPermissions.canWrite}
            onChange={(checked) => handlePermissionChange('canWrite', checked)}
            icon={<Edit className="h-4 w-4" />}
            emoji="✏️"
            label="Écriture"
            description="Créer et modifier des données, enregistrer des changements"
            disabled={!currentPermissions.canRead}
          />
          <PermissionCheckbox
            id="canDelete"
            checked={currentPermissions.canDelete}
            onChange={(checked) => handlePermissionChange('canDelete', checked)}
            icon={<Trash2 className="h-4 w-4" />}
            emoji="🗑️"
            label="Suppression"
            description="Supprimer définitivement des éléments (action irréversible)"
            danger
            disabled={!currentPermissions.canWrite}
          />
          <PermissionCheckbox
            id="canExport"
            checked={currentPermissions.canExport}
            onChange={(checked) => handlePermissionChange('canExport', checked)}
            icon={<Download className="h-4 w-4" />}
            emoji="📥"
            label="Export"
            description="Exporter les données en Excel, PDF ou autres formats"
            disabled={!currentPermissions.canRead}
          />
        </div>
      </div>

      {/* Avertissement suppression */}
      {currentPermissions.canDelete && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-red-800 font-semibold mb-1">
              ⚠️ Permission de suppression activée
            </p>
            <p className="text-xs text-red-700">
              L'utilisateur pourra supprimer définitivement des données. Cette action est irréversible.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Composant checkbox avec tooltip et description
interface PermissionCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon: React.ReactNode;
  emoji: string;
  label: string;
  description: string;
  danger?: boolean;
  required?: boolean;
  disabled?: boolean;
}

const PermissionCheckbox = ({ 
  id, 
  checked, 
  onChange, 
  icon,
  emoji,
  label, 
  description,
  danger = false,
  required = false,
  disabled = false,
}: PermissionCheckboxProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
            disabled
              ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
              : checked 
                ? danger
                  ? 'bg-red-50 border-red-300 hover:border-red-400'
                  : 'bg-green-50 border-green-300 hover:border-green-400'
                : 'bg-white border-gray-200 hover:border-gray-300'
          }`}>
            <Checkbox
              id={id}
              checked={checked}
              onCheckedChange={onChange}
              disabled={disabled || required}
              className="mt-1"
            />
            <div className="flex-1">
              <Label 
                htmlFor={id} 
                className={`flex items-center gap-2 font-semibold text-gray-900 mb-1 ${
                  disabled ? 'cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <span className="text-lg">{emoji}</span>
                <span>{label}</span>
                {required && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                    Requis
                  </Badge>
                )}
                {danger && checked && (
                  <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-300">
                    Sensible
                  </Badge>
                )}
              </Label>
              <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
            </div>
            <div className="text-gray-400 mt-1">
              {icon}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <p className="text-sm font-semibold mb-1">{label}</p>
          <p className="text-xs">{description}</p>
          {disabled && (
            <p className="text-xs text-amber-600 mt-2">
              ⚠️ Nécessite d'abord: {id === 'canWrite' || id === 'canExport' ? 'Lecture' : 'Écriture'}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
