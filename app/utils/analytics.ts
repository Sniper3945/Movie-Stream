import ReactGA from 'react-ga4';

// Initialiser GA4 avec l'ID de mesure
const initialize = () => {
  if (typeof window !== 'undefined') {
    ReactGA.initialize('G-7QQDCDDQQW');
  }
};

// Suivre les vues de pages
const trackPageView = (path?: string) => {
  const page = path || (typeof window !== 'undefined' ? window.location.pathname : '');
  ReactGA.send({ hitType: "pageview", page });
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