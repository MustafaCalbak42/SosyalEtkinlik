/**
 * API İstemci Sınıfı
 * Web ve mobil uygulamalar için ortak API çağrıları
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API temel URL (web ve mobil için ortak)
let BASE_URL = 'http://10.0.2.2:5000/api'; // Android Emulator için localhost

// Platform bazlı konfigürasyon
if (process.env.REACT_APP_API_URL) {
  // React web uygulaması için
  BASE_URL = process.env.REACT_APP_API_URL;
} else if (process.env.EXPO_PUBLIC_API_URL) {
  // React Native (Expo) için
  BASE_URL = process.env.EXPO_PUBLIC_API_URL;
}

console.log('API URL:', BASE_URL); // Debug için API URL'sini göster

// Axios instance oluştur
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// İstek engelleme (interceptors)
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Yanıt engelleme
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Token geçersiz olduğunda yenileme işlemi
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        const response = await axios.post(`${BASE_URL}/users/refresh-token`, { refreshToken });
        
        if (response.data.success) {
          const { token } = response.data.data;
          await AsyncStorage.setItem('token', token);
          
          // Yeni token ile isteği tekrar gönder
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Token yenileme başarısız, kullanıcı çıkışı yapılmalı
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('refreshToken');
        await AsyncStorage.removeItem('user');
      }
    }
    
    return Promise.reject(error);
  }
);

// API Fonksiyonları
const api = {
  // Kimlik doğrulama
  auth: {
    login: (credentials) => apiClient.post('/users/login', credentials),
    register: (userData) => apiClient.post('/users/register', userData),
    forgotPassword: (emailData) => apiClient.post('/users/forgot-password', emailData),
    verifyResetCode: (verificationData) => apiClient.post('/users/verify-reset-code', verificationData),
    resetPassword: (passwordData) => apiClient.post('/users/reset-password', passwordData),
    resendVerification: (emailData) => apiClient.post('/users/resend-verification', emailData),
    verifyEmail: (token) => apiClient.get(`/users/verify-email/${token}`),
    handleEmailVerified: async (verificationData) => {
      try {
        // Tokenleri saklama
        if (verificationData.token) {
          await AsyncStorage.setItem('token', verificationData.token);
        }
        
        if (verificationData.refreshToken) {
          await AsyncStorage.setItem('refreshToken', verificationData.refreshToken);
        }
        
        // Kullanıcı bilgisini al
        const userResponse = await apiClient.get('/users/profile');
        
        if (userResponse.data && userResponse.data.success) {
          // Kullanıcı bilgilerini döndür
          return {
            success: true,
            data: userResponse.data.data
          };
        }
        
        return { success: true };
      } catch (error) {
        console.error('E-posta doğrulama işleme hatası:', error);
        return {
          success: false,
          message: 'Doğrulama işlenirken bir hata oluştu'
        };
      }
    }
  },
  
  // Etkinlikler
  events: {
    getAll: (params) => apiClient.get('/events', { params }),
    getById: (id) => apiClient.get(`/events/${id}`),
    create: (eventData) => apiClient.post('/events', eventData),
    update: (id, eventData) => apiClient.put(`/events/${id}`, eventData),
    delete: (id) => apiClient.delete(`/events/${id}`),
    join: (id) => apiClient.post(`/events/${id}/join`),
    leave: (id) => apiClient.post(`/events/${id}/leave`),
    getNearby: (lat, lng, radius) => 
      apiClient.get(`/events/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
  },
  
  // Hobiler
  hobbies: {
    getAll: () => apiClient.get('/hobbies'),
    getById: (id) => apiClient.get(`/hobbies/${id}`),
    getUsersByHobby: (id) => apiClient.get(`/users/hobby/${id}`),
  },
  
  // Kullanıcılar
  user: {
    getProfile: () => apiClient.get('/users/profile'),
    updateProfile: (userData) => apiClient.put('/users/profile', userData),
    changePassword: (passwordData) => apiClient.post('/users/change-password', passwordData),
  }
};

export default api; 