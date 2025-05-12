/**
 * API İstemci Sınıfı
 * Web ve mobil uygulamalar için ortak API çağrıları
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Ortama göre API URL ayarla
const getApiBaseUrl = () => {
  // Test ortamında çalışıyorsa backend'i doğrudan localhost adresinden kullan
  if (__DEV__) {
    // Expo Go'da çalışıyorsa backend IP'sini kullan - bunu kendi IP adresinizle güncelleyin
    // Açıklama: Expo Go içinde "localhost" emülatörün kendisini ifade eder, backend'i değil
    
    // ÖNEMLİ: BURADA KENDİ YEREL IP ADRESİNİZİ GİRİN
    // Windows'ta ipconfig, MacOS/Linux'ta ifconfig komutları ile IP adresinizi öğrenebilirsiniz
    // Örnek: 192.168.1.5, 192.168.0.100, vb.
    const BACKEND_IP = '10.196.204.140';
    const BACKEND_PORT = '5000';
    return `http://${BACKEND_IP}:${BACKEND_PORT}/api`;
  }
  
  // Prodüksiyonda HTTPS ile gerçek sunucu adresini kullan
  return 'https://api.sosyaletkinlik.com/api';
};

// API temel URL'ini ayarla
const BASE_URL = getApiBaseUrl();

console.log('API URL:', BASE_URL); // Debug için API URL'sini göster

// Axios instance oluştur
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 saniye (timeout süresini artırdım)
  validateStatus: function (status) {
    return status >= 200 && status < 500;
  },
  // Proxy ayarlarını devre dışı bırak (bazı ağlarda sorun çıkarabilir)
  proxy: false,
  // Bağlantı sorunlarını tespit etmek için daha fazla bilgi
  maxRedirects: 5
});

// İstek engelleme (interceptors)
apiClient.interceptors.request.use(
  async (config) => {
    console.log('API İsteği:', config.url); // Debug için
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('API İstek Hatası:', error);
    return Promise.reject(error);
  }
);

// Yanıt engelleme
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Yanıtı:', response.config.url, response.status); // Debug için
    return response;
  },
  async (error) => {
    // Hata detaylarını loglayalım
    console.error('API Yanıt Hatası:', error.config?.url, error.message);
    console.error('Detaylı hata:', JSON.stringify({
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      code: error.code,
      message: error.message
    }, null, 2));
    
    // Timeout hatası
    if (error.code === 'ECONNABORTED') {
      console.log('TIMEOUT HATASI: API sunucusu yanıt vermiyor');
      throw new Error(`Sunucu yanıt vermiyor (${BASE_URL}). Lütfen backend sunucusunun çalıştığından ve IP adresinin doğru olduğundan emin olun.`);
    }
    
    // Ağ hatası
    if (error.message === 'Network Error') {
      console.log('NETWORK ERROR: Ağ bağlantısı kurulamadı');
      throw new Error(`Ağ hatası. Lütfen: 
        1) İnternet bağlantınızı kontrol edin
        2) IP adresinin doğru olduğunu kontrol edin (${BASE_URL})
        3) Backend sunucunun çalıştığından emin olun
        4) Mobil cihaz ve backend sunucunun aynı ağda olduğunu doğrulayın`);
    }
    
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
    getEvents: () => apiClient.get('/events'),
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
    getByCategory: (category) => apiClient.get(`/hobbies/category/${category}`),
    getById: (id) => apiClient.get(`/hobbies/${id}`),
    getUsersByHobby: (id) => apiClient.get(`/hobbies/${id}/users`),
  },
  
  // Kullanıcılar
  user: {
    getProfile: () => apiClient.get('/users/profile'),
    updateProfile: (userData) => apiClient.put('/users/profile', userData),
    changePassword: (passwordData) => apiClient.post('/users/change-password', passwordData),
  },
  
  // Kullanıcılar (çoğul)
  users: {
    getRecommendedUsers: () => apiClient.get('/users/recommended'),
    follow: (userId) => apiClient.put(`/users/follow/${userId}`),
    unfollow: (userId) => apiClient.put(`/users/unfollow/${userId}`),
  }
};

export default api; 