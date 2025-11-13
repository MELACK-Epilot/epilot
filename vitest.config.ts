/**
 * Configuration Vitest pour E-Pilot Congo
 * Tests unitaires et d'intégration par feature
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/features/shared/__tests__/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/features/shared/__tests__/setup.ts',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        // Seuils par feature
        './src/features/shared/': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        './src/features/user-space/': {
          branches: 75,
          functions: 75,
          lines: 75,
          statements: 75,
        },
      },
    },
    // Organisation des tests par feature
    include: [
      'src/features/**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/features/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
