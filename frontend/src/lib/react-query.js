import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevents aggressive automatic fetching in background tabs
      retry: 1,                    // Limit retries to 1 for better user responsive feedback
      staleTime: 5 * 60 * 1000,    // Data is fresh for 5 minutes
      gcTime: 10 * 60 * 1000,       // Keep unused data in memory cache for 10 minutes
    },
    mutations: {
      retry: false,                // Fail immediately on mutation errors
    },
  },
});
