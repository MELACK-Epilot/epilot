/**
 * Layout pour l'espace utilisateur école
 * Adapté aux rôles : enseignant, CPE, comptable, etc.
 */

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { UserSidebar } from './UserSidebar';
import { UserHeaderPremium } from './UserHeaderPremium';
import { NavigationProvider } from '../contexts/NavigationContext';

export const UserSpaceLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <NavigationProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Sidebar */}
        <UserSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

        {/* Main Content */}
        <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
          {/* Header */}
          <UserHeaderPremium onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

          {/* Page Content */}
          <main className="p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </NavigationProvider>
  );
};
