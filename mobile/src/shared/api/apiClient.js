/**
 * API İstemci Sınıfı
 * Web ve mobil uygulamalar için ortak API çağrıları
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import NetworkUtils from '../utils/networkUtils';
import { Alert } from 'react-native';

// ServerConfig'i kullanmaya çalış, yoksa oluştur
let SERVER_CONFIG = {
  PRIMARY_IP: '',
  PORT: '5000',
  API_URL: ''
};

try {
  // Otomatik oluşturulmuş yapılandırma dosyasını içe aktar
  const serverConfig = require('../constants/ServerConfig').default;
  if (serverConfig) {
    SERVER_CONFIG = serverConfig;
    console.log('Sunucu yapılandırması yüklendi:', SERVER_CONFIG);
  }
} catch (error) {
  console.log('Sunucu yapılandırması bulunamadı, varsayılan değerler kullanılacak:', error.message);
}

// API URL'i başlangıçta boş olarak ayarla, dinamik olarak doldurulacak
let BASE_URL = '';

// API URL'i dinamik olarak ayarla
const initializeApiUrl = async () => {
  try {
    // Ortama göre API URL ayarla
    if (__DEV__) {
      const BACKEND_PORT = SERVER_CONFIG.PORT || '5000';
      
      // Önce yapılandırma dosyasından IP adresi kullan
      if (SERVER_CONFIG.API_URL) {
        BASE_URL = SERVER_CONFIG.API_URL;
        console.log("Yapılandırma dosyasından API URL:", BASE_URL);
      } 
      // Yoksa IP adresini otomatik algıla (WiFi IP)
      else {
        BASE_URL = await NetworkUtils.getApiBaseUrl(BACKEND_PORT);
        console.log("Otomatik algılanan API URL:", BASE_URL);
      }
    } else {
      // Prodüksiyonda HTTPS ile gerçek sunucu adresini kullan
      BASE_URL = 'https://api.sosyaletkinlik.com/api';
    }
    
    console.log('API URL ayarlandı:', BASE_URL);
    
    // API URL'ini Axios instance'a uygula
    apiClient.defaults.baseURL = BASE_URL;
    
    return BASE_URL;
  } catch (error) {
    console.error('API URL başlatılırken hata:', error);
    // Hata durumunda varsayılan URL'i kullan
    const fallbackUrl = 'http://localhost:5000/api';
    apiClient.defaults.baseURL = fallbackUrl;
    return fallbackUrl;
  }
};

// Network durumunu dinlemeye başla
const startNetworkMonitoring = () => {
  // IP değişikliklerini izle ve API URL'i güncelle
  NetworkUtils.startNetworkMonitoring(async (newIpAddress) => {
    if (newIpAddress) {
      console.log('IP değişikliği algılandı:', newIpAddress);
      await initializeApiUrl();
      // API durumunu kontrol et
      await checkApiStatus();
    }
  });
};

console.log('API İstemcisi başlatılıyor...');

// Token yönetimi için yardımcı fonksiyonlar
let authToken = null;

// Token ekle/kaldır fonksiyonları
const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    console.log('API token ayarlandı');
  } else {
    console.log('API token kaldırıldı');
  }
};

const removeAuthToken = () => {
  authToken = null;
  console.log('API token kaldırıldı');
};

// Axios instance oluştur
const apiClient = axios.create({
  // baseURL başlangıçta boş, sonra dinamik olarak ayarlanacak
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 saniye (daha uzun timeout, ağır yükteki cihazlar için)
  validateStatus: function (status) {
    return status >= 200 && status < 500;
  },
  // Proxy ayarlarını devre dışı bırak (bazı ağlarda sorun çıkarabilir)
  proxy: false
});

// API başlatmasını çağır
initializeApiUrl().then(() => {
  console.log('API URL başarıyla ayarlandı:', BASE_URL);
  startNetworkMonitoring();
}).catch(error => {
  console.error('API başlatma hatası:', error);
});

// Basit API durumu kontrolü
const checkApiStatus = async () => {
  if (!BASE_URL) {
    await initializeApiUrl();
  }
  
  // Sağlık kontrolü URL'ini oluştur
  const healthCheckUrl = SERVER_CONFIG.HEALTH_CHECK_URL || 
                        `${BASE_URL.replace('/api', '')}/api/health`;
  
  try {
    console.log('API bağlantı kontrolü yapılıyor:', healthCheckUrl);
    
    const response = await fetch(healthCheckUrl, { 
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      timeout: 5000
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API bağlantısı başarılı:', data.message);
      console.log('📱 Cihaz IP:', data.clientIp);
      console.log('🔄 Sunucu zamanı:', data.timestamp);
      return true;
    } else {
      console.log('❌ API bağlantısı başarısız:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ API bağlantı kontrolü hatası:', error.message);
    
    // Bağlantı hatası varsa kullanıcıya bildir
    try {
      Alert.alert(
        'Sunucu Bağlantı Hatası',
        `Backend sunucuya bağlanılamadı. Lütfen şunları kontrol edin:\n
1. Backend sunucunun çalıştığından emin olun
2. Mobil cihazınız ve bilgisayarınızın aynı WiFi ağında olduğunu doğrulayın
3. Bilgisayarınızın güvenlik duvarı ayarlarını kontrol edin

Bağlantı adresi: ${healthCheckUrl}`,
        [
          { text: 'Tamam', style: 'cancel' }
        ]
      );
    } catch (alertError) {
      // Alert gösterilirken hata oluştuysa sadece log'a yaz (muhtemelen test ortamındayız)
      console.log('Bağlantı hatası uyarısı gösterilemedi:', alertError);
    }
    
    // Hata mesajını analiz et ve daha açıklayıcı bilgiler sun
    if (error.message.includes('Network request failed')) {
      console.error('Ağ isteği başarısız. Telefon ve bilgisayarın aynı WiFi ağına bağlı olduğundan emin olun.');
    } else if (error.message.includes('timeout')) {
      console.error('Bağlantı zaman aşımına uğradı. Backend sunucusunun çalışır durumda olduğunu kontrol edin.');
    } else if (error.message.includes('JSON')) {
      console.error('Sunucu geçersiz yanıt döndürdü. Backend sunucusunun doğru çalıştığından emin olun.');
    }
    
    return false;
  }
};

// Uygulama başlatıldığında API bağlantısını kontrol et
checkApiStatus();

// İstek engelleme (interceptors)
apiClient.interceptors.request.use(
  async (config) => {
    console.log('API İsteği:', config.url); // Debug için
    
    // API URL'i ayarlanmamışsa ayarla
    if (!config.baseURL || config.baseURL === '') {
      config.baseURL = await initializeApiUrl();
    }
    
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
      // IP bağlantı hatası için spesifik mesaj
      if (BASE_URL.includes('192.168.137.1')) {
        throw new Error(`192.168.137.1:5000 adresine bağlantı kurulamadı. Lütfen:
          1) Backend sunucunun çalıştığından emin olun
          2) Telefonunuz ve bilgisayarınızın aynı ağda olduğunu kontrol edin
          3) Bilgisayarınızın güvenlik duvarı ayarlarını kontrol edin
          4) Bilgisayarınızdaki Node.js sunucusunun dış bağlantılara açık olduğundan emin olun`);
      } else {
        throw new Error(`Ağ hatası. Lütfen: 
          1) İnternet bağlantınızı kontrol edin
          2) IP adresinin doğru olduğunu kontrol edin (${BASE_URL})
          3) Backend sunucunun çalıştığından emin olun
          4) Mobil cihaz ve backend sunucunun aynı ağda olduğunu doğrulayın`);
      }
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

// Dışa açılan API
const api = {
  // Token yönetimi yardımcı fonksiyonları 
  setAuthToken,
  removeAuthToken,
  checkApiStatus,
  updateApiUrl: initializeApiUrl,
  
  // Kimlik doğrulama
  auth: {
    login: (credentials) => apiClient.post('/users/login', credentials),
    register: (userData) => apiClient.post('/users/register', userData),
    forgotPassword: (emailData) => apiClient.post('/users/forgot-password', emailData),
    verifyResetCode: (verificationData) => apiClient.post('/users/verify-reset-code', verificationData),
    resetPassword: (passwordData) => apiClient.post('/users/reset-password', passwordData),
    resendVerification: (emailData) => apiClient.post('/users/resend-verification', emailData),
    verifyEmail: (verificationData) => apiClient.post('/users/verify-email', verificationData),
    getToken: async () => {
      try {
        return await AsyncStorage.getItem('token');
      } catch (error) {
        console.error('Token alınırken hata:', error);
        return null;
      }
    },
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
    getRecommended: (params) => apiClient.get('/events/recommended', { params }),
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
    changePassword: (passwordData) => apiClient.put('/users/change-password', passwordData),
  },
  
  // Kullanıcılar (çoğul)
  users: {
    getRecommendedUsers: () => apiClient.get('/users/recommended'),
    follow: (userId) => apiClient.put(`/users/follow/${userId}`),
    unfollow: (userId) => apiClient.put(`/users/unfollow/${userId}`),
    getCurrentUser: () => apiClient.get('/users/profile'),
    updateProfile: (userData) => apiClient.put('/users/profile', userData),
  }
};

export default api; 