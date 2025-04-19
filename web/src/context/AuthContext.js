import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  loginUser, 
  logoutUser, 
  isAuthenticated, 
  getUserProfile 
} from '../services/userService';

// Context oluştur
const AuthContext = createContext();

// Context provider bileşeni
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Sayfa yüklendiğinde kimlik doğrulama durumunu kontrol et
  useEffect(() => {
    const checkAuthStatus = async () => {
      setLoading(true);
      try {
        if (isAuthenticated()) {
          const userData = await getUserProfile();
          setUser(userData);
        }
      } catch (err) {
        console.error('Kimlik doğrulama hatası:', err);
        logoutUser();
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Giriş işlemi
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loginUser({ email, password });
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message || 'Giriş yapılırken bir hata oluştu.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Çıkış işlemi
  const logout = () => {
    logoutUser();
    setUser(null);
    navigate('/login');
  };

  // Context değerleri
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: () => !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth hook must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 