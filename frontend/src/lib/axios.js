import axios from 'axios';
import supabase from './supabase';

const getBaseURL = () => {
  const base = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const sanitized = base.replace(/\/+$/, '');
  return sanitized.endsWith('/api') ? sanitized : `${sanitized}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor to append authorization token dynamically
api.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Interceptor failed to fetch Supabase token:', e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for normalized error formatting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalizedError = {
      message: error.response?.data?.error || error.response?.data?.message || error.message || 'An unexpected connection error occurred.',
      status: error.response?.status || 500,
      details: error.response?.data?.details || null,
    };
    return Promise.reject(normalizedError);
  }
);

export default api;
