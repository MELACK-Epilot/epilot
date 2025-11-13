/**
 * Hook personnalisé pour gérer l'état de la Sidebar
 * Optimisé pour React 19 avec persistance localStorage
 * @module useSidebar
 */

import { useState, useEffect, useCallback } from 'react';

const SIDEBAR_STORAGE_KEY = 'e-pilot-sidebar-open';
const MOBILE_BREAKPOINT = 1024; // lg breakpoint

interface UseSidebarReturn {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  isMobile: boolean;
}

export const useSidebar = (): UseSidebarReturn => {
  // Initialiser depuis localStorage
  const [sidebarOpen, setSidebarOpenState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Détecter si mobile
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  // Persister dans localStorage
  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // Détecter resize pour mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Toggle avec useCallback pour optimisation
  const toggleSidebar = useCallback(() => {
    setSidebarOpenState(prev => !prev);
  }, []);

  // Setter avec useCallback
  const setSidebarOpen = useCallback((open: boolean) => {
    setSidebarOpenState(open);
  }, []);

  return {
    sidebarOpen,
    toggleSidebar,
    setSidebarOpen,
    isMobile,
  };
};
