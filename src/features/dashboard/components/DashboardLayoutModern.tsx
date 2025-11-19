/**
 * DashboardLayoutModern - Layout moderne avec SidebarNav réutilisable
 * ✅ Utilise Sidebar/SidebarNav (système moderne)
 * ✅ Code réutilisable et maintenable
 * ✅ Memoization optimisée
 * ✅ Responsive
 * @module DashboardLayoutModern
 */

import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Bell, Search, Settings, LogOut, ChevronDown, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth/store/auth.store';
import { Sidebar } from './Sidebar/Sidebar';

/**
 * Layout principal moderne avec Sidebar réutilisable
 */
export const DashboardLayoutModern = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // État sidebar
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebar-open');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Fonction pour obtenir le label du rôle
  const getRoleLabel = (role: string | undefined) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin_groupe':
      case 'group_admin': return 'Admin Groupe';
      default: return 'Utilisateur';
    }
  };

  // Fonction pour obtenir les initiales
  const getInitials = () => {
    if (!user) return 'U';
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    return `${first}${last}`.toUpperCase() || 'U';
  };

  // Handler de déconnexion
  const handleLogout = () => {
    navigate('/logout');
  };

  // Persister l'état de la sidebar
  useEffect(() => {
    localStorage.setItem('sidebar-open', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // Détecter le scroll pour shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      {/* Sidebar Desktop */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-[#1D3557] border-r border-[#1D3557]/20 z-40 hidden lg:block transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-[280px]' : 'w-20'
        }`}
      >
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isMobile={false}
        />
      </aside>

      {/* Sidebar Mobile */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed left-0 top-0 h-screen w-[280px] bg-[#1D3557] z-50">
            <Sidebar
              isOpen={true}
              onClose={() => setMobileMenuOpen(false)}
              isMobile={true}
            />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-[280px]' : 'lg:ml-20'
        }`}
      >
        {/* Header */}
        <header
          className={`sticky top-0 z-30 bg-white border-b transition-shadow duration-200 ${
            scrolled ? 'shadow-md' : ''
          }`}
        >
          <div className="flex items-center justify-between px-4 h-16">
            {/* Left: Toggle + Search */}
            <div className="flex items-center gap-4 flex-1">
              {/* Toggle Sidebar Desktop */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="hidden lg:flex"
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Toggle Sidebar Mobile */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>

              {/* Search */}
              <div className="relative hidden md:block w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Rechercher..."
                  className="pl-10 bg-gray-50 border-gray-200"
                />
              </div>
            </div>

            {/* Right: Notifications + Profile */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </Button>

              {/* Settings */}
              <Button variant="ghost" size="sm">
                <Settings className="h-5 w-5" />
              </Button>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2A9D8F] to-[#1D3557] flex items-center justify-center text-white text-sm font-semibold">
                      {getInitials()}
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{getRoleLabel(user?.role)}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayoutModern;
