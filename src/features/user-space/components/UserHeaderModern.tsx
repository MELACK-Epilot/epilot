/**
 * Header MODERNE pour l'espace utilisateur
 * Design premium avec glassmorphism
 * React 19 Best Practices
 */

import { Bell, Menu, Search, Settings, LogOut, User, Calendar, HelpCircle } from 'lucide-react';
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
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface UserHeaderProps {
  onMenuClick: () => void;
}

export const UserHeaderModern = ({ onMenuClick }: UserHeaderProps) => {
  const { data: user } = useCurrentUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/logout');
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-16 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-30 shadow-sm"
    >
      <div className="h-full px-4 lg:px-6 flex items-center justify-between">
        {/* Left: Menu + Search */}
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher élèves, classes, modules..."
                className="pl-10 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Search Icon - Mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-gray-100"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>

        {/* Right: Actions + User */}
        <div className="flex items-center gap-2">
          {/* Quick Actions */}
          <div className="hidden lg:flex items-center gap-1 mr-2">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-gray-100"
              onClick={() => navigate('/user/schedule')}
            >
              <Calendar className="h-5 w-5 text-gray-600" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-gray-100"
            >
              <HelpCircle className="h-5 w-5 text-gray-600" />
            </Button>
          </div>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative hover:bg-gray-100">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                <Badge variant="secondary" className="bg-red-100 text-red-700">
                  3 nouvelles
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-4 text-center text-sm text-gray-500">
                Aucune notification récente
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="hidden sm:flex items-center gap-3 pl-3 hover:bg-gray-100 rounded-xl"
                >
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user.role.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2A9D8F] to-[#1D3557] flex items-center justify-center text-white font-semibold shadow-lg">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/user/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Mon profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/user/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Paramètres
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Mobile User Avatar */}
          {user && (
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              onClick={() => navigate('/user/profile')}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2A9D8F] to-[#1D3557] flex items-center justify-center text-white text-xs font-semibold">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  );
};
