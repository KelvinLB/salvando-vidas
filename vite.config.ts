import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'logo.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Salvando Vidas',
        short_name: 'Salvando Vidas',
        description:
          'Un espacio seguro y gratuito para respirar, distraer la mente y encontrar ayuda cuando más se necesita.',
        lang: 'es',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f6f3ee',
        theme_color: '#f6f3ee',
        categories: ['health', 'lifestyle', 'medical'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Tengo pánico', short_name: 'Pánico', url: '/panico' },
          { name: 'Necesito ayuda ahora', short_name: 'Ayuda', url: '/ayuda' },
          { name: 'Respirar', short_name: 'Respirar', url: '/calma' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // El español solo usa el subconjunto latino de las fuentes.
        globIgnores: ['**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese,latin-ext}-*'],
        navigateFallback: '/index.html',
      },
    }),
  ],
})
