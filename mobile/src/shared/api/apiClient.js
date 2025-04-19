/**
 * API İstemci Sınıfı
 * Web ve mobil uygulamalar için ortak API çağrıları
 */

import axios from 'axios';

// API temel URL (web ve mobil için ortak)
let BASE_URL = 'http://localhost:5000/api';

// Platform bazlı konfigürasyon
if (process.env.REACT_APP_API_URL) {
  // React web uygulaması için
  BASE_URL = process.env.REACT_APP_API_URL;
} else if (process.env.EXPO_PUBLIC_API_URL) {
  // React Native (Expo) için
  BASE_URL = process.env.EXPO_PUBLIC_API_URL;
}

// Axios instance oluştur
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// İstek engelleme (interceptors)
apiClient.interceptors.request.use(
  (config) => {
    // Mevcut token'ı depodan al (localStorage veya AsyncStorage)
    const token = getToken();
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Yanıt engelleme
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Yetkilendirme hatası (401)
    if (error.response && error.response.status === 401) {
      // Token yenileme veya çıkış işlemleri
      logout();
    }
    
    return Promise.reject(error);
  }
);

// Token alıcı - platform bazlı depolama kullanır
const getToken = () => {
  // Web platformda
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  
  // Bu fonksiyon asenkron olmalı ama basitlik için senkron yapıda tutuldu
  // Gerçek bir uygulamada AsyncStorage'dan alınan token için farklı bir yaklaşım gerekir
  return null; 
};

// Çıkış işlemi - platform bazlı
const logout = () => {
  // Web platformda
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Anasayfaya yönlendir (web için)
    window.location.href = '/login';
  }
  
  // Mobil platformda farklı işlemler gerekecek
  // Bu kısım native kod içinde ele alınacak
};

// API Fonksiyonları
const api = {
  // Kimlik doğrulama
  auth: {
    login: (credentials) => apiClient.post('/users/login', credentials),
    register: (userData) => apiClient.post('/users/register', userData),
    getProfile: () => apiClient.get('/users/profile'),
    updateProfile: (profileData) => apiClient.put('/users/profile', profileData),
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
  users: {
    follow: (userId) => apiClient.put(`/users/follow/${userId}`),
    unfollow: (userId) => apiClient.put(`/users/unfollow/${userId}`),
  }
};

export default api; 