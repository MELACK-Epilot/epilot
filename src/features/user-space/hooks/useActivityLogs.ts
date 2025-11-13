/**
 * Hook pour la gestion des logs d'activité - Traçabilité complète
 * Système d'audit pour proviseurs/directeurs
 */

import { useState, useCallback, useMemo, startTransition } from 'react';

// Types pour les logs d'activité
export interface ActivityLog {
  readonly id: string;
  readonly timestamp: Date;
  readonly userId: string;
  readonly userName: string;
  readonly userRole: string;
  readonly action: ActivityAction;
  readonly target: string;
  readonly targetType: 'student' | 'teacher' | 'class' | 'grade' | 'payment' | 'document' | 'system';
  readonly details: string;
  readonly ipAddress?: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly module: string;
}

export type ActivityAction = 
  | 'create' | 'update' | 'delete' | 'view' | 'export' 
  | 'login' | 'logout' | 'password_change' | 'permission_change'
  | 'grade_entry' | 'grade_modification' | 'payment_received' 
  | 'document_upload' | 'report_generated' | 'backup_created';

interface ActivityLogsState {
  readonly logs: readonly ActivityLog[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly filters: ActivityFilters;
  readonly totalCount: number;
}

interface ActivityFilters {
  readonly dateRange: { start: Date | null; end: Date | null };
  readonly userId: string | null;
  readonly action: ActivityAction | null;
  readonly targetType: ActivityLog['targetType'] | null;
  readonly severity: ActivityLog['severity'] | null;
  readonly module: string | null;
}

// Hook principal avec optimisations React 19
export function useActivityLogs() {
  const [state, setState] = useState<ActivityLogsState>({
    logs: [],
    isLoading: false,
    error: null,
    filters: {
      dateRange: { start: null, end: null },
      userId: null,
      action: null,
      targetType: null,
      severity: null,
      module: null,
    },
    totalCount: 0,
  });

  // Données simulées pour démonstration
  const mockLogs: readonly ActivityLog[] = useMemo(() => [
    {
      id: 'log-001',
      timestamp: new Date('2024-11-12T14:30:00'),
      userId: 'user-123',
      userName: 'Marie Dubois',
      userRole: 'enseignant',
      action: 'grade_entry',
      target: 'Mathématiques - 6ème A',
      targetType: 'grade',
      details: 'Saisie de 25 notes pour le contrôle de géométrie',
      ipAddress: '192.168.1.15',
      severity: 'medium',
      module: 'Notes',
    },
    {
      id: 'log-002',
      timestamp: new Date('2024-11-12T13:45:00'),
      userId: 'user-456',
      userName: 'Jean Martin',
      userRole: 'cpe',
      action: 'create',
      target: 'Rapport disciplinaire - Pierre Durand',
      targetType: 'document',
      details: 'Création d\'un rapport pour absence injustifiée',
      ipAddress: '192.168.1.22',
      severity: 'high',
      module: 'Discipline',
    },
    {
      id: 'log-003',
      timestamp: new Date('2024-11-12T12:20:00'),
      userId: 'user-789',
      userName: 'Sophie Lambert',
      userRole: 'comptable',
      action: 'payment_received',
      target: 'Frais scolaires - Élève #1234',
      targetType: 'payment',
      details: 'Paiement de 150€ pour frais de scolarité',
      ipAddress: '192.168.1.8',
      severity: 'medium',
      module: 'Comptabilité',
    },
    {
      id: 'log-004',
      timestamp: new Date('2024-11-12T11:15:00'),
      userId: 'user-101',
      userName: 'Admin Système',
      userRole: 'admin',
      action: 'permission_change',
      target: 'Permissions utilisateur - Marie Dubois',
      targetType: 'system',
      details: 'Ajout des droits d\'export pour les notes',
      ipAddress: '192.168.1.1',
      severity: 'critical',
      module: 'Administration',
    },
    {
      id: 'log-005',
      timestamp: new Date('2024-11-12T10:30:00'),
      userId: 'user-202',
      userName: 'Paul Moreau',
      userRole: 'enseignant',
      action: 'document_upload',
      target: 'Cours de Physique - Chapitre 3',
      targetType: 'document',
      details: 'Upload du support de cours PDF (2.3 MB)',
      ipAddress: '192.168.1.45',
      severity: 'low',
      module: 'Ressources',
    },
    {
      id: 'log-006',
      timestamp: new Date('2024-11-12T09:45:00'),
      userId: 'user-303',
      userName: 'Directeur Général',
      userRole: 'directeur',
      action: 'report_generated',
      target: 'Rapport mensuel des performances',
      targetType: 'document',
      details: 'Génération du rapport de performance novembre 2024',
      ipAddress: '192.168.1.2',
      severity: 'medium',
      module: 'Rapports',
    },
  ] as const, []);

  // Chargement des logs avec startTransition
  const loadLogs = useCallback(() => {
    startTransition(() => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Simulation d'un appel API
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          logs: mockLogs,
          isLoading: false,
          totalCount: mockLogs.length,
        }));
      }, 800);
    });
  }, [mockLogs]);

  // Filtrage des logs
  const filteredLogs = useMemo(() => {
    let filtered = [...state.logs];

    if (state.filters.dateRange.start) {
      filtered = filtered.filter(log => log.timestamp >= state.filters.dateRange.start!);
    }
    if (state.filters.dateRange.end) {
      filtered = filtered.filter(log => log.timestamp <= state.filters.dateRange.end!);
    }
    if (state.filters.userId) {
      filtered = filtered.filter(log => log.userId === state.filters.userId);
    }
    if (state.filters.action) {
      filtered = filtered.filter(log => log.action === state.filters.action);
    }
    if (state.filters.targetType) {
      filtered = filtered.filter(log => log.targetType === state.filters.targetType);
    }
    if (state.filters.severity) {
      filtered = filtered.filter(log => log.severity === state.filters.severity);
    }
    if (state.filters.module) {
      filtered = filtered.filter(log => log.module === state.filters.module);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [state.logs, state.filters]);

  // Mise à jour des filtres
  const updateFilters = useCallback((newFilters: Partial<ActivityFilters>) => {
    startTransition(() => {
      setState(prev => ({
        ...prev,
        filters: { ...prev.filters, ...newFilters },
      }));
    });
  }, []);

  // Réinitialisation des filtres
  const resetFilters = useCallback(() => {
    startTransition(() => {
      setState(prev => ({
        ...prev,
        filters: {
          dateRange: { start: null, end: null },
          userId: null,
          action: null,
          targetType: null,
          severity: null,
          module: null,
        },
      }));
    });
  }, []);

  // Statistiques calculées
  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const bySeverity = {
      critical: filteredLogs.filter(log => log.severity === 'critical').length,
      high: filteredLogs.filter(log => log.severity === 'high').length,
      medium: filteredLogs.filter(log => log.severity === 'medium').length,
      low: filteredLogs.filter(log => log.severity === 'low').length,
    };
    const byModule = filteredLogs.reduce((acc, log) => {
      acc[log.module] = (acc[log.module] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.freeze({
      total,
      bySeverity: Object.freeze(bySeverity),
      byModule: Object.freeze(byModule),
      todayCount: filteredLogs.filter(log => {
        const today = new Date();
        return log.timestamp.toDateString() === today.toDateString();
      }).length,
    });
  }, [filteredLogs]);

  // Export des logs
  const exportLogs = useCallback((format: 'csv' | 'json' | 'pdf' = 'csv') => {
    startTransition(() => {
      const data = filteredLogs.map(log => ({
        Date: log.timestamp.toLocaleString('fr-FR'),
        Utilisateur: log.userName,
        Rôle: log.userRole,
        Action: log.action,
        Cible: log.target,
        Type: log.targetType,
        Détails: log.details,
        Sévérité: log.severity,
        Module: log.module,
        IP: log.ipAddress || 'N/A',
      }));

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs-activite-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        const headers = Object.keys(data[0] || {}).join(',');
        const rows = data.map(row => Object.values(row).join(','));
        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs-activite-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  }, [filteredLogs]);

  // API publique immutable
  return useMemo(() => Object.freeze({
    // État
    logs: filteredLogs,
    isLoading: state.isLoading,
    error: state.error,
    filters: state.filters,
    stats,
    
    // Actions
    loadLogs,
    updateFilters,
    resetFilters,
    exportLogs,
    
    // Utilitaires
    getLogById: (id: string) => state.logs.find(log => log.id === id),
    getLogsByUser: (userId: string) => filteredLogs.filter(log => log.userId === userId),
    getLogsByAction: (action: ActivityAction) => filteredLogs.filter(log => log.action === action),
  }), [
    filteredLogs,
    state.isLoading,
    state.error,
    state.filters,
    stats,
    loadLogs,
    updateFilters,
    resetFilters,
    exportLogs,
    state.logs,
  ]);
}
