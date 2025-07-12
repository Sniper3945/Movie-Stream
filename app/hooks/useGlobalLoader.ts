import { useState, useEffect } from 'react';

interface LoaderState {
  isLoading: boolean;
  progress: number;
  message: string;
  type: 'initial' | 'navigation' | 'data' | 'images';
}

let globalLoaderState: LoaderState = {
  isLoading: false,
  progress: 0,
  message: '',
  type: 'initial'
};

const listeners = new Set<(state: LoaderState) => void>();

export const useGlobalLoader = () => {
  const [state, setState] = useState(globalLoaderState);

  useEffect(() => {
    const listener = (newState: LoaderState) => setState(newState);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const setLoader = (updates: Partial<LoaderState>) => {
    globalLoaderState = { ...globalLoaderState, ...updates };
    listeners.forEach(listener => listener(globalLoaderState));
  };

  const showLoader = (message: string, type: LoaderState['type'] = 'data') => {
    setLoader({ isLoading: true, message, type, progress: 0 });
  };

  const updateProgress = (progress: number) => {
    setLoader({ progress: Math.min(100, Math.max(0, progress)) });
  };

  const hideLoader = () => {
    setLoader({ isLoading: false, progress: 100 });
  };

  return {
    ...state,
    showLoader,
    updateProgress,
    hideLoader
  };
};
