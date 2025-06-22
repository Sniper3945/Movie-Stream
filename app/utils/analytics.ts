// Fonction pour envoyer des événements à Google Analytics
declare global {
  interface Window {
    gtag: (command: string, action: string, parameters?: Record<string, any>) => void;
  }
}

// Fonction pour tracker les événements
export const trackEvent = (eventName: string, parameters: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
    console.log('GA Event tracked:', eventName, parameters);
  }
};

// Événements spécifiques pour votre site
export const trackFilmClick = (filmId: string, filmTitle: string) => {
  trackEvent('film_click', {
    film_id: filmId,
    film_title: filmTitle,
    event_category: 'engagement',
  });
};

export const trackFilmView = (filmId: string, filmTitle: string) => {
  trackEvent('film_view', {
    film_id: filmId,
    film_title: filmTitle,
    event_category: 'engagement',
  });
};

export const trackVideoPlay = (filmId: string, filmTitle: string) => {
  trackEvent('video_play', {
    film_id: filmId,
    film_title: filmTitle,
    event_category: 'video',
  });
};

export const trackVideoComplete = (filmId: string, filmTitle: string) => {
  trackEvent('video_complete', {
    film_id: filmId,
    film_title: filmTitle,
    event_category: 'video',
  });
};