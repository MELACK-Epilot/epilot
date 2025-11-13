import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'E-Pilot',
        short_name: 'E-Pilot',
        description: 'Plateforme de gestion scolaire - République du Congo',
        theme_color: '#00A3E0',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        // Augmenter la limite de cache à 5 MB pour les gros bundles
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Stratégie de cache pour les assets
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 heures
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1000, // Augmenter la limite d'avertissement à 1 MB
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Formulaires
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // UI & Animations
          'ui-vendor': ['framer-motion', 'lucide-react'],
          // Supabase
          'supabase-vendor': ['@supabase/supabase-js'],
          // React Query
          'query-vendor': ['@tanstack/react-query'],
          // Tableaux & Data
          'table-vendor': ['@tanstack/react-table', 'recharts'],
          // Export (gros packages)
          'export-vendor': ['xlsx', 'jspdf', 'jspdf-autotable'],
          // Radix UI (composants)
          'radix-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
          ],
        },
      },
    },
  },
});
