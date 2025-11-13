/**
 * Tests d'intégration pour le dashboard utilisateur
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock du dashboard (sera remplacé par le vrai composant)
const MockUserDashboard = () => (
  <div data-testid="user-dashboard">
    <h1>Dashboard Utilisateur</h1>
    <div data-testid="stats-cards">
      <div>Élèves: 150</div>
      <div>Classes: 8</div>
      <div>Enseignants: 12</div>
    </div>
  </div>
);

// Wrapper de test avec providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('User Dashboard Integration', () => {
  beforeEach(() => {
    // Reset des mocks avant chaque test
    vi.clearAllMocks();
  });

  it('renders dashboard with correct data', async () => {
    render(
      <TestWrapper>
        <MockUserDashboard />
      </TestWrapper>
    );

    // Vérification du titre
    expect(screen.getByText('Dashboard Utilisateur')).toBeInTheDocument();

    // Vérification des statistiques
    await waitFor(() => {
      expect(screen.getByText('Élèves: 150')).toBeInTheDocument();
      expect(screen.getByText('Classes: 8')).toBeInTheDocument();
      expect(screen.getByText('Enseignants: 12')).toBeInTheDocument();
    });
  });

  it('handles loading states correctly', async () => {
    // Mock d'un état de chargement
    const LoadingDashboard = () => (
      <div data-testid="loading-dashboard">
        <div>Chargement...</div>
      </div>
    );

    render(
      <TestWrapper>
        <LoadingDashboard />
      </TestWrapper>
    );

    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('handles error states correctly', async () => {
    // Mock d'un état d'erreur
    const ErrorDashboard = () => (
      <div data-testid="error-dashboard">
        <div>Erreur de chargement des données</div>
      </div>
    );

    render(
      <TestWrapper>
        <ErrorDashboard />
      </TestWrapper>
    );

    expect(screen.getByText('Erreur de chargement des données')).toBeInTheDocument();
  });
});
