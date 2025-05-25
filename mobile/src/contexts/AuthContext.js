import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../shared/api/apiClient';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from storage
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        console.log('[AuthContext] Loading stored authentication...');
        setLoading(true);
        
        const token = await AsyncStorage.getItem('token');
        console.log('[AuthContext] Token found in storage:', !!token);
        
        if (token && token.trim().length > 0) {
          // Token'ı temizle ve uzunluğunu kontrol et
          const cleanToken = token.trim();
          
          // Geçerli bir token gibi görünüyorsa API'ye ayarla
          setUserToken(cleanToken);
          apiClient.setAuthToken(cleanToken);
          
          // Profil bilgilerini getirerek token'ın geçerliliğini doğrula
          try {
            console.log('[AuthContext] Validating token by fetching profile...');
            const profileResult = await fetchUserProfile();
            
            if (profileResult.success) {
              console.log('[AuthContext] Token valid, user logged in');
              setIsLoggedIn(true);
            } else {
              console.warn('[AuthContext] Token invalid, clearing auth state');
              // Token geçersiz, temizle
              await clearAuthState();
            }
          } catch (profileError) {
            console.error('[AuthContext] Token validation failed:', profileError);
            // API çağrısı başarısız, token muhtemelen geçersiz
            await clearAuthState();
          }
        } else {
          console.log('[AuthContext] No valid token found, user is not logged in');
          await clearAuthState();
        }
      } catch (error) {
        console.error('[AuthContext] Error loading auth info:', error);
        await clearAuthState();
      } finally {
        setLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  // Auth state'i temizle
  const clearAuthState = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      
      setIsLoggedIn(false);
      setUserToken(null);
      setUserProfile(null);
      
      apiClient.removeAuthToken();
      console.log('[AuthContext] Auth state cleared');
    } catch (error) {
      console.error('[AuthContext] Error clearing auth state:', error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await apiClient.users.getCurrentUser();
      console.log('AuthContext - User Profile API response:', JSON.stringify(response.data, null, 2));
      
      // Backend API'nin döndürdüğü yapıyı doğru şekilde kullan
      if (response.data && response.data.success && response.data.data) {
        const userData = response.data.data;
        setUserProfile(userData);
        return { success: true };
      }
      
      console.error('AuthContext - Invalid profile data format:', response.data);
      return { success: false, message: 'Kullanıcı profili yüklenemedi' };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      
      // 401 hatası varsa token geçersiz
      if (error.response?.status === 401) {
        console.warn('[AuthContext] Token expired or invalid (401 error)');
        return { success: false, tokenInvalid: true, message: 'Oturum süresi dolmuş' };
      }
      
      return { 
        success: false, 
        message: error.response?.data?.message || 'Kullanıcı profili yüklenirken bir hata oluştu' 
      };
    }
  };

  const login = async (token, refreshToken) => {
    try {
      if (!token) {
        console.error('[AuthContext] Login error: No token provided');
        return { 
          success: false,
          message: 'Giriş yapılamadı: Token bilgisi eksik' 
        };
      }
      
      // Token'ı doğrudan string olarak kaydet - boşlukları ve özel karakterleri temizleme
      const cleanToken = token.toString().trim();
      console.log('[AuthContext] Storing token (length: ' + cleanToken.length + ')');
      
      // Token'ı kaydet ve başarıyla kaydedildiğinden emin ol
      await AsyncStorage.setItem('token', cleanToken);
      
      // Token'ın kaydedildiğini doğrula
      const storedToken = await AsyncStorage.getItem('token');
      if (!storedToken) {
        console.error('[AuthContext] Token storage failed');
        return {
          success: false,
          message: 'Token kaydedilemedi'
        };
      }
      
      console.log('[AuthContext] Token successfully stored, length:', storedToken.length);
      console.log('[AuthContext] Token first 10 chars:', storedToken.substring(0, 10));
      
      // RefreshToken varsa kaydet
      if (refreshToken) {
        const cleanRefreshToken = refreshToken.toString().trim();
        await AsyncStorage.setItem('refreshToken', cleanRefreshToken);
        console.log('[AuthContext] Refresh token stored');
      }
      
      // API istemci için token ayarla
      apiClient.setAuthToken(cleanToken);
      
      // Oturum durumunu güncelle
      setUserToken(cleanToken);
      
      // Kullanıcı profili bilgilerini al ve login durumunu buna göre ayarla
      try {
        console.log('[AuthContext] Fetching user profile after token setup...');
        const profileResponse = await fetchUserProfile();
        
        if (profileResponse.success) {
          console.log('[AuthContext] Profile fetch successful, setting logged in state');
          setIsLoggedIn(true);
          return { success: true };
        } else {
          console.error('[AuthContext] Profile fetch failed after login:', profileResponse.message);
          
          // Token geçersizse temizle
          if (profileResponse.tokenInvalid) {
            await clearAuthState();
            return {
              success: false,
              message: 'Token geçersiz, lütfen tekrar giriş yapın'
            };
          } else {
            // Profil yüklenemedi ama token geçerli gibi, yine de giriş yapmış say
            console.warn('[AuthContext] Profile load failed but token seems valid, keeping user logged in');
            setIsLoggedIn(true);
            return { 
              success: true,
              message: 'Giriş başarılı ama profil bilgileri yüklenemedi' 
            };
          }
        }
      } catch (profileError) {
        console.error('[AuthContext] Error fetching profile after login:', profileError);
        
        // API hatası olsa bile, token kaydedilmiş ve geçerli olabilir
        console.log('[AuthContext] Setting logged in despite profile fetch error');
        setIsLoggedIn(true);
        return { 
          success: true,
          message: 'Giriş başarılı, profil bilgileri daha sonra yüklenecek' 
        };
      }
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      await clearAuthState();
      return {
        success: false,
        message: error.message || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiClient.auth.register(userData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = async () => {
    try {
      console.log('[AuthContext] Logging out user...');
      await clearAuthState();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (updatedData) => {
    try {
      const response = await apiClient.users.updateProfile(updatedData);
      setUserProfile({...userProfile, ...response.data});
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update profile'
      };
    }
  };

  // Token'ın geçerliliğini kontrol et (dış kullanım için)
  const validateToken = async () => {
    try {
      const result = await fetchUserProfile();
      if (!result.success && result.tokenInvalid) {
        await clearAuthState();
      }
      return result.success;
    } catch (error) {
      console.error('[AuthContext] Token validation error:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        userToken,
        userProfile,
        loading,
        login,
        register,
        logout,
        setIsLoggedIn,
        updateProfile,
        refreshUserProfile: fetchUserProfile,
        validateToken,
        clearAuthState
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 