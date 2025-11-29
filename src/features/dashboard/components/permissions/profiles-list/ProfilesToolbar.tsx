/**
 * Barre d'outils pour la liste des profils
 * Recherche + Toggle vue + Bouton création
 */

import { Search, LayoutGrid, List, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ViewMode } from '@/features/dashboard/hooks/useProfilesView';

interface ProfilesToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onCreateProfile: () => void;
}

export const ProfilesToolbar = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onCreateProfile,
}: ProfilesToolbarProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-4 w-full sm:w-auto">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Rechercher un rôle..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-all"
          />
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 rounded-md transition-all ${
              viewMode === 'grid' 
                ? 'bg-white shadow-sm text-[#1D3557]' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            title="Vue Grille"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 rounded-md transition-all ${
              viewMode === 'list' 
                ? 'bg-white shadow-sm text-[#1D3557]' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            title="Vue Liste"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Create Button */}
      <Button 
        onClick={onCreateProfile} 
        className="w-full sm:w-auto gap-2 bg-[#1D3557] hover:bg-[#162942] shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02]"
      >
        <Plus className="h-4 w-4" />
        Nouveau Profil
      </Button>
    </div>
  );
};
