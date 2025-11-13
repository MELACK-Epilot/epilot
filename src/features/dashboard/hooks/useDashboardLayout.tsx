/**
 * Hook et contexte pour gérer le layout des widgets
 * Persiste dans localStorage avec debounce
 * @module useDashboardLayout
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { WidgetLayoutItem, WidgetId } from '../types/widget.types';

const STORAGE_KEY = 'e-pilot-dashboard-layout';
const DEBOUNCE_DELAY = 500;

// Layout par défaut
const DEFAULT_LAYOUT: WidgetLayoutItem[] = [
  { id: 'system-alerts', cols: 12, rows: 1, order: 0, enabled: true },
  { id: 'financial-overview', cols: 8, rows: 2, order: 1, enabled: true },
  { id: 'module-status', cols: 4, rows: 2, order: 2, enabled: true },
  { id: 'realtime-activity', cols: 12, rows: 2, order: 3, enabled: true },
];

interface DashboardLayoutContextValue {
  layout: WidgetLayoutItem[];
  updateLayout: (newLayout: WidgetLayoutItem[]) => void;
  toggleWidget: (widgetId: WidgetId) => void;
  resetLayout: () => void;
  isLoading: boolean;
}

const DashboardLayoutContext = createContext<DashboardLayoutContextValue | undefined>(undefined);

export const DashboardLayoutProvider = ({ children }: { children: ReactNode }) => {
  const [layout, setLayout] = useState<WidgetLayoutItem[]>(DEFAULT_LAYOUT);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<number | null>(null);

  // Charger le layout depuis localStorage au montage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedLayout = JSON.parse(saved) as WidgetLayoutItem[];
        setLayout(parsedLayout);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du layout:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Nettoyer le timeout au démontage
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Sauvegarder dans localStorage avec debounce
  const saveToStorage = useCallback((newLayout: WidgetLayoutItem[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newLayout));
      } catch (error) {
        console.error('Erreur lors de la sauvegarde du layout:', error);
      }
    }, DEBOUNCE_DELAY);
  }, []);

  const updateLayout = useCallback((newLayout: WidgetLayoutItem[]) => {
    setLayout(newLayout);
    saveToStorage(newLayout);
  }, [saveToStorage]);

  const toggleWidget = useCallback((widgetId: WidgetId) => {
    setLayout(prev => {
      const newLayout = prev.map(item =>
        item.id === widgetId ? { ...item, enabled: !item.enabled } : item
      );
      saveToStorage(newLayout);
      return newLayout;
    });
  }, [saveToStorage]);

  const resetLayout = useCallback(() => {
    setLayout(DEFAULT_LAYOUT);
    saveToStorage(DEFAULT_LAYOUT);
  }, [saveToStorage]);

  return (
    <DashboardLayoutContext.Provider
      value={{ layout, updateLayout, toggleWidget, resetLayout, isLoading }}
    >
      {children}
    </DashboardLayoutContext.Provider>
  );
};

export const useDashboardLayout = () => {
  const context = useContext(DashboardLayoutContext);
  if (!context) {
    throw new Error('useDashboardLayout doit être utilisé dans DashboardLayoutProvider');
  }
  return context;
};
