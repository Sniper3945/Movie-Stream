import ReactGA from 'react-ga4';

// Initialiser GA4 avec l'ID de mesure
const initialize = () => {
  if (typeof window !== 'undefined') {
    ReactGA.initialize('G-7QQDCDDQQW');
  }
};

// Suivre les vues de pages avec un titre explicite
const trackPageView = (path?: string, pageTitle?: string) => {
  const page = path || (typeof window !== 'undefined' ? window.location.pathname : '');
  
  // Envoi de la page view avec titre personnalisé si fourni
  ReactGA.send({
    hitType: "pageview",
    page,
    title: pageTitle || page // Utilise le titre personnalisé ou le chemin comme fallback
  });
};

// Suivre les clics sur les films
const trackFilmClick = (filmTitle: string, index: number) => {
  ReactGA.event({
    category: 'Film',
    action: 'Click',
    label: filmTitle,
    value: index
  });
};

// Fonction pour tracker les vues de films
export const trackFilmView = (filmTitle: string) => {
  ReactGA.event({
    category: 'engagement',
    action: 'film_view',
    label: filmTitle
  });
};

// Fonction pour tracker la lecture vidéo
export const trackVideoPlay = (filmTitle: string) => {
  ReactGA.event({
    category: 'video',
    action: 'video_play',
    label: filmTitle
  });
};

// Fonction pour tracker la fin de la vidéo
export const trackVideoComplete = (filmTitle: string) => {
  ReactGA.event({
    category: 'video',
    action: 'video_complete',
    label: filmTitle
  });
};

// Exporter les fonctions utiles
export { initialize, trackPageView, trackFilmClick };