/**
 * Configuration des tests pour les features partagées
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Étendre les matchers Vitest avec jest-dom
expect.extend(matchers);

// Nettoyage après chaque test
afterEach(() => {
  cleanup();
});

// Mocks globaux pour les tests
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock pour les variables d'environnement
vi.mock('@/config/features.config', () => ({
  isFeatureEnabled: vi.fn(() => true),
  FEATURE_FLAGS: {},
}));

vi.mock('@/config/permissions.config', () => ({
  hasPermission: vi.fn(() => true),
  RESOURCES: {},
}));
