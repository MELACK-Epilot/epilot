/**
 * Sidebar moderne - React 19 Best Practices
 * Navigation avec Context API optimisé
 */

import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigation } from '../contexts/NavigationContext';
import { memo, useCallback, startTransition } from 'react';

interface UserSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

// Composant moderne avec React 19
export const UserSidebar = memo(({ isOpen, onToggle }: UserSidebarProps) => {
  const navigate = useNavigate();
  const { groups: navigationGroups, isLoading } = useNavigation();

  // Logout avec startTransition pour les meilleures performances
  const handleLogout = useCallback(() => {
    startTransition(() => {
      navigate('/logout');
    });
  }, [navigate]);

  // Pas d'état de chargement visible - évite le flash de sidebar
  if (isLoading) {
    return null;
  }

  return (
    <>
      {/* Sidebar Desktop professionnelle sans animations agressives */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-[#2A9D8F] to-[#1D3557] shadow-2xl z-40 hidden lg:block transition-all duration-300 ease-in-out ${
          isOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Toggle simplifié */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
            {isOpen ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#2A9D8F] font-bold shadow-lg">
                  EP
                </div>
                <span className="font-bold text-xl text-white">E-Pilot</span>
              </div>
            ) : (
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#2A9D8F] font-bold shadow-lg">
                EP
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="hover:bg-white/10 text-white"
            >
              {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </Button>
          </div>


          {/* Navigation organisée par groupes */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="px-2 space-y-6">
              {navigationGroups.map((group, groupIndex) => (
                <div key={group.label}>
                  {/* Titre du groupe (seulement si sidebar ouverte) */}
                  {isOpen && (
                    <div className="px-3 mb-2">
                      <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                        {group.label}
                      </h3>
                    </div>
                  )}
                  
                  {/* Items du groupe */}
                  <ul className="space-y-1">
                    {group.items.map((item: any) => (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          end={item.to === '/user'}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                              isActive
                                ? 'bg-white text-[#2A9D8F] shadow-md font-medium'
                                : 'text-white/80 hover:bg-white/10 hover:text-white'
                            }`
                          }
                        >
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          {isOpen && (
                            <span className="text-sm font-medium truncate">
                              {item.label}
                            </span>
                          )}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                  
                  {/* Séparateur entre groupes (sauf le dernier) */}
                  {groupIndex < navigationGroups.length - 1 && isOpen && (
                    <div className="mx-3 mt-4 border-t border-white/10"></div>
                  )}
                </div>
              ))}
            </div>
          </nav>

          {/* Logout simplifié */}
          <div className="p-4 border-t border-white/10">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start gap-3 px-3 py-2.5 text-white/80 hover:bg-red-500/20 hover:text-white transition-all duration-200"
            >
              <LogOut className="h-5 w-5" />
              {isOpen && (
                <span className="text-sm font-medium">
                  Déconnexion
                </span>
              )}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
});
