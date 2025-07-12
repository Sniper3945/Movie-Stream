import { useState, useEffect } from 'react';

const WELCOME_POPUP_KEY = 'hasSeenWelcomePopup';

export const useWelcomePopup = () => {
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà vu le popup
    const hasSeenWelcome = localStorage.getItem(WELCOME_POPUP_KEY);
    
    if (!hasSeenWelcome) {
      // Attendre un court délai pour que l'app se charge, mais ne pas bloquer
      setTimeout(() => {
        setShowWelcomePopup(true);
      }, 1000); // Réduit le délai
    }
  }, []);

  const closeWelcomePopup = () => {
    setShowWelcomePopup(false);
    localStorage.setItem(WELCOME_POPUP_KEY, 'true');
  };

  // Fonction pour réinitialiser (utile pour les tests)
  const resetWelcomePopup = () => {
    localStorage.removeItem(WELCOME_POPUP_KEY);
    setShowWelcomePopup(true);
  };

  return {
    showWelcomePopup,
    closeWelcomePopup,
    resetWelcomePopup
    // Plus de isLoading qui bloquait tout !
  };
};

