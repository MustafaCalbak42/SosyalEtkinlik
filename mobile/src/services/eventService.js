import api from '../shared/api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// API base URL'i al - eğer değişirse apiClient'dan güncel değeri alırız
const getBaseUrl = async () => {
  try {
    // Önce ApiClient'ın BASE_URL'ini kullanmayı dene
    if (api.getBaseUrl) {
      return api.getBaseUrl();
    }

    // Fallback: AsyncStorage'dan okumayı dene
    const savedBaseUrl = await AsyncStorage.getItem('api_base_url');
    if (savedBaseUrl) {
      return savedBaseUrl;
    }

    // Varsayılan URL'i kullan
    return __DEV__ ? 
      'http://localhost:5000/api' : 
      'https://api.sosyaletkinlik.com/api';
  } catch (error) {
    console.error('[eventService] Error getting base URL:', error);
    return 'http://localhost:5000/api';
  }
};

/**
 * Tüm etkinlikleri sayfalandırma ile getir
 * @param {number} page - Sayfa numarası
 * @param {number} limit - Sayfa başına etkinlik sayısı
 * @param {string} category - Etkinlik kategorisi (opsiyonel)
 * @returns {Promise} - API yanıtı
 */
export const getAllEvents = async (page = 1, limit = 10, category = null) => {
  try {
    console.log(`[eventService] Etkinlikler getiriliyor - sayfa: ${page}, limit: ${limit}, kategori: ${category}`);
    
    let params = { page, limit };
    
    // Kategori filtresi ekle
    if (category && category !== 'Tümü') {
      // Kategori adını doğrudan ekle, herhangi bir dönüşüm yapmadan
      params.category = category;
      // Log kategori filtresini kontrol için
      console.log(`[eventService] Kategori filtresi eklendi: ${category}`);
    }
    
    const response = await api.events.getAll(params);
    
    if (!response) {
      throw new Error('API yanıtı alınamadı');
    }
    
    if (response.status >= 400) {
      throw new Error(response.data?.message || 'Etkinlikler alınırken bir hata oluştu');
    }
    
    // Yanıt başarılı olduğunda gelen verileri logla
    if (response.data) {
      console.log(`[eventService] API ${response.data.data?.length || 0} etkinlik döndürdü`);
      
      // İlk birkaç etkinliğin hobi ve kategori bilgilerini kontrol için logla
      if (response.data.data && response.data.data.length > 0) {
        console.log('[eventService] İlk etkinlik örneği:', {
          id: response.data.data[0]._id,
          title: response.data.data[0].title,
          hobbyInfo: response.data.data[0].hobby,
          category: response.data.data[0].category
        });
      }
    }
    
    // Farklı API yanıt formatlarını ele al
    if (response.data && response.data.success) {
      // Yeni API formatı (success, data, pagination)
      return response.data;
    } else if (response.data && Array.isArray(response.data)) {
      // Eski API formatı (doğrudan dizi)
      return {
        success: true,
        data: response.data,
        pagination: {
          page: 1,
          limit: response.data.length,
          total: response.data.length,
          pages: 1
        }
      };
    } else {
      console.error('[eventService] Geçersiz API yanıt formatı:', response.data);
      throw new Error('Beklenmeyen API yanıt formatı');
    }
  } catch (error) {
    console.error('[eventService] Etkinlikler getirilirken hata:', error);
    return {
      success: false,
      message: error.message || 'Etkinlikler yüklenirken bir hata oluştu'
    };
  }
};

/**
 * Etkinlik detaylarını getir
 * @param {string} eventId - Etkinlik ID
 * @returns {Promise} - API yanıtı
 */
export const getEventById = async (eventId) => {
  try {
    console.log(`[eventService] ${eventId} ID'li etkinlik getiriliyor`);
    const response = await api.events.getById(eventId);
    
    if (!response) {
      throw new Error('API yanıtı alınamadı');
    }
    
    if (response.status >= 400) {
      throw new Error(response.data?.message || 'Etkinlik detayları alınırken bir hata oluştu');
    }
    
    // Farklı API yanıt formatlarını ele al
    if (response.data && response.data.success) {
      return response.data;
    } else if (response.data) {
      return {
        success: true,
        data: response.data
      };
    } else {
      console.error('[eventService] Geçersiz API yanıt formatı:', response.data);
      throw new Error('Beklenmeyen API yanıt formatı');
    }
  } catch (error) {
    console.error(`[eventService] ${eventId} ID'li etkinlik getirilirken hata:`, error);
    return {
      success: false,
      message: error.message || 'Etkinlik detayları yüklenirken bir hata oluştu'
    };
  }
};

/**
 * Kullanıcının hobilerine göre önerilen etkinlikleri getir
 * @param {number} page - Sayfa numarası
 * @param {number} limit - Sayfa başına etkinlik sayısı
 * @param {string} city - Kullanıcının bulunduğu il/şehir (opsiyonel)
 * @returns {Promise} - API yanıtı
 */
