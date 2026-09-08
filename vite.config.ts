import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// On GitHub Pages the app is served from /<repo>/, so the CI workflow sets
// BASE_PATH (e.g. "/IPhone-Automation/"). Locally it defaults to "/".
const base = process.env.BASE_PATH || '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Hive — Money & Focus',
        short_name: 'Hive',
        description:
          'A private, on-device money & focus companion: expenses, bills, budgets, wallet, receipts and focus — nothing leaves your phone.',
        theme_color: '#1f9d55',
        background_color: '#f4f2ea',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['finance', 'productivity', 'lifestyle'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // The OCR engine (~9MB) loads on demand — keep it out of the precache.
        globIgnores: ['**/tesseract/**'],
        navigateFallbackDenylist: [/^\/api/],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
} as any)
