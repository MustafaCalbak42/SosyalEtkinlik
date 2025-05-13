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
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();

  // AuthContext durumunu konsola logla
  const logAuthState = (action) => {
    console.log(`[AuthContext] ${action}`);
    console.log('[AuthContext] User:', user);
    console.log('[AuthContext] Token:', localStorage.getItem('token') ? 'Present' : 'Missing');
    console.log('[AuthContext] Loading:', loading);
    console.log('[AuthContext] Error:', error);
  };

  // Sayfa yüklendiğinde kimlik doğrulama durumunu kontrol et
  useEffect(() => {
    const checkAuthStatus = async () => {
      setLoading(true);
      logAuthState('Checking authentication status');
      
      try {
        // LocalStorage'da token var mı kontrol et
        const token = localStorage.getItem('token');
        console.log('[AuthContext] Token in localStorage:', token ? `${token.substring(0, 15)}...` : 'null');
        
        if (isAuthenticated()) {
          console.log('[AuthContext] Token exists, fetching user profile');
          const userData = await getUserProfile();
          
          if (userData && userData.success) {
            console.log('[AuthContext] User profile fetched successfully:', userData.data.user);
            setUser(userData.data.user);
          } else {
            console.error('[AuthContext] Failed to fetch user profile:', userData);
            // Token var ama profil alınamadı, token geçersiz olabilir
            logoutUser();
            setUser(null);
          }
        } else {
          console.log('[AuthContext] No authentication token found');
          setUser(null);
        }
      } catch (err) {
        console.error('[AuthContext] Authentication error:', err);
        // Hata durumunda logout
        logoutUser();
        setUser(null);
      } finally {
        setLoading(false);
        setAuthChecked(true);
        logAuthState('Auth check completed');
      }
    };

    checkAuthStatus();
  }, []);

  // Giriş işlemi
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    logAuthState('Login attempt');
    
    try {
      const data = await loginUser({ email, password });
      console.log('[AuthContext] Login response:', data);
      
      if (data.success) {
        console.log('[AuthContext] Login successful, user:', data.data.user);
        setUser(data.data.user);
        // Kontrol amaçlı token yazdır
        console.log('[AuthContext] Token after login:', localStorage.getItem('token') ? 'Set successfully' : 'Failed to set');
      } else {
        console.error('[AuthContext] Login failed:', data.message);
      }
      return data;
    } catch (err) {
      console.error('[AuthContext] Login error:', err);
      setError(err.message || 'Giriş yapılırken bir hata oluştu.');
      throw err;
    } finally {
      setLoading(false);
      logAuthState('Login attempt completed');
    }
  };

  // Çıkış işlemi
  const logout = () => {
    logAuthState('Logout attempt');
    logoutUser();
    setUser(null);
    navigate('/login');
    logAuthState('Logged out');
  };

  // Token yenilendiğinde veya kullanıcı kimliği değiştiğinde
  // kullanıcı bilgisini güncelle
  const refreshUserData = async () => {
    logAuthState('Refreshing user data');
    try {
      // İlk önce token kontrolü yap
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('[AuthContext] No token available for refreshing user data');
        return null;
      }
      
      console.log('[AuthContext] Refreshing user data with token');
      const userData = await getUserProfile();
      if (userData && userData.success) {
        console.log('[AuthContext] User data refreshed successfully:', userData.data.user);
        setUser(userData.data.user);
        return userData.data.user;
      } else {
        console.error('[AuthContext] Failed to refresh user data:', userData);
        return null;
      }
    } catch (err) {
      console.error('[AuthContext] Error refreshing user data:', err);
      return null;
    } finally {
      logAuthState('User data refresh completed');
    }
  };

  // Context değerleri
  const value = {
    user,
    setUser,
    loading,
    error,
    login,
    logout,
    refreshUserData,
    authChecked,
    isAuthenticated: () => {
      // Hem token var mı hem de user objesi var mı kontrol et
      const token = localStorage.getItem('token');
      return !!token; // Sadece token kontrolü yapalım, user objesi olmasa da token varsa authenticated sayılsın
    },
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