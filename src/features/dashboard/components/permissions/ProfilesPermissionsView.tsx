/**
 * Vue Profils - Permissions & Modules
 * Architecture modulaire avec composants découpés
 * 
 * @module ProfilesPermissionsView
 */

import { useProfilesView } from '../../hooks/useProfilesView';
import { ProfileFormDialog } from './ProfileFormDialog';
import { AssignProfileDialog } from './AssignProfileDialog';
import {
  ProfilesToolbar,
  ProfilesGridView,
  ProfilesListView,
} from './profiles-list';

interface ProfilesPermissionsViewProps {
  onRefresh: () => void;
}

export const ProfilesPermissionsView = ({ onRefresh }: ProfilesPermissionsViewProps) => {
  // Hook principal - toute la logique est encapsulée
  const {
    profiles,
    profileStats,
    modulesCounts,
    isLoading,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    isDialogOpen,
    isAssignDialogOpen,
    selectedProfile,
    handleCreateProfile,
    handleEditProfile,
    handleAssignProfile,
    handleViewUsers,
    handleDeleteProfile,
    handleCloseDialog,
    handleCloseAssignDialog,
  } = useProfilesView({ onRefresh });

  if (isLoading) {
    return <div className="py-12 text-center text-gray-500">Chargement des profils...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Toolbar */}
      <ProfilesToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onCreateProfile={handleCreateProfile}
      />

      {/* Views */}
      {viewMode === 'grid' ? (
        <ProfilesGridView
          profiles={profiles}
          profileStats={profileStats}
          modulesCounts={modulesCounts}
          onEdit={handleEditProfile}
          onAssign={handleAssignProfile}
          onViewUsers={handleViewUsers}
          onDelete={handleDeleteProfile}
          onCreate={handleCreateProfile}
        />
      ) : (
        <ProfilesListView
          profiles={profiles}
          profileStats={profileStats}
          modulesCounts={modulesCounts}
          onEdit={handleEditProfile}
          onAssign={handleAssignProfile}
          onViewUsers={handleViewUsers}
          onDelete={handleDeleteProfile}
        />
      )}

      {/* Dialogs */}
      <ProfileFormDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        profileToEdit={selectedProfile}
      />

      <AssignProfileDialog
        isOpen={isAssignDialogOpen}
        onClose={handleCloseAssignDialog}
        role={selectedProfile}
      />
    </div>
  );
};
