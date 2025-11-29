/**
 * Vue grille des profils
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { ProfileCard } from './ProfileCard';
import type { AccessProfile } from '@/features/dashboard/hooks/useProfilesView';

interface ProfilesGridViewProps {
  profiles: AccessProfile[];
  profileStats: Record<string, number>;
  modulesCounts: Record<string, number>;
  onEdit: (profile: AccessProfile) => void;
  onAssign: (profile: AccessProfile) => void;
  onViewUsers: (code: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

export const ProfilesGridView = ({
  profiles,
  profileStats,
  modulesCounts,
  onEdit,
  onAssign,
  onViewUsers,
  onDelete,
  onCreate,
}: ProfilesGridViewProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <AnimatePresence>
        {profiles.map((profile, index) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            userCount={profileStats[profile.code] || 0}
            moduleCount={modulesCounts[profile.code] || 0}
            index={index}
            onEdit={() => onEdit(profile)}
            onAssign={() => onAssign(profile)}
            onViewUsers={() => onViewUsers(profile.code)}
            onDelete={() => onDelete(profile.id)}
          />
        ))}
      </AnimatePresence>
      
      {/* Add Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: profiles.length * 0.05 }}
      >
        <button 
          onClick={onCreate}
          className="w-full h-full min-h-[280px] rounded-xl border-2 border-dashed border-gray-200 hover:border-[#1D3557] bg-gray-50/50 hover:bg-blue-50/30 flex flex-col items-center justify-center gap-4 transition-all duration-300 group text-gray-400 hover:text-[#1D3557]"
        >
          <div className="w-16 h-16 rounded-full bg-white shadow-sm group-hover:shadow-md flex items-center justify-center transition-all duration-300 group-hover:scale-110">
            <Plus className="h-8 w-8" />
          </div>
          <span className="font-medium">Créer un nouveau rôle</span>
        </button>
      </motion.div>
    </div>
  );
};
