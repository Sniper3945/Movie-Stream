import { useGlobalLoader } from '../hooks/useGlobalLoader';
import { motion, AnimatePresence } from 'framer-motion';

export const GlobalLoader = () => {
  const { isLoading, progress, message, type } = useGlobalLoader();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm z-[100] flex items-center justify-center"
        >
          <div className="bg-gray-900 rounded-lg p-8 max-w-sm w-full mx-4 border border-gray-700">
            <div className="text-center">
              {/* Animation différente selon le type */}
              {type === 'images' ? (
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                  <span className="material-icons absolute inset-0 flex items-center justify-center text-blue-400">
                    image
                  </span>
                </div>
              ) : (
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
              )}
              
              <h3 className="text-xl font-semibold text-white mb-2">
                {type === 'initial' && 'Initialisation...'}
                {type === 'navigation' && 'Navigation...'}
                {type === 'data' && 'Chargement...'}
                {type === 'images' && 'Optimisation des images...'}
              </h3>
              
              {message && (
                <p className="text-gray-300 text-sm mb-4">{message}</p>
              )}
              
              {/* Barre de progression */}
              <div className="w-full bg-gray-700 rounded-full h-2">
                <motion.div
                  className="bg-blue-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              
              <p className="text-xs text-gray-400 mt-2">{Math.round(progress)}%</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
