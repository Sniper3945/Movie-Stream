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
  { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" },
  { rel: "stylesheet", href: "https://fonts.googleapis.com/icon?family=Material+Icons" },
];

export function HydrateFallback() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold mb-2">MovieStream</h1>
        <p className="text-gray-300">Chargement de l'application...</p>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />

        {/* Service Worker registration */}
        <script dangerouslySetInnerHTML={{
                  __html: `
                    if ('serviceWorker' in navigator) {
                      window.addEventListener('load', async () => {
                        try {
                          const isDev = window.location.hostname === 'localhost' || 
                                      window.location.hostname === '127.0.0.1';
                          console.log('[SW Registration] Environment:', isDev ? 'DEV' : 'PROD');
                          
                          const registration = await navigator.serviceWorker.register('/sw.js');
                          console.log('[SW Registration] Success:', registration);
                        } catch (err) {
                          console.log('[SW Registration] Failed:', err);
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
