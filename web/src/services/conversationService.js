import axios from 'axios';
import { getApiUrl } from './utils';

// API URL
const API_URL = getApiUrl('saved-conversations');
console.log('Saved Conversations API URL initialized as:', API_URL);

// Axios instance
const axiosInstance = axios.create({
  timeout: 30000
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Konuşma kaydet
 * @param {Object} data - Konuşma verileri (targetUserId ve isteğe bağlı note)
 * @returns {Promise<Object>}
 */
export const saveConversation = async (data) => {
  try {
    // Gerekli verileri kontrol et
    if (!data || !data.targetUserId) {
      console.error('saveConversation: Geçersiz veri');
      return { 
        success: false, 
        message: 'Geçersiz kullanıcı verisi',
        error: 'Missing targetUserId' 
      };
    }

    console.log('saveConversation: Konuşma kaydediliyor:', data);
    
    // API isteği gönder
    const response = await axiosInstance.post(API_URL, data);
    
    console.log('saveConversation: Yanıt alındı:', response.data);
    return response.data;
  } catch (error) {
    // Hata detaylarını logla
    console.error('saveConversation: Hata:', error);
    console.error('saveConversation: Hata detayları:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // Eğer kullanıcı zaten kaydedilmişse, başarılı olarak kabul et
    if (error.response && error.response.status === 400 && 
        error.response.data && error.response.data.message && 
        error.response.data.message.includes('already')) {
      
      console.log('saveConversation: Kullanıcı zaten kaydedilmiş');
      
      return {
        success: true,
        message: 'Bu kullanıcı zaten kaydedilmiş',
        data: { 
          targetUserId: data.targetUserId,
          _id: 'existing_conversation' 
        }
      };
    }
    
    // Diğer hata durumlarında basitleştirilmiş yanıt döndür
    return { 
      success: false, 
      message: error.response?.data?.message || error.message || 'Konuşma kaydedilemedi',
      error: error.message
    };
  }
};

/**
 * Kaydedilmiş konuşmaları getir
 * @returns {Promise<Object>}
 */
export const getSavedConversations = async () => {
  try {
    // Token kontrolü
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token bulunamadı, kaydedilmiş konuşmalar getirilemeyecek');
      return { success: false, message: 'Token bulunamadı', data: [] };
    }

    // API isteği
    const response = await axiosInstance.get(API_URL);
    
    // Dönen veriyi kontrol et
    if (!response.data) {
      console.warn('API yanıtı geçersiz, boş veri döndü');
      return { success: false, message: 'Geçersiz API yanıtı', data: [] };
    }
    
    // Dönüş verisi formatlı değilse düzelt
    if (!response.data.success && !response.data.data) {
      // Direkt veri dönmüş olabilir
      return { 
        success: true, 
        data: Array.isArray(response.data) ? response.data : []
      };
    }
    
    return response.data;
  } catch (error) {
    console.error('Kaydedilmiş konuşmaları getirme hatası:', error);
    
    // Backend 404 dönerse (henüz kaydedilmiş konuşma yoksa)
    if (error.response && error.response.status === 404) {
      return { success: true, data: [] };
    }
    
    // Backend 401 dönerse (token geçersiz)
    if (error.response && error.response.status === 401) {
      console.warn('Token geçersiz, kaydedilmiş konuşmalar getirilemedi');
      return { success: false, message: 'Oturum süresi dolmuş', data: [] };
    }
    
    // Diğer hatalar
    throw handleError(error);
  }
};

/**
 * Kaydedilmiş konuşmayı sil
 * @param {string} id - Konuşma ID
 * @returns {Promise<Object>}
 */
export const deleteSavedConversation = async (id) => {
  try {
    const response = await axiosInstance.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Kaydedilmiş konuşmayı silme hatası:', error);
    throw handleError(error);
  }
};

/**
 * API hata işleme
 * @param {Error} error - Axios hatası
 * @returns {Error} - İşlenmiş hata
 */
const handleError = (error) => {
  if (error.response) {
    // Sunucu yanıtı hatası
    const errorMessage = error.response.data.message || error.response.statusText;
    const customError = new Error(errorMessage);
    customError.status = error.response.status;
    customError.data = error.response.data;
    return customError;
  } else if (error.request) {
    // İstek yapıldı ama yanıt alınamadı
    return new Error('Sunucudan yanıt alınamadı. Lütfen internet bağlantınızı kontrol edin.');
  } else {
    // İstek yapılırken bir hata oluştu
    return error;
  }
};

export default {
  saveConversation,
  getSavedConversations,
  deleteSavedConversation
}; 