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
        
        if (token) {
          // Set token in apiClient
          setUserToken(token);
          apiClient.setAuthToken(token);
          
          // First set logged in state based on token existence
          setIsLoggedIn(true);
          
          // Then attempt to fetch user profile
          try {
            const profileResult = await fetchUserProfile();
            console.log('[AuthContext] Profile fetch result:', profileResult.success);
            
            if (!profileResult.success) {
              // If profile fetch fails, token might be invalid
              console.warn('[AuthContext] Failed to fetch profile with stored token, logging out');
              // Don't log out immediately, let the user retry
            }
          } catch (profileError) {
            console.error('[AuthContext] Error fetching profile with stored token:', profileError);
            // Keep the user logged in, they can retry later
          }
        } else {
          console.log('[AuthContext] No token found, user is not logged in');
          setIsLoggedIn(false);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('[AuthContext] Error loading auth info:', error);
        setIsLoggedIn(false);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await apiClient.users.getCurrentUser();
      console.log('AuthContext - User Profile API response:', JSON.stringify(response.data, null, 2));
      
      if (response.data) {
        // API yanıt yapısını kontrol et (response.data.user, response.data.data veya doğrudan response.data)
        const userData = response.data.user || response.data.data || response.data;
        
        if (userData) {
          console.log('AuthContext - Setting user profile:', JSON.stringify(userData, null, 2));
          setUserProfile(userData);
          return { success: true };
        }
      }
      
      console.error('AuthContext - Invalid profile data format:', response.data);
      return { success: false, message: 'Kullanıcı profili yüklenemedi' };
    } catch (error) {
      console.error('Error fetching user profile:', error);
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
      
      // Clean tokens before storage
      const cleanToken = token.trim();
      console.log('[AuthContext] Storing token (length: ' + cleanToken.length + ')');
      
      // Token'ı kaydet
      await AsyncStorage.setItem('token', cleanToken);
      
      // RefreshToken varsa kaydet
      if (refreshToken) {
        const cleanRefreshToken = refreshToken.trim();
        await AsyncStorage.setItem('refreshToken', cleanRefreshToken);
      }
      
      // API istemci için token ayarla
      apiClient.setAuthToken(cleanToken);
      
      // Kullanıcı profili bilgilerini al
      const profileResponse = await fetchUserProfile();
      
      // Oturum durumunu güncelle
      setUserToken(cleanToken);
      setIsLoggedIn(true);
      
      return { success: true };
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
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
      await AsyncStorage.removeItem('token');
      apiClient.removeAuthToken();
      setUserToken(null);
      setUserProfile(null);
      setIsLoggedIn(false);
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
        refreshUserProfile: fetchUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 