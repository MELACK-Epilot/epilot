/**
 * Composant Vue Groupée pour les utilisateurs (par école ou rôle)
 */

import {
  Building2,
  Layers,
  ChevronDown,
  ChevronRight,
  Package,
  Mail,
  Zap,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AssignModulesUser } from '../../types/assign-modules.types';

interface UserGroupedViewProps {
  groupedUsers: Record<string, AssignModulesUser[]>;
  groupType: 'school' | 'role';
  isLoading: boolean;
  expandedGroups: Set<string>;
  schools?: Array<{ id: string; name: string }>;
  onToggleGroup: (groupKey: string) => void;
  onAssignModules: (user: AssignModulesUser) => void;
  getRoleLabel: (role: string) => string;
  getRoleBadgeColor: (role: string) => string;
}

export function UserGroupedView({
  groupedUsers,
  groupType,
  isLoading,
  expandedGroups,
  schools,
  onToggleGroup,
  onAssignModules,
  getRoleLabel,
  getRoleBadgeColor,
}: UserGroupedViewProps) {
  const Icon = groupType === 'school' ? Building2 : Layers;
  const emptyMessage = groupType === 'school' ? 'Aucune école trouvée' : 'Aucun rôle trouvé';
  const colorScheme = groupType === 'school' 
    ? { from: 'from-blue-50', bg: 'bg-blue-100', text: 'text-blue-600', hover: 'hover:bg-blue-100', hoverRow: 'hover:bg-blue-50/50', badge: 'bg-blue-100 text-blue-700 border-blue-200' }
    : { from: 'from-purple-50', bg: 'bg-purple-100', text: 'text-purple-600', hover: 'hover:bg-purple-100', hoverRow: 'hover:bg-purple-50/50', badge: 'bg-purple-100 text-purple-700 border-purple-200' };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A9D8F]"></div>
      </div>
    );
  }

  if (Object.keys(groupedUsers).length === 0) {
    return (
      <Card className="border-0 shadow-lg p-12">
        <div className="text-center">
          <Icon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">{emptyMessage}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedUsers).map(([groupKey, groupUsers]) => {
        const isExpanded = expandedGroups.has(groupKey);
        const groupName = groupType === 'school'
          ? schools?.find(s => s.id === groupKey)?.name || 'Sans école'
          : getRoleLabel(groupKey);

        return (
          <Card key={groupKey} className="border-0 shadow-lg overflow-hidden">
            <div
              className={`p-4 bg-gradient-to-r ${colorScheme.from} to-white border-b cursor-pointer ${colorScheme.hover} transition-colors`}
              onClick={() => onToggleGroup(groupKey)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${colorScheme.bg} rounded-lg`}>
                    <Icon className={`h-5 w-5 ${colorScheme.text}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{groupName}</h3>
                    <p className="text-sm text-gray-600">
                      {groupUsers.length} utilisateur{groupUsers.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={colorScheme.badge}>
                    {groupUsers.length}
                  </Badge>
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                  )}
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="divide-y">
                {groupUsers.map((user: AssignModulesUser) => (
                  <div
                    key={user.id}
                    className={`p-4 ${colorScheme.hoverRow} transition-colors`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        {user.photoUrl || user.avatar ? (
                          <img
                            src={user.photoUrl || user.avatar}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2A9D8F] to-[#1d7a6e] text-white flex items-center justify-center text-sm font-bold shadow-md">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </div>
                        )}

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {user.firstName} {user.lastName}
                            </h3>
                            {groupType === 'school' ? (
                              <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                                {getRoleLabel(user.role)}
                              </Badge>
                            ) : user.schoolName ? (
                              <Badge variant="outline" className="bg-gray-100 text-gray-700">
                                <Building2 className="h-3 w-3 mr-1" />
                                {user.schoolName}
                              </Badge>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {user.assignedModulesCount || 0} module(s)
                            </div>
                            {user.lastLoginAt && (
                              <div className="flex items-center gap-1 text-xs">
                                <span className="text-gray-500">
                                  Dernière connexion: {new Date(user.lastLoginAt).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => onAssignModules(user)}
                        className="bg-gradient-to-r from-[#2A9D8F] to-[#1d7a6e] hover:from-[#238276] hover:to-[#165e54] text-white shadow-md"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Assigner
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
