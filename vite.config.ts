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
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#fbfbf9',
        theme_color: '#fbfbf9',
        categories: ['health', 'lifestyle', 'medical'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        // Con capturas, Chrome en Android muestra una ventana de instalar más clara, como la de una tienda.
        screenshots: [
          { src: 'screenshots/inicio.webp', sizes: '780x1688', type: 'image/webp', form_factor: 'narrow', label: 'Inicio: cómo te sientes hoy y ayuda para el pánico' },
          { src: 'screenshots/calma.webp', sizes: '780x1688', type: 'image/webp', form_factor: 'narrow', label: 'Calma: respirar con los pulmones' },
          { src: 'screenshots/explorar.webp', sizes: '780x1688', type: 'image/webp', form_factor: 'narrow', label: 'Explorar: tocar el cuerpo por dentro' },
          { src: 'screenshots/inicio-ancho.webp', sizes: '1280x800', type: 'image/webp', form_factor: 'wide', label: 'Inicio en la computadora' },
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
        // three.js (la escena 3D) tampoco: solo lo baja quien abre «Explorar por dentro».
        // Las capturas solo las usa la ventana de instalar: no se guardan para usar sin internet.
        globIgnores: ['**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese,latin-ext}-*', '**/escena-*.js', 'screenshots/**'],
        navigateFallback: '/index.html',
        // Los modelos 3D de «Explorar por dentro» no van en el precache (no todos los abren): se
        // guardan la primera vez que se abren y desde ahí funcionan sin internet. El nombre lleva
        // versión (cuerpo-v1.glb), así que CacheFirst nunca se queda con uno viejo.
        runtimeCaching: [
          {
            // El nombre lleva hash: si cambia, es otro archivo.
            urlPattern: /\/assets\/escena-[^/]+\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cuerpo-3d-codigo',
              expiration: { maxEntries: 2 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Las reflexiones de «Para escuchar» se guardan la primera vez que se escuchan.
            // rangeRequests: Safari pide el audio por pedazos y necesita que la caché los sirva.
            // El nombre de la caché lleva la voz: al cambiarla (la de prueba por la real), cámbialo
            // para que nadie se quede con los audios viejos.
            urlPattern: /\/audio\/escuchar\/[^/]+\.m4a$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'escuchar-voz-prueba',
              expiration: { maxEntries: 40 },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
          {
            urlPattern: /\/models\/cuerpo\/[^/]+\.glb$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cuerpo-3d',
              expiration: { maxEntries: 6 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
