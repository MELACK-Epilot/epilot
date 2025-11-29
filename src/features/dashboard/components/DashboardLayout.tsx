/**
 * Layout principal du Dashboard Super Admin - VERSION ULTRA-OPTIMISÉE
 * ✅ Pas de glassmorphism (performance maximale)
 * ✅ Header fixe avec shadow au scroll
 * ✅ Sidebar avec thème dédié
 * ✅ Transitions CSS natives uniquement
 * @module DashboardLayout
 */

import { useState, useEffect, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  School,
  Users,
  Briefcase,
  MessageSquare,
  FileText,
  Activity,
  Trash2,
  Menu,
  X,
  Search,
  Settings,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Layers,
  TestTube2,
  TrendingUp,
  Package,
  DollarSign,
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
import { useAuth } from '@/features/auth/store/auth.store';
import { NotificationsDropdown } from './NotificationsDropdown';
import { UserProfileDialog } from './users/UserProfileDialog';

/**
 * Navigation items avec rôles
 */
const allNavigationItems = [
  {
    title: 'Tableau de bord',
    icon: LayoutDashboard,
    href: '/dashboard',
    badge: null,
    roles: ['super_admin', 'admin_groupe', 'group_admin'], // Admins uniquement
  },
  {
    title: 'Groupes Scolaires',
    icon: Building2,
    href: '/dashboard/school-groups',
    badge: null,
    roles: ['super_admin'], // ✅ Super Admin uniquement
  },
  {
    title: 'Écoles',
    icon: School,
    href: '/dashboard/schools',
    badge: null,
    roles: ['admin_groupe', 'group_admin'], // ✅ Admin Groupe uniquement
  },
  {
    title: 'Finances',
    icon: DollarSign,
    href: '/dashboard/finances-groupe',
    badge: null,
    roles: ['admin_groupe', 'group_admin'], // ✅ Admin Groupe uniquement
  },
  {
    title: 'Mes Modules',
    icon: Package,
    href: '/dashboard/my-modules',
    badge: null,
    roles: ['admin_groupe', 'group_admin'], // ✅ Admin Groupe uniquement
  },
  {
    title: 'Utilisateurs',
    icon: Users,
    href: '/dashboard/users',
    badge: null,
    roles: ['super_admin', 'admin_groupe', 'group_admin'], // ✅ Super Admin et Admin Groupe
  },
  {
    title: 'Assigner Modules',
    icon: Settings,
    href: '/dashboard/assign-modules',
    badge: null,
    roles: ['admin_groupe', 'group_admin'], // ✅ Admin Groupe uniquement (Ancien)
  },
  {
    title: 'Permissions & Modules',
    icon: Settings,
    href: '/dashboard/permissions-modules',
    badge: null,
    roles: ['admin_groupe', 'group_admin'], // ✅ Admin Groupe uniquement (Nouveau - Page dédiée)
  },
  {
    title: 'Catégories Métiers',
    icon: Briefcase,
    href: '/dashboard/categories',
    badge: null,
    roles: ['super_admin'], // ✅ Super Admin uniquement (gestion plateforme)
  },
  {
    title: 'Modules Pédagogiques',
    icon: Layers,
    href: '/dashboard/modules',
    badge: null,
    roles: ['super_admin'], // ✅ Super Admin uniquement (gestion plateforme)
  },
  {
    title: 'Environnement Sandbox',
    icon: TestTube2,
    href: '/dashboard/sandbox',
    badge: null,
    roles: ['super_admin'], // ✅ Super Admin uniquement (développement)
  },
  {
    title: 'Finances',
    icon: TrendingUp,
    href: '/dashboard/finances',
    badge: null,
    roles: ['super_admin'], // ✅ Super Admin uniquement (pas pour Admin Groupe)
  },
  {
    title: 'Communication',
    icon: MessageSquare,
    href: '/dashboard/communication',
    badge: null,
    roles: ['super_admin', 'admin_groupe', 'group_admin'], // ✅ Admins uniquement
  },
  {
    title: 'Rapports',
    icon: FileText,
    href: '/dashboard/reports',
    badge: null,
    roles: ['super_admin', 'admin_groupe', 'group_admin'], // ✅ Admins uniquement (rapports filtrés par rôle)
  },
  {
    title: 'Journal d\'Activité',
    icon: Activity,
    href: '/dashboard/activity-logs',
    badge: null,
    roles: ['super_admin', 'admin_groupe', 'group_admin'], // ✅ Super Admin et Admin Groupe
  },
  {
    title: 'Corbeille',
    icon: Trash2,
    href: '/dashboard/trash',
    badge: null,
    roles: ['super_admin', 'admin_groupe', 'group_admin'], // ✅ Admins uniquement
  },
];

/**
 * Composant Layout principal - OPTIMISÉ
 */
export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebar-open');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  // Filtrer les items de navigation selon le rôle (avec memoization)
  const navigationItems = useMemo(
    () => allNavigationItems.filter(item => 
      !item.roles || item.roles.includes(user?.role || '')
    ),
    [user?.role]
  );

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

  // Handler de déconnexion - Rediriger vers /logout pour éviter le clignotement
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

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      {/* Sidebar Desktop - Thème bleu institutionnel */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-[#1D3557] border-r border-[#1D3557]/20 z-40 hidden lg:block transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-[280px]' : 'w-20'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
            {sidebarOpen ? (
              <div className="flex items-center gap-3 transition-all duration-300">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center p-2 transition-transform hover:scale-105">
                  <img 
                    src="/images/logo/logo.svg" 
                    alt="E-Pilot Logo" 
                    className="w-full h-full object-contain"
                    loading="eager"
                  />
                </div>
                <div className="overflow-hidden">
                  <span className="font-bold text-base text-white block transition-opacity duration-300">
                    E-Pilot Congo
                  </span>
                  <span className="text-xs text-white/60 transition-opacity duration-300">
                    {getRoleLabel(user?.role)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mx-auto p-2 transition-transform hover:scale-105">
                <img 
                  src="/images/logo/logo.svg" 
                  alt="E-Pilot Logo" 
                  className="w-full h-full object-contain"
                  loading="eager"
                />
              </div>
            )}
          </div>

          {/* Navigation - Scrollable */}
          <nav 
            className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
            aria-label="Navigation principale"
          >
            <div className="space-y-1">
              {navigationItems.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link 
                    key={item.href} 
                    to={item.href}
                    className="block"
                    aria-current={active ? 'page' : undefined}
                  >
                    <div
                      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        active
                          ? 'bg-[#2A9D8F] text-white shadow-lg shadow-[#2A9D8F]/20 font-medium'
                          : 'text-white/70 hover:bg-white/10 hover:text-white hover:translate-x-1'
                      } ${!sidebarOpen && 'justify-center'}`}
                      style={{
                        transitionDelay: `${index * 20}ms`
                      }}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${active ? 'scale-110' : ''}`} />
                      {sidebarOpen && (
                        <>
                          <span className="text-sm whitespace-nowrap flex-1 transition-opacity duration-200">
                            {item.title}
                          </span>
                          {item.badge && (
                            <span className="bg-[#E9C46A] text-[#1D3557] text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                      {item.badge && !sidebarOpen && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#E9C46A] rounded-full border-2 border-[#1D3557]" />
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
                className="w-full justify-start text-white/70 hover:text-white hover:bg-[#E63946] transition-all duration-200 hover:translate-x-1"
                aria-label="Se déconnecter"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 mr-3 transition-transform duration-200" />
                <span className="text-sm font-medium">Déconnexion</span>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="w-full text-white/70 hover:text-white hover:bg-[#E63946] transition-all duration-200 hover:scale-110"
                aria-label="Se déconnecter"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar - Sheet avec thème bleu */}
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
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center p-2">
                    <img 
                      src="/images/logo/logo.svg" 
                      alt="E-Pilot Logo" 
                      className="w-full h-full object-contain"
                      loading="eager"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-base text-white block">E-Pilot Congo</span>
                    <span className="text-xs text-white/60">{getRoleLabel(user?.role)}</span>
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
        className={`transition-all duration-200 ${
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
              {/* Theme Toggle - Icône Soleil */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-600 hover:text-[#1D3557] hover:bg-gray-100 transition-colors"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                title="Changer le thème"
                aria-label="Changer le thème"
              >
                {theme === 'light' && <Sun className="w-5 h-5" />}
                {theme === 'dark' && <Moon className="w-5 h-5" />}
                {theme === 'system' && <Sun className="w-5 h-5" />}
              </Button>

              {/* Notifications - Système d'alertes temps réel */}
              <NotificationsDropdown />

              {/* Messages - Communication uniquement */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="relative text-gray-600 hover:text-[#1D3557] hover:bg-gray-100 transition-colors"
                    title="Messages"
                    aria-label="1 message non lu"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#E63946] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg">
                      1
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="font-semibold text-base">
                    Messages
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Message 1 */}
                  <DropdownMenuItem className="py-3 cursor-pointer">
                    <div className="flex items-start gap-3 w-full">
                      <div className="w-8 h-8 rounded-full bg-[#2A9D8F] flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                        JD
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          Jean Dupont
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          Bonjour, j'ai une question concernant...
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Il y a 10 min</p>
                      </div>
                      <span className="w-2 h-2 bg-[#E63946] rounded-full flex-shrink-0 mt-1" />
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="justify-center text-[#1D3557] font-medium">
                    Voir tous les messages
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 hidden lg:flex">
                    <div className="w-8 h-8 rounded-full bg-[#2A9D8F] flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                      {user?.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={`${user.firstName} ${user.lastName}`} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getInitials()
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsProfileDialogOpen(true)}>
                    <Users className="w-4 h-4 mr-2" />
                    Mon Profil Personnel
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
                  <DropdownMenuItem className="text-[#E63946]" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile User Avatar */}
              <Button variant="ghost" size="icon" className="lg:hidden">
                <div className="w-8 h-8 rounded-full bg-[#2A9D8F] flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={`${user.firstName} ${user.lastName}`} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials()
                  )}
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

      {/* Modal Profil Personnel */}
      <UserProfileDialog
        open={isProfileDialogOpen}
        onOpenChange={setIsProfileDialogOpen}
      />
    </div>
  );
};

export default DashboardLayout;
