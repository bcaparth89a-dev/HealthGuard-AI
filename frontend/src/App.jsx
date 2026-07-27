import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { queryClient } from './lib/react-query';
import { AuthProvider } from './context/AuthContext';
import { router } from './routes';

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
