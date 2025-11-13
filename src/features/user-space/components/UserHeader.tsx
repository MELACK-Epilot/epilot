/**
 * Header pour l'espace utilisateur
 */

import { Bell, Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCurrentUser } from '../hooks/useCurrentUser';

interface UserHeaderProps {
  onMenuClick: () => void;
}

export const UserHeader = ({ onMenuClick }: UserHeaderProps) => {
  const { data: user } = useCurrentUser();

  return (
    <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between">
        {/* Left: Menu + Search */}
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                className="pl-10 bg-gray-50 border-gray-200"
              />
            </div>
          </div>
        </div>

        {/* Right: Notifications + User */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>

          {/* User Info */}
          {user && (
            <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user.role.replace('_', ' ')}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2A9D8F] to-[#1D3557] flex items-center justify-center text-white font-semibold">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
