import { motion } from 'framer-motion';
import { SparklesIcon } from './SparklesIcon';

interface WelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomePopup = ({ isOpen, onClose }: WelcomePopupProps) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
      // Empêcher la fermeture accidentelle en cliquant sur l'overlay
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-600 shadow-2xl w-full mx-4 relative overflow-hidden
                   h-[70%] md:h-[80%] max-h-[600px] md:max-h-[700px] max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Effet de brillance en arrière-plan */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 opacity-50"></div>
        
        {/* Bouton de fermeture */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 z-10 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-full transition-all duration-200 hover:scale-110 group"
          aria-label="Fermer"
        >
          <span className="material-icons text-sm md:text-base text-gray-300 group-hover:text-white transition-colors">
            close
          </span>
        </button>

        {/* Contenu scrollable */}
        <div className="relative h-full overflow-y-auto custom-scrollbar">
          <div className="p-4 md:p-8 pt-12 md:pt-16">
            {/* En-tête avec icône */}
            <div className="text-center mb-6 md:mb-8">
              <div className="flex justify-center mb-3 md:mb-4">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <SparklesIcon size={32} className="text-white md:!w-10 md:!h-10" />
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
                Bienvenue sur MovieStream !
              </h1>
              <p className="text-blue-400 font-medium text-base md:text-lg">
                🎬 Votre cinéma collaboratif
              </p>
            </div>

            {/* Contenu principal */}
            <div className="space-y-4 md:space-y-6 text-gray-300 leading-relaxed">
              <div className="bg-gray-800/50 rounded-xl p-4 md:p-6 border border-gray-700 welcome-card">
                <h3 className="text-lg md:text-xl font-semibold text-white mb-2 md:mb-3 flex items-center">
                  <span className="material-icons text-blue-400 mr-2 text-xl md:text-2xl">people</span>
                  Un projet collaboratif
                </h3>
                <p className="mb-2 md:mb-3 text-sm md:text-base">
                  Ce site a débuté comme un <span className="text-blue-400 font-medium">projet personnel</span> pour 
                  organiser ma collection de films, mais j'ai décidé de l'ouvrir à mon entourage pour partager 
                  cette passion du cinéma.
                </p>
                <p className="text-sm md:text-base">
                  Aujourd'hui, c'est un espace <span className="text-purple-400 font-medium">collaboratif</span> où 
                  chacun peut découvrir et proposer des films !
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-4 md:p-6 border border-gray-700 welcome-card">
                <h3 className="text-lg md:text-xl font-semibold text-white mb-2 md:mb-3 flex items-center">
                  <span className="material-icons text-yellow-400 mr-2 text-xl md:text-2xl">info</span>
                  À propos du contenu
                </h3>
                <p className="mb-2 md:mb-3 text-sm md:text-base">
                  Tous les films présents sur ce site sont <span className="text-yellow-400 font-medium">
                  trouvés librement sur Internet</span>. Ce site ne stocke aucun contenu, 
                  il référence uniquement des liens publics.
                </p>
                <p className="text-xs md:text-sm text-gray-400">
                  Si vous êtes propriétaire d'un contenu et souhaitez son retrait, contactez-nous.
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-4 md:p-6 border border-blue-700/50 welcome-card">
                <h3 className="text-lg md:text-xl font-semibold text-white mb-2 md:mb-3 flex items-center">
                  <span className="material-icons text-green-400 mr-2 text-xl md:text-2xl">lightbulb</span>
                  Participez !
                </h3>
                <p className="mb-2 md:mb-3 text-sm md:text-base">
                  Vous avez une idée de film à ajouter ? Utilisez le bouton ✨ en bas à droite pour proposer vos suggestions !
                </p>
                <p className="text-green-400 font-medium text-sm md:text-base">
                  Ensemble, construisons la meilleure bibliothèque de films ! 🚀
                </p>
              </div>
            </div>

            {/* Pied de page */}
            <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-700 text-center">
              <p className="text-gray-400 text-xs md:text-sm mb-3 md:mb-4">
                Bon visionnage et merci de faire partie de cette aventure ! 🎭
              </p>
              <button
                onClick={onClose}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 md:px-8 py-2 md:py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg text-sm md:text-base"
              >
                C'est parti ! 🎬
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
