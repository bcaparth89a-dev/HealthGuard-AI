import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be consumed within an AuthProvider hierarchy');
  }
  return context;
};

export default useAuth;
