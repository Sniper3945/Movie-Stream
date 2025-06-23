import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { LinksFunction } from "react-router";
import { FilmProvider } from './contexts/FilmContext';

import "./tailwind.css";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" },
  
  // Précharger les images critiques (première rangée)
  { rel: "preload", href: "/assets/film1.png", as: "image" },
  { rel: "preload", href: "/assets/film2.png", as: "image" },
  { rel: "preload", href: "/assets/film3.png", as: "image" },
  { rel: "preload", href: "/assets/film4.png", as: "image" },
  
  // DNS prefetch pour les domaines externes
  { rel: "dns-prefetch", href: "https://0x0.st" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        
        {/* Fix pour les modules ES6 */}
        <script type="module" dangerouslySetInnerHTML={{
          __html: `
            // Fix pour les modules ES6
            if (!window.process) {
              window.process = { env: {} };
            }
          `
        }} />

        {/* Service Worker avec cache clearing */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', async () => {
                try {
                  // Nettoyer les anciens caches d'abord
                  const cacheNames = await caches.keys();
                  for (const cacheName of cacheNames) {
                    if (cacheName.includes('moviestream-v1')) {
                      console.log('[Cache] Deleting old cache:', cacheName);
                      await caches.delete(cacheName);
                    }
                  }
                  
                  // Enregistrer le nouveau service worker
                  const registration = await navigator.serviceWorker.register('/sw.js');
                  console.log('[SW] Registration successful:', registration);
                  
                  // Forcer l'update si nouveau SW disponible
                  registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('[SW] New version available - reloading...');
                        window.location.reload();
                      }
                    });
                  });
                } catch (err) {
                  console.log('[SW] Registration failed:', err);
                }
              });
            }
          `
        }} />

        {/* Google Analytics GA4 */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-7Q0QCDDQ0W"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-7Q0QCDDQ0W');
            `,
          }}
        />
      </head>
      <body>
        <FilmProvider>
          {children}
        </FilmProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
