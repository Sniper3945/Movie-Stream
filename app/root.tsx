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
        
        {/* Service Worker */}gle Analytics GA4 */}
        <script dangerouslySetInnerHTML={{
          __html: `async
            if ('serviceWorker' in navigator) {https://www.googletagmanager.com/gtag/js?id=G-7Q0QCDDQ0W"
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js');
              });
            }
          `ow.dataLayer || [];
        }} />arguments);}
gtag('js', new Date());
        {/* Google Analytics GA4 */}  gtag('config', 'G-7Q0QCDDQ0W');
        <script  `,
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-7Q0QCDDQ0W"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];der>
              function gtag(){dataLayer.push(arguments);}llRestoration />
              gtag('js', new Date());ripts />
              gtag('config', 'G-7Q0QCDDQ0W');  </body>
            `,   </html>
          }}  );
        />
      </head>
      <body>xport default function App() {
        <FilmProvider>  return <Outlet />;













}  return <Outlet />;export default function App() {}  );    </html>      </body>        <Scripts />        <ScrollRestoration />        </FilmProvider>          {children}}