export const getRecommendedEvents = async (page = 1, limit = 4, city = null) => {
  try {
    console.log(`[eventService] Önerilen etkinlikler getiriliyor - sayfa: ${page}, limit: ${limit}, şehir: ${city || 'Belirtilmedi'}`);
    
    // Kimlik doğrulama kontrolü
    const token = await AsyncStorage.getItem('token');
    
    // Debug token
    if (token) {
      console.log('[eventService] Token retrieved (first 20 chars):', token.substring(0, 20));
      // Log token to check for any unexpected characters or formatting issues
      console.log('[eventService] Token format check:', {
        length: token.length,
        hasSpaces: token.includes(' '),
        hasNewlines: token.includes('\n'),
        hasCarriageReturns: token.includes('\r')
      });
    } else {
      console.warn('[eventService] No token found in AsyncStorage');
    }
    
    if (!token) {
      console.warn('[eventService] Oturum açılmamış, önerilen etkinlikler alınamıyor');
      return {
        success: false,
        message: 'Kişiselleştirilmiş öneriler için lütfen giriş yapın'
      };
    }
    
    // API isteği için URL parametreleri
    const params = { page, limit };
    
    // Şehir parametresi eklendi (belirlenmişse)
    if (city) {
      params.city = city;
      console.log(`[eventService] Şehir filtresi eklendi: ${city}`);
    }
    
    console.log('[eventService] Önerilen etkinlikler için parametreler:', params);
    
    // Base URL'i al
    const baseUrl = await getBaseUrl();
    console.log('[eventService] Using API base URL:', baseUrl);
    
    // Ensure token is clean (no whitespace, etc)
    const cleanToken = token.trim();
    
    // Manuel olarak token ekleyerek API çağrısı yap
    const authHeader = `Bearer ${cleanToken}`;
    console.log('[eventService] Authorization header:', authHeader.substring(0, 25) + '...');
    
    const response = await axios.get(`${baseUrl}/events/recommended`, {
      params,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response) {
      console.error('[eventService] Önerilen etkinlikler için API yanıtı alınamadı');
      throw new Error('API yanıtı alınamadı');
    }
    
    if (response.status >= 400) {
      console.error('[eventService] Önerilen etkinlikler API hatası:', response.status, response.data?.message);
      throw new Error(response.data?.message || 'Önerilen etkinlikler alınırken bir hata oluştu');
    }
    
    // API yanıtını logla
    console.log('[eventService] Önerilen etkinlikler API yanıtı:', {
      status: response.status,
      success: response.data?.success,
      count: response.data?.data?.length || 0,
      message: response.data?.message || 'Mesaj yok'
    });
    
    // Yanıt formatını kontrol et
    if (response.data && response.data.success) {
      console.log(`[eventService] Önerilen etkinlikler başarıyla alındı (${response.data.data?.length || 0} etkinlik)`);
      
      // İl bilgisine göre filtrelenmiş mi kontrol et
      const message = response.data.message || '';
      if (message.includes('ilinizdeki')) {
        console.log('[eventService] Etkinlikler il bilgisine göre filtrelendi');
      }
      
      return response.data;
    } else if (response.data && Array.isArray(response.data)) {
      console.log(`[eventService] Önerilen etkinlikler başarıyla alındı (eski format, ${response.data.length} etkinlik)`);
      return {
        success: true,
        data: response.data,
        pagination: {
          page: 1,
          limit: response.data.length,
          total: response.data.length,
          pages: 1
        }
      };
    } else {
      console.error('[eventService] Geçersiz API yanıt formatı:', response.data);
      throw new Error('Beklenmeyen API yanıt formatı');
    }
  } catch (error) {
    console.error('[eventService] Önerilen etkinlikler getirilirken hata:', error);
    console.error('[eventService] Hata detayları:', error.message);
    return {
      success: false,
      message: error.message || 'Önerilen etkinlikler yüklenirken bir hata oluştu'
    };
  }
};

/**
 * Etkinliğe katılma
 * @param {string} eventId - Etkinlik ID
 * @returns {Promise} - API yanıtı
 */
export const joinEvent = async (eventId) => {
  try {
    console.log(`[eventService] ${eventId} ID'li etkinliğe katılınıyor`);
    const response = await api.events.join(eventId);
    
    if (!response) {
      throw new Error('API yanıtı alınamadı');
    }
    
    if (response.status >= 400) {
      throw new Error(response.data?.message || 'Etkinliğe katılırken bir hata oluştu');
    }
    
    return {
      success: true,
      message: response.data?.message || 'Etkinliğe başarıyla katıldınız',
      data: response.data
    };
  } catch (error) {
    console.error(`[eventService] ${eventId} ID'li etkinliğe katılırken hata:`, error);
    return {
      success: false,
      message: error.message || 'Etkinliğe katılırken bir hata oluştu'
    };
  }
};

/**
 * Etkinlikten ayrılma
 * @param {string} eventId - Etkinlik ID
 * @returns {Promise} - API yanıtı
 */
export const leaveEvent = async (eventId) => {
  try {
    console.log(`[eventService] ${eventId} ID'li etkinlikten ayrılınıyor`);
    const response = await api.events.leave(eventId);
    
    if (!response) {
      throw new Error('API yanıtı alınamadı');
    }
    
    if (response.status >= 400) {
      throw new Error(response.data?.message || 'Etkinlikten ayrılırken bir hata oluştu');
    }
    
    return {
      success: true,
      message: response.data?.message || 'Etkinlikten başarıyla ayrıldınız',
      data: response.data
    };
  } catch (error) {
    console.error(`[eventService] ${eventId} ID'li etkinlikten ayrılırken hata:`, error);
    return {
      success: false,
      message: error.message || 'Etkinlikten ayrılırken bir hata oluştu'
    };
  }
}; 