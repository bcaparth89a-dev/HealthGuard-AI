import React, { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { queryClient } from './lib/react-query';
import { AuthProvider } from './context/AuthProvider';
import { router } from './routes';
import SplashScreen from './components/common/SplashScreen';

export const App = () => {
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('splash_shown');
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem('splash_shown', 'true');
    setShowSplash(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AnimatePresence mode="wait">
          {showSplash ? (
            <SplashScreen key="splash" onComplete={handleSplashComplete} />
          ) : (
            <RouterProvider key="app" router={router} />
          )}
        </AnimatePresence>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
