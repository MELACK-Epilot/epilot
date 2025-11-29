/**
 * Vue tableau des profils
 */

import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ProfileRow } from './ProfileRow';
import type { AccessProfile } from '@/features/dashboard/hooks/useProfilesView';

interface ProfilesListViewProps {
  profiles: AccessProfile[];
  profileStats: Record<string, number>;
  modulesCounts: Record<string, number>;
  onEdit: (profile: AccessProfile) => void;
  onAssign: (profile: AccessProfile) => void;
  onViewUsers: (code: string) => void;
  onDelete: (id: string) => void;
}

export const ProfilesListView = ({
  profiles,
  profileStats,
  modulesCounts,
  onEdit,
  onAssign,
  onViewUsers,
  onDelete,
}: ProfilesListViewProps) => {
  return (
    <Card className="overflow-hidden border border-gray-200 shadow-sm">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead className="w-[300px]">Profil</TableHead>
            <TableHead>Code Technique</TableHead>
            <TableHead>Utilisateurs</TableHead>
            <TableHead>Modules Actifs</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((profile) => (
            <ProfileRow
              key={profile.id}
              profile={profile}
              userCount={profileStats[profile.code] || 0}
              moduleCount={modulesCounts[profile.code] || 0}
              onEdit={() => onEdit(profile)}
              onAssign={() => onAssign(profile)}
              onViewUsers={() => onViewUsers(profile.code)}
              onDelete={() => onDelete(profile.id)}
            />
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};
