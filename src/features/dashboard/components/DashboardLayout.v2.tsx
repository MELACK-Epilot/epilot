/**
 * Layout principal du Dashboard Super Admin - VERSION ULTRA-OPTIMISÉE
 * ✅ Pas de glassmorphism (performance maximale)
 * ✅ Header fixe avec shadow au scroll
 * ✅ Sidebar avec thème dédié
 * ✅ Transitions CSS natives uniquement
 * ✅ Mobile-first responsive
 * @module DashboardLayout
 */

import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Briefcase,
  CreditCard,
  Package,
  MessageSquare,
  FileText,
  Activity,
  Trash2,
  Menu,
  X,
  Bell,
  Search,
  Settings,
  LogOut,
  ChevronDown,
  School,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
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

/**
 * Navigation items
 */
const navigationItems = [
  {
    title: 'Tableau de bord',
    icon: LayoutDashboard,
    href: '/dashboard',
    badge: null,
  },
  {
    title: 'Groupes Scolaires',
    icon: Building2,
    href: '/dashboard/school-groups',
    badge: null,
  },
  {
    title: 'Utilisateurs',
    icon: Users,
    href: '/dashboard/users',
    badge: null,
  },
  {
    title: 'Catégories Métiers',
    icon: Briefcase,
    href: '/dashboard/categories',
    badge: null,
  },
  {
    title: 'Plans & Tarification',
    icon: CreditCard,
    href: '/dashboard/plans',
    badge: null,
  },
  {
    title: 'Abonnements',
    icon: Package,
    href: '/dashboard/subscriptions',
    badge: 3,
  },
  {
    title: 'Modules',
    icon: Package,
    href: '/dashboard/modules',
    badge: null,
  },
  {
    title: 'Communication',
    icon: MessageSquare,
    href: '/dashboard/communication',
    badge: 5,
  },
  {
    title: 'Rapports',
    icon: FileText,
    href: '/dashboard/reports',
    badge: null,
  },
  {
    title: "Journal d'Activité",
    icon: Activity,
    href: '/dashboard/activity-logs',
    badge: null,
  },
  {
    title: 'Corbeille',
    icon: Trash2,
    href: '/dashboard/trash',
    badge: null,
  },
];

/**
 * Composant Layout principal - ULTRA-OPTIMISÉ
 */
export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Persister l'état dans localStorage
    const saved = localStorage.getItem('sidebar-open');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const location = useLocation();

  // Persister l'état de la sidebar
  useEffect(() => {
    localStorage.setItem('sidebar-open', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // Détecter le scroll pour ajouter shadow au header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      {/* Sidebar Desktop - Thème dédié */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-[#1D3557] border-r border-[#1D3557]/20 z-40 hidden lg:block transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-[280px]' : 'w-20'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
            {sidebarOpen ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <School className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="font-bold text-base text-white block">E-Pilot Congo</span>
                  <span className="text-xs text-white/60">Super Admin</span>
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mx-auto">
                <School className="w-6 h-6 text-white" />
              </div>
            )}
          </div>

          {/* Navigation - Scrollable */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link key={item.href} to={item.href}>
                    <div
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        active
                          ? 'bg-white/15 text-white shadow-lg shadow-black/10'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      } ${!sidebarOpen && 'justify-center'}`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {sidebarOpen && (
                        <>
                          <span className="text-sm font-medium whitespace-nowrap flex-1">
                            {item.title}
                          </span>
                          {item.badge && (
                            <span className="bg-[#E63946] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                      {item.badge && !sidebarOpen && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-[#E63946] rounded-full" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer - Déconnexion */}
          <div className="p-3 border-t border-white/10">
            {sidebarOpen ? (
              <Button
                variant="ghost"
                className="w-full justify-start text-white/70 hover:text-white hover:bg-[#E63946] transition-colors"
              >
                <LogOut className="w-5 h-5 mr-3" />
                <span className="text-sm font-medium">Déconnexion</span>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="w-full text-white/70 hover:text-white hover:bg-[#E63946] transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar - Sheet */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed left-0 top-0 h-screen w-[280px] bg-[#1D3557] z-50 lg:hidden transform transition-transform duration-300">
            <div className="flex flex-col h-full">
              <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                    <School className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="font-bold text-base text-white block">E-Pilot Congo</span>
                    <span className="text-xs text-white/60">Super Admin</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <nav className="flex-1 overflow-y-auto py-4 px-3">
                <div className="space-y-1">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                            active
                              ? 'bg-white/15 text-white shadow-lg'
                              : 'text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-sm font-medium flex-1">{item.title}</span>
                          {item.badge && (
                            <span className="bg-[#E63946] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </nav>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'lg:ml-[280px]' : 'lg:ml-20'
        }`}
      >
        {/* Header - Fixe avec shadow dynamique */}
        <header
          className={`h-16 bg-white border-b border-gray-200 sticky top-0 z-30 transition-shadow duration-200 ${
            scrolled ? 'shadow-md' : ''
          }`}
        >
          <div className="h-full px-4 lg:px-6 flex items-center justify-between">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              {/* Toggle Sidebar Desktop */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex text-gray-600 hover:text-[#1D3557] hover:bg-gray-100"
                onClick={toggleSidebar}
              >
                <Menu className="w-5 h-5" />
              </Button>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-gray-600 hover:text-[#1D3557] hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>

              {/* Search Input */}
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher écoles, utilisateurs, modules..."
                  className="pl-10 w-64 lg:w-96 border-gray-200 focus:border-[#1D3557] focus:ring-[#1D3557]"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden sm:flex">
                    {theme === 'light' && <Sun className="w-5 h-5" />}
                    {theme === 'dark' && <Moon className="w-5 h-5" />}
                    {theme === 'system' && <Monitor className="w-5 h-5" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme('light')}>
                    <Sun className="w-4 h-4 mr-2" />
                    Clair
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')}>
                    <Moon className="w-4 h-4 mr-2" />
                    Sombre
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('system')}>
                    <Monitor className="w-4 h-4 mr-2" />
                    Système
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#E63946] rounded-full animate-pulse" />
              </Button>

              {/* Messages */}
              <Button variant="ghost" size="icon" className="relative hidden sm:flex">
                <MessageSquare className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#2A9D8F] rounded-full" />
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 hidden lg:flex">
                    <div className="w-8 h-8 rounded-full bg-[#2A9D8F] flex items-center justify-center text-white font-semibold text-sm">
                      SA
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">Super Admin</p>
                      <p className="text-xs text-gray-500">admin@epilot.cg</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Users className="w-4 h-4 mr-2" />
                    Profil
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <FileText className="w-4 h-4 mr-2" />
                    Support
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FileText className="w-4 h-4 mr-2" />
                    Guide d'utilisation
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-[#E63946]">
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile User Avatar */}
              <Button variant="ghost" size="icon" className="lg:hidden">
                <div className="w-8 h-8 rounded-full bg-[#2A9D8F] flex items-center justify-center text-white font-semibold text-sm">
                  SA
                </div>
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6 min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4 px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
            <p>© 2025 E-Pilot Congo • République du Congo 🇨🇬</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-[#1D3557] transition-colors">
                Support technique
              </a>
              <a href="#" className="hover:text-[#1D3557] transition-colors">
                Guide d'utilisation
              </a>
              <a href="#" className="hover:text-[#1D3557] transition-colors">
                Confidentialité
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
