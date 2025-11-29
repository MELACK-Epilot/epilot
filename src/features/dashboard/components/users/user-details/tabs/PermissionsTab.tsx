/**
 * Onglet Permissions
 * @module user-details/tabs/PermissionsTab
 */

import { Shield, Briefcase } from 'lucide-react';
import { getRoleLabel, getProfileLabel } from '../utils';
import type { UserModule } from '../types';

interface PermissionsTabProps {
  role: string;
  accessProfileCode: string | null | undefined;
  modules: UserModule[];
}

export const PermissionsTab = ({ role, accessProfileCode, modules }: PermissionsTabProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-600" />
            Rôle Système
          </h3>
          <div className="p-4 bg-emerald-50 rounded-lg">
            <p className="text-lg font-bold text-emerald-900">{getRoleLabel(role)}</p>
            <p className="text-sm text-emerald-700 mt-1">
              Définit les accès de base dans l'application
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-blue-600" />
            Profil d'Accès
          </h3>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-lg font-bold text-blue-900">
              {getProfileLabel(accessProfileCode)}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Définit les modules et permissions granulaires
            </p>
          </div>
        </div>
      </div>

      {/* Permissions Summary */}
      <div className="bg-white p-5 rounded-xl border shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Résumé des Droits</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-700">
              {modules.filter((m) => m.can_read).length}
            </p>
            <p className="text-xs text-green-600">Lecture</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-700">
              {modules.filter((m) => m.can_write).length}
            </p>
            <p className="text-xs text-blue-600">Écriture</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-700">
              {modules.filter((m) => m.can_delete).length}
            </p>
            <p className="text-xs text-red-600">Suppression</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-700">
              {modules.filter((m) => m.can_export).length}
            </p>
            <p className="text-xs text-purple-600">Export</p>
          </div>
        </div>
      </div>
    </div>
  );
};
