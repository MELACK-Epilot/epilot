/**
 * Composant Filtres pour la page Assigner des Modules
 */

import { Search, Filter, Building2, CheckCircle, Ban } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AnimatedSection } from '@/components/ui/animated-section';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AssignModulesFiltersProps {
  searchInput: string;
  setSearchInput: (value: string) => void;
  roleFilter: string;
  setRoleFilter: (value: string) => void;
  schoolFilter: string;
  setSchoolFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  availableRoles: string[];
  schools: Array<{ id: string; name: string }>;
  stats: {
    totalUsers: number;
    roleCount: Record<string, number>;
  };
  filteredUsersCount: number;
  selectedUsersCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  getRoleLabel: (role: string) => string;
}

export function AssignModulesFilters({
  searchInput,
  setSearchInput,
  roleFilter,
  setRoleFilter,
  schoolFilter,
  setSchoolFilter,
  statusFilter,
  setStatusFilter,
  availableRoles,
  schools,
  stats,
  filteredUsersCount,
  selectedUsersCount,
  onSelectAll,
  onDeselectAll,
  getRoleLabel,
}: AssignModulesFiltersProps) {
  return (
    <AnimatedSection delay={0.1}>
      <Card className="p-4 border-0 shadow-lg">
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[220px] h-10">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrer par rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles ({stats.totalUsers})</SelectItem>
                {availableRoles.map(role => (
                  <SelectItem key={role} value={role}>
                    {getRoleLabel(role)} ({stats.roleCount[role] || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={schoolFilter} onValueChange={setSchoolFilter}>
              <SelectTrigger className="w-full md:w-[200px] h-10">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="École" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les écoles</SelectItem>
                {schools.map(school => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[160px] h-10">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Actifs
                  </div>
                </SelectItem>
                <SelectItem value="inactive">
                  <div className="flex items-center gap-2">
                    <Ban className="h-3 w-3 text-gray-400" />
                    Inactifs
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onSelectAll}>
                <CheckCircle className="h-3 w-3 mr-1" />
                Tout sélectionner
              </Button>
              {selectedUsersCount > 0 && (
                <Button variant="outline" size="sm" onClick={onDeselectAll}>
                  Désélectionner
                </Button>
              )}
            </div>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">{filteredUsersCount}</span> utilisateur(s) trouvé(s)
            </p>
          </div>
        </div>
      </Card>
    </AnimatedSection>
  );
}
