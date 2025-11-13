/**
 * Dialog pour voir les permissions d'un utilisateur (lecture seule)
 */

import { useState, useEffect } from 'react';
import { Eye, X, Package, Shield, CheckCircle2, XCircle, Download, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ViewPermissionsDialogProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    email: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onEditPermissions?: () => void;
}

interface Permission {
  id: string;
  module_name: string;
  module_slug: string;
  category_name: string;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
  can_export: boolean;
  assigned_at: string;
  assigned_by: string;
}

export const ViewPermissionsDialog = ({
  user,
  isOpen,
  onClose,
  onEditPermissions,
}: ViewPermissionsDialogProps) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, Permission[]>>({});

  useEffect(() => {
    if (isOpen && user) {
      loadPermissions();
    }
  }, [isOpen, user]);

  const loadPermissions = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('user_module_permissions')
        .select('*')
        .eq('user_id', user.id)
        .order('category_name', { ascending: true })
        .order('module_name', { ascending: true });

      if (error) throw error;

      setPermissions(data || []);

      // Grouper par catégorie
      const grouped = (data || []).reduce((acc: Record<string, Permission[]>, perm: Permission) => {
        const category = perm.category_name || 'Sans catégorie';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(perm);
        return acc;
      }, {});

      setGroupedPermissions(grouped);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des permissions');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin_groupe: 'Admin Groupe',
      proviseur: 'Proviseur',
      directeur: 'Directeur',
      enseignant: 'Enseignant',
      cpe: 'CPE',
      comptable: 'Comptable',
    };
    return labels[role] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin_groupe: 'bg-blue-100 text-blue-700 border-blue-200',
      proviseur: 'bg-green-100 text-green-700 border-green-200',
      directeur: 'bg-green-100 text-green-700 border-green-200',
      enseignant: 'bg-orange-100 text-orange-700 border-orange-200',
      cpe: 'bg-purple-100 text-purple-700 border-purple-200',
      comptable: 'bg-pink-100 text-pink-700 border-pink-200',
    };
    return colors[role] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const exportPermissions = () => {
    if (!user) return;

    const csvContent = [
      ['Module', 'Catégorie', 'Lecture', 'Écriture', 'Suppression', 'Export', 'Date d\'assignation'],
      ...permissions.map(p => [
        p.module_name,
        p.category_name,
        p.can_read ? 'Oui' : 'Non',
        p.can_write ? 'Oui' : 'Non',
        p.can_delete ? 'Oui' : 'Non',
        p.can_export ? 'Oui' : 'Non',
        new Date(p.assigned_at).toLocaleDateString('fr-FR'),
      ])
    ].map(row => row.join(';')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `permissions_${user.firstName}_${user.lastName}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success('Permissions exportées');
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Eye className="h-6 w-6 text-[#2A9D8F]" />
              Permissions de l'utilisateur
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* En-tête utilisateur */}
        <div className="bg-gradient-to-r from-teal-50 to-green-50 p-4 rounded-lg border-2 border-teal-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(user as any).photoUrl || (user as any).avatar ? (
                <img
                  src={(user as any).photoUrl || (user as any).avatar}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#2A9D8F] to-[#1d7a6e] text-white flex items-center justify-center text-xl font-bold shadow-md">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
              )}
              <div>
                <p className="font-bold text-lg text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-sm text-gray-600">{user.email}</p>
                <Badge variant="outline" className={`mt-1 ${getRoleBadgeColor(user.role)}`}>
                  {getRoleLabel(user.role)}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <Badge className="bg-[#2A9D8F] text-white text-lg px-4 py-2">
                {permissions.length} module(s)
              </Badge>
            </div>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A9D8F]"></div>
            </div>
          ) : permissions.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Aucune permission assignée</p>
              <p className="text-sm text-gray-500 mt-2">
                Cet utilisateur n'a accès à aucun module pour le moment
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                  {/* En-tête catégorie */}
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-4 py-3 border-b-2 border-gray-300">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Package className="h-5 w-5 text-[#2A9D8F]" />
                        {category}
                      </h3>
                      <Badge variant="secondary">{perms.length} module(s)</Badge>
                    </div>
                  </div>

                  {/* Liste des modules */}
                  <div className="divide-y divide-gray-200">
                    {perms.map((perm) => (
                      <div key={perm.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 mb-2">{perm.module_name}</p>
                            <div className="flex flex-wrap gap-2">
                              {perm.can_read && (
                                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Lecture
                                </Badge>
                              )}
                              {perm.can_write && (
                                <Badge className="bg-green-100 text-green-700 border-green-200">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Écriture
                                </Badge>
                              )}
                              {perm.can_delete && (
                                <Badge className="bg-red-100 text-red-700 border-red-200">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Suppression
                                </Badge>
                              )}
                              {perm.can_export && (
                                <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Export
                                </Badge>
                              )}
                              {!perm.can_read && !perm.can_write && !perm.can_delete && !perm.can_export && (
                                <Badge variant="secondary">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Aucune permission
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-xs text-gray-500">
                              Assigné le {new Date(perm.assigned_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={exportPermissions}
            disabled={permissions.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter (CSV)
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
            {onEditPermissions && (
              <Button
                onClick={() => {
                  onClose();
                  onEditPermissions();
                }}
                className="bg-gradient-to-r from-[#2A9D8F] to-[#1d7a6e] hover:from-[#238276] hover:to-[#165e54] text-white"
              >
                <FileText className="h-4 w-4 mr-2" />
                Modifier les permissions
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
