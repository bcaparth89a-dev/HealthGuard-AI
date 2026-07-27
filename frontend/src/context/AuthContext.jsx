import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch initial session on mount
    const initializeAuth = async () => {
      try {
        const session = await authService.getCurrentSession();
        if (session) {
          setUser(session.user);
        }
      } catch (err) {
        console.error('Error fetching initial session:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // 2. Setup subscription to track login/logout session events
    const subscription = authService.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const loggedUser = await authService.login(email, password);
      setUser(loggedUser);
      return loggedUser;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const newUser = await authService.register(name, email, password);
      return newUser;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    setLoading(true);
    try {
      const data = await authService.forgotPassword(email);
      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading: loading,
    login,
    register,
    logout,
    forgotPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
