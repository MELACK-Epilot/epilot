/**
 * ChefHeader - Header pour le Chef d'Établissement
 * Barre de navigation supérieure avec recherche et notifications
 * 
 * @module ChefEtablissement/Components
 */

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Search,
  Bell,
  User,
  ChevronDown,
  LogOut,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { ChefInfo, SchoolInfo, SchoolAlert } from '../../../types/chef-etablissement.types';
import { CHEF_ROLE_LABELS } from '../../../types/chef-etablissement.types';

interface ChefHeaderProps {
  readonly chef: ChefInfo;
  readonly school: SchoolInfo;
  readonly alerts: SchoolAlert[];
  readonly onMenuClick: () => void;
  readonly onSearch?: (query: string) => void;
  readonly onLogout: () => void;
}

/**
 * Header Chef d'Établissement
 */
export const ChefHeader = memo<ChefHeaderProps>(({
  chef,
  school,
  alerts,
  onMenuClick,
  onSearch,
  onLogout,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const unreadAlerts = alerts.filter(a => !a.isRead).length;
  const roleLabel = CHEF_ROLE_LABELS[chef.role] || 'Chef d\'Établissement';

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  }, [searchQuery, onSearch]);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left: Menu + Search */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Search */}
          <div className="hidden md:block">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 bg-gray-50 border-gray-200 focus:bg-white"
              />
            </form>
          </div>

          {/* Mobile search toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch(!showSearch)}
            className="md:hidden"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>

        {/* Right: Notifications + Profile */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadAlerts > 9 ? '9+' : unreadAlerts}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {unreadAlerts > 0 && (
                  <Badge variant="secondary" className="bg-red-100 text-red-700">
                    {unreadAlerts} nouvelle{unreadAlerts > 1 ? 's' : ''}
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {alerts.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Aucune notification</p>
                </div>
              ) : (
                <>
                  {alerts.slice(0, 5).map((alert) => (
                    <DropdownMenuItem
                      key={alert.id}
                      className={cn(
                        "flex flex-col items-start gap-1 p-3 cursor-pointer",
                        !alert.isRead && "bg-blue-50"
                      )}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span className={cn(
                          "w-2 h-2 rounded-full flex-shrink-0",
                          alert.severity === 'critical' && "bg-red-500",
                          alert.severity === 'warning' && "bg-amber-500",
                          alert.severity === 'info' && "bg-blue-500"
                        )} />
                        <span className="font-medium text-sm flex-1 truncate">
                          {alert.title}
                        </span>
                        {alert.count && (
                          <Badge variant="secondary" className="text-xs">
                            {alert.count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1 pl-4">
                        {alert.message}
                      </p>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="justify-center text-[#2A9D8F] font-medium">
                    Voir toutes les notifications
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1D3557] to-[#2A9D8F] flex items-center justify-center text-white font-medium text-sm">
                  {chef.firstName.charAt(0)}{chef.lastName.charAt(0)}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {chef.firstName} {chef.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{roleLabel}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400 hidden md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">{chef.firstName} {chef.lastName}</p>
                  <p className="text-xs text-gray-500">{chef.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="h-4 w-4 mr-2" />
                Mon Profil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="h-4 w-4 mr-2" />
                Aide
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onLogout}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile search bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-gray-100 overflow-hidden"
          >
            <form onSubmit={handleSearch} className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10"
                  autoFocus
                />
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
});

ChefHeader.displayName = 'ChefHeader';

export default ChefHeader;
