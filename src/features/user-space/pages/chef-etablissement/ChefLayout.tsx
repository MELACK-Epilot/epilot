/**
 * ChefLayout - Layout pour le Chef d'Établissement
 * Intègre la sidebar, le header et le contenu
 * 
 * @module ChefEtablissement/Pages
 */

import { memo, useState, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Hooks
import { useChefDashboard } from '../../hooks/chef-etablissement';

// Composants
import { ChefSidebar, ChefHeader } from '../../components/chef-etablissement';

/**
 * Layout Chef d'Établissement
 */
export const ChefLayout = memo(() => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const { data, alerts, categories } = useChefDashboard();

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const handleLogout = useCallback(() => {
    navigate('/logout');
  }, [navigate]);

  // Si pas de données, afficher quand même le layout avec des valeurs par défaut
  const chef = data?.chef || {
    id: '',
    firstName: 'Utilisateur',
    lastName: '',
    email: '',
    role: 'proviseur' as const,
    accessProfileCode: 'chef_etablissement' as const,
    schoolId: '',
    schoolGroupId: '',
  };

  const school = data?.school || {
    id: '',
    name: 'École',
    code: '',
    schoolGroupId: '',
    schoolGroupName: '',
    createdAt: '',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Sidebar */}
      <ChefSidebar
        isOpen={sidebarOpen}
        onToggle={handleToggleSidebar}
        categories={categories}
        schoolName={school.name}
        userName={`${chef.firstName} ${chef.lastName}`}
      />

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300",
          sidebarOpen ? "lg:ml-72" : "lg:ml-20"
        )}
      >
        {/* Header */}
        <ChefHeader
          chef={chef}
          school={school}
          alerts={alerts || []}
          onMenuClick={handleToggleSidebar}
          onLogout={handleLogout}
        />

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
});

ChefLayout.displayName = 'ChefLayout';

export default ChefLayout;
