import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor to append authorization token dynamically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hg_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for normalized error formatting
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const normalizedError = {
      message: error.response?.data?.message || 'An unexpected connection error occurred.',
      status: error.response?.status || 500,
      details: error.response?.data?.details || null,
    };
    return Promise.reject(normalizedError);
  }
);

export default api;
