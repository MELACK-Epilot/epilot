/**
 * Navigation Context - React 19 Best Practices
 * Utilise les dernières fonctionnalités : use(), startTransition, etc.
 */

import React, { createContext, useContext, useCallback, useMemo, startTransition } from 'react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import {
  LayoutDashboard,
  User,
  Calendar,
  Users,
  BookOpen,
  ClipboardList,
  Bell,
  Settings,
  MessageSquare,
  Building2,
  GraduationCap,
  DollarSign,
  Activity,
} from 'lucide-react';

// Types modernes avec const assertions
export interface NavigationItem {
  readonly to: string;
  readonly icon: typeof LayoutDashboard;
  readonly label: string;
  readonly badge?: string | number;
}

export interface NavigationGroup {
  readonly label: string;
  readonly items: readonly NavigationItem[];
}

interface NavigationContextValue {
  readonly groups: readonly NavigationGroup[];
  readonly isLoading: boolean;
  readonly refreshNavigation: () => void;
}

// Context avec valeur par défaut typée
const NavigationContext = createContext<NavigationContextValue | null>(null);

// Hook personnalisé avec useContext standard (plus stable)
export function useNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}

// Provider moderne avec optimisations React 19
export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const { data: user } = useCurrentUser();

  // Fonction de rafraîchissement avec startTransition
  const refreshNavigation = useCallback(() => {
    startTransition(() => {
      // Logique de rafraîchissement si nécessaire
      window.location.reload();
    });
  }, []);

  // Navigation groups avec useMemo optimisé - pas d'attente utilisateur
  const groups = useMemo((): readonly NavigationGroup[] => {
    // Retourne une navigation de base même sans utilisateur pour éviter le flash
    if (!user) {
      return [
        {
          label: 'Principal',
          items: [
            { to: '/user', icon: LayoutDashboard, label: 'Tableau de bord' },
          ]
        }
      ];
    }

    const baseGroups: NavigationGroup[] = [
      {
        label: 'Principal',
        items: [
          { to: '/user', icon: LayoutDashboard, label: 'Tableau de bord' },
        ]
      },
      {
        label: 'Gestion',
        items: [
          { to: '/user/modules', icon: BookOpen, label: 'Mes Modules' },
        ]
      },
      {
        label: 'Communication',
        items: [
          { to: '/user/messages', icon: MessageSquare, label: 'Messagerie' },
          { to: '/user/notifications', icon: Bell, label: 'Notifications' },
        ]
      },
      {
        label: 'Personnel',
        items: [
          { to: '/user/profile', icon: User, label: 'Mon Profil' },
          { to: '/user/schedule', icon: Calendar, label: 'Planning' },
        ]
      }
    ];

    // Ajout conditionnel selon le rôle avec pattern matching moderne
    const roleSpecificItems = getRoleSpecificItems(user.role);
    if (roleSpecificItems.length > 0) {
      // Fusion immutable des items de gestion
      baseGroups[1] = {
        ...baseGroups[1],
        items: [...baseGroups[1].items, ...roleSpecificItems]
      };
    }

    // Ajout du groupe Système
    baseGroups.push({
      label: 'Système',
      items: [
        { to: '/user/settings', icon: Settings, label: 'Paramètres' },
      ]
    });

    return baseGroups.filter(group => group.items.length > 0);
  }, [user]);

  // Valeur du contexte avec Object.freeze pour immutabilité
  const contextValue = useMemo((): NavigationContextValue => 
    Object.freeze({
      groups,
      isLoading: false, // Pas de blocage d'affichage - navigation toujours disponible
      refreshNavigation,
    }), [groups, refreshNavigation]);

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
}

// Fonction pure pour les items spécifiques au rôle
function getRoleSpecificItems(role?: string): readonly NavigationItem[] {
  if (!role) return [];

  const roleMap = {
    // Direction
    proviseur: [
      { to: '/user/staff', icon: Users, label: 'Personnel' },
      { to: '/user/reports', icon: ClipboardList, label: 'Rapports' },
      { to: '/user/activity-logs', icon: Activity, label: 'Journal d\'Activité' },
      { to: '/user/school-group', icon: Building2, label: 'Établissement' },
    ],
    directeur: [
      { to: '/user/staff', icon: Users, label: 'Personnel' },
      { to: '/user/reports', icon: ClipboardList, label: 'Rapports' },
      { to: '/user/activity-logs', icon: Activity, label: 'Journal d\'Activité' },
      { to: '/user/school-group', icon: Building2, label: 'Établissement' },
    ],
    directeur_etudes: [
      { to: '/user/staff', icon: Users, label: 'Personnel' },
      { to: '/user/reports', icon: ClipboardList, label: 'Rapports' },
      { to: '/user/activity-logs', icon: Activity, label: 'Journal d\'Activité' },
      { to: '/user/school-group', icon: Building2, label: 'Établissement' },
    ],
    
    // Enseignant
    enseignant: [
      { to: '/user/classes', icon: BookOpen, label: 'Mes Classes' },
      { to: '/user/students', icon: Users, label: 'Mes Élèves' },
      { to: '/user/grades', icon: GraduationCap, label: 'Notes' },
    ],
    
    // CPE
    cpe: [
      { to: '/user/students', icon: Users, label: 'Élèves' },
      { to: '/user/discipline', icon: ClipboardList, label: 'Discipline' },
    ],
    
    // Comptable
    comptable: [
      { to: '/user/payments', icon: DollarSign, label: 'Paiements' },
      { to: '/user/reports', icon: ClipboardList, label: 'Rapports' },
    ],
    
    // Élève
    eleve: [
      { to: '/user/courses', icon: BookOpen, label: 'Mes Cours' },
      { to: '/user/grades', icon: GraduationCap, label: 'Mes Notes' },
    ],
    
    // Parent
    parent: [
      { to: '/user/children', icon: Users, label: 'Mes Enfants' },
      { to: '/user/grades', icon: GraduationCap, label: 'Notes' },
    ],
  } as const;

  return roleMap[role as keyof typeof roleMap] || [];
}
