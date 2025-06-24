// Déclaration pour gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export const GA_TRACKING_ID = 'G-7Q0QCDDQ0W';

// Fonction pour tracker les clics sur les films
export const trackFilmClick = (filmTitle: string, position: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'film_click', {
      film_title: filmTitle,
      position: position,
      event_category: 'engagement',
    });
  }
};

// Fonction pour tracker les vues de films
export const trackFilmView = (filmTitle: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'film_view', {
      film_title: filmTitle,
      event_category: 'engagement',
    });
  }
};

// Fonction pour tracker la lecture vidéo
export const trackVideoPlay = (filmTitle: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'video_play', {
      film_title: filmTitle,
      event_category: 'video',
    });
  }
};

// Fonction pour tracker la fin de la vidéo
export const trackVideoComplete = (filmTitle: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'video_complete', {
      film_title: filmTitle,
      event_category: 'video',
    });
  }
};