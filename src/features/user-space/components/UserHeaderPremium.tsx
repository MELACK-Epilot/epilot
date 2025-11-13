/**
 * Header MODERNE - React 19 Best Practices
 * Design professionnel avec optimisations avancées
 * Performances, accessibilité et UX optimales
 */

import { memo, useCallback, startTransition, useDeferredValue, useState, useEffect } from 'react';
import { 
  Bell, 
  Menu, 
  Search, 
  Settings, 
  LogOut, 
  User, 
  HelpCircle,
  MessageSquare,
  Sun,
  Moon,
  Mail,
  Command,
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
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import { useNotificationsReal as useNotifications } from '../hooks/useNotificationsReal';

interface UserHeaderPremiumProps {
  onMenuClick: () => void;
}

// Composant moderne avec React 19 optimisations
export const UserHeaderPremium = memo(({ onMenuClick }: UserHeaderPremiumProps) => {
  const { data: user } = useCurrentUser();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Hook notifications moderne
  const { 
    notifications, 
    unreadCount, 
    isLoading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    loadNotifications 
  } = useNotifications();
  
  // useDeferredValue pour optimiser la recherche
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // useCallback pour optimiser les performances
  const handleLogout = useCallback(() => {
    startTransition(() => {
      navigate('/logout');
    });
  }, [navigate]);

  const toggleTheme = useCallback(() => {
    startTransition(() => {
      setTheme(prev => prev === 'light' ? 'dark' : 'light');
      // TODO: Implémenter le changement de thème global
    });
  }, []);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleQuickAction = useCallback((action: string) => {
    startTransition(() => {
      navigate(`/user/${action}`);
    });
  }, [navigate]);

  // Initialisation des notifications au chargement
  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user, loadNotifications]);

  return (
    <header className="h-16 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-30 shadow-sm transition-all duration-300">
      {/* Barre de progression moderne */}
      <div className="absolute top-0 left-0 h-0.5 bg-gradient-to-r from-[#2A9D8F] via-blue-500 to-purple-500 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
        {/* Left: Menu + Search */}
        <div className="flex items-center gap-3 flex-1 max-w-2xl">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden hover:bg-gray-100 rounded-xl"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Search Bar Moderne - Desktop */}
          <div className="hidden md:flex items-center gap-2 flex-1">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#2A9D8F] transition-colors" />
              <Input
                placeholder="Rechercher élèves, classes, modules..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-12 bg-gray-50/80 border-gray-200/50 focus:bg-white focus:border-[#2A9D8F] transition-all rounded-xl hover:bg-gray-100/80"
              />
              {/* Raccourci clavier moderne */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-xs text-gray-400 bg-gray-100 rounded border border-gray-200">
                  <Command className="h-3 w-3" />
                </kbd>
                <kbd className="px-1.5 py-0.5 text-xs text-gray-400 bg-gray-100 rounded border border-gray-200">
                  K
                </kbd>
              </div>
              {/* Indicateur de recherche active */}
              {deferredSearchQuery && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 lg:right-16">
                  <div className="w-2 h-2 bg-[#2A9D8F] rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
          </div>

          {/* Search Icon - Mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-gray-100 rounded-xl"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>

        {/* Right: Actions + User */}
        <div className="flex items-center gap-1.5">
          {/* Actions Essentielles - Minimalistes */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Messages - Action critique avec compteur */}
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-gray-100 rounded-xl relative group"
              onClick={() => handleQuickAction('messages')}
              title="Messages"
            >
              <MessageSquare className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
              <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 bg-blue-500 hover:bg-blue-600 text-white text-xs flex items-center justify-center rounded-full">
                3
              </Badge>
            </Button>

            {/* Thème - Fonctionnalité moderne attendue */}
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-gray-100 rounded-xl"
              onClick={toggleTheme}
              title="Changer le thème"
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5 text-gray-600" />
              ) : (
                <Sun className="h-5 w-5 text-gray-600" />
              )}
            </Button>
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px h-8 bg-gray-200 mx-1"></div>

          {/* Notifications modernes */}
          <DropdownMenu onOpenChange={(open) => open && loadNotifications()}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative hover:bg-gray-100 rounded-xl group"
              >
                <Bell className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 bg-red-500 hover:bg-red-600 text-white text-xs flex items-center justify-center rounded-full animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 rounded-xl shadow-xl border-0 bg-white/95 backdrop-blur-xl">
              {/* Header moderne */}
              <DropdownMenuLabel className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">Notifications</span>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Badge className="bg-red-100 text-red-700 text-xs px-2 py-1">
                      {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
                    </Badge>
                  )}
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-700 h-6 px-2"
                    >
                      Tout lire
                    </Button>
                  )}
                </div>
              </DropdownMenuLabel>

              {/* Liste des notifications */}
              <div className="max-h-80 overflow-y-auto">
                {notificationsLoading ? (
                  <div className="p-4 space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse flex items-start gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : notifications.length > 0 ? (
                  <div className="py-2">
                    {notifications.slice(0, 5).map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className="p-4 cursor-pointer hover:bg-gray-50 border-l-4 border-transparent hover:border-blue-500 transition-all"
                        onClick={() => {
                          markAsRead(notification.id);
                          if (notification.actionUrl) {
                            navigate(notification.actionUrl);
                          }
                        }}
                      >
                        <div className="flex items-start gap-3 w-full">
                          {/* Icône par type */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            notification.type === 'success' ? 'bg-green-100' :
                            notification.type === 'warning' ? 'bg-yellow-100' :
                            notification.type === 'error' ? 'bg-red-100' :
                            'bg-blue-100'
                          }`}>
                            {notification.type === 'success' && <span className="text-green-600">✓</span>}
                            {notification.type === 'warning' && <span className="text-yellow-600">⚠</span>}
                            {notification.type === 'error' && <span className="text-red-600">✕</span>}
                            {notification.type === 'info' && <Bell className="h-4 w-4 text-blue-600" />}
                          </div>
                          
                          {/* Contenu */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className={`text-sm font-medium ${notification.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                                {notification.title}
                              </h4>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {notification.timestamp.toLocaleString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-sm text-gray-500">
                    <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium">Aucune notification</p>
                    <p className="text-xs mt-1">Vous êtes à jour !</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 5 && (
                <div className="p-3 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/user/notifications')}
                    className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    Voir toutes les notifications ({notifications.length})
                  </Button>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="hidden sm:flex items-center gap-3 pl-3 pr-2 hover:bg-gray-100 rounded-xl h-10"
                >
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 leading-tight">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 capitalize leading-tight">
                      {user.role.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2A9D8F] to-[#1D3557] flex items-center justify-center text-white text-sm font-semibold shadow-md">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-xl">
                <DropdownMenuLabel>
                  <div className="flex items-center gap-3 py-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2A9D8F] to-[#1D3557] flex items-center justify-center text-white font-semibold shadow-lg">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/user/profile')} className="rounded-lg">
                  <User className="mr-2 h-4 w-4" />
                  Mon profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/user/messages')} className="rounded-lg">
                  <Mail className="mr-2 h-4 w-4" />
                  Messages
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/user/settings')} className="rounded-lg">
                  <Settings className="mr-2 h-4 w-4" />
                  Paramètres
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/user/help')} className="rounded-lg">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Aide & Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 rounded-lg"
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
              className="sm:hidden rounded-xl"
              onClick={() => navigate('/user/profile')}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2A9D8F] to-[#1D3557] flex items-center justify-center text-white text-sm font-semibold shadow-md">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
});
