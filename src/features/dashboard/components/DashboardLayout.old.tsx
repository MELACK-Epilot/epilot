/**
 * Layout principal du Dashboard Super Admin
 * React 19 + Suspense + Code Splitting
 * @module DashboardLayout
 */

import { useState, Suspense } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
    title: 'Journal d\'Activité',
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
 * Skeleton loader pour le contenu
 */
const ContentSkeleton = () => (
  <div className="space-y-4 p-6">
    <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
      ))}
    </div>
    <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
  </div>
);

/**
 * Composant Layout principal
 */
export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-40 hidden lg:block"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
            <AnimatePresence mode="wait">
              {sidebarOpen ? (
                <motion.div
                  key="logo-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <img src="/images/logo/logo.svg" alt="E-Pilot" className="w-8 h-8" />
                  <span className="font-bold text-lg text-[#1D3557]">E-Pilot</span>
                </motion.div>
              ) : (
                <motion.img
                  key="logo-mini"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  src="/images/logo/logo.svg"
                  alt="E-Pilot"
                  className="w-8 h-8"
                />
              )}
            </AnimatePresence>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-2">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link key={item.href} to={item.href}>
                    <motion.div
                      whileHover={{ x: 4 }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative ${
                        active
                          ? 'bg-[#1D3557] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <AnimatePresence mode="wait">
                        {sidebarOpen && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="text-sm font-medium whitespace-nowrap"
                          >
                            {item.title}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {item.badge && sidebarOpen && (
                        <span className="ml-auto bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${!sidebarOpen && 'justify-center'}`}
                >
                  <div className="w-8 h-8 rounded-full bg-[#2A9D8F] flex items-center justify-center text-white font-semibold flex-shrink-0">
                    SA
                  </div>
                  {sidebarOpen && (
                    <>
                      <div className="ml-3 text-left flex-1">
                        <p className="text-sm font-medium text-gray-900">Super Admin</p>
                        <p className="text-xs text-gray-500">admin@epilot.cg</p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Paramètres
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed left-0 top-0 h-screen w-72 bg-white z-50 lg:hidden"
            >
              <div className="flex flex-col h-full">
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <img src="/images/logo/logo.svg" alt="E-Pilot" className="w-8 h-8" />
                    <span className="font-bold text-lg text-[#1D3557]">E-Pilot</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <nav className="flex-1 overflow-y-auto py-4 px-2">
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
                                ? 'bg-[#1D3557] text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-sm font-medium">{item.title}</span>
                            {item.badge && (
                              <span className="ml-auto bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
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
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-[280px]' : 'lg:ml-20'
        }`}
      >
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="h-full px-4 lg:px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  className="pl-10 w-64 lg:w-96"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          <Suspense fallback={<ContentSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
