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
        const token = await AsyncStorage.getItem('token');
        if (token) {
          setUserToken(token);
          setIsLoggedIn(true);
          apiClient.setAuthToken(token);
          await fetchUserProfile();
        }
      } catch (error) {
        console.error('Error loading auth info', error);
      } finally {
        setLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await apiClient.users.getCurrentUser();
      if (response.data) {
        setUserProfile(response.data);
        return { success: true };
      }
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
        console.error('Login error: No token provided');
        return { 
          success: false,
          message: 'Giriş yapılamadı: Token bilgisi eksik' 
        };
      }
      
      // Token'ı kaydet
      await AsyncStorage.setItem('token', token);
      
      // RefreshToken varsa kaydet
      if (refreshToken) {
        await AsyncStorage.setItem('refreshToken', refreshToken);
      }
      
      // API istemci için token ayarla
      apiClient.setAuthToken(token);
      
      // Kullanıcı profili bilgilerini al
      const profileResponse = await fetchUserProfile();
      
      // Oturum durumunu güncelle
      setUserToken(token);
      setIsLoggedIn(true);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
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