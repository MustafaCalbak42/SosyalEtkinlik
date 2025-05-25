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
    
    // Kimlik doğrulama kontrolü - doğrudan try/catch içinde
    let token;
    try {
      token = await AsyncStorage.getItem('token');
      console.log('[eventService] Token retrieved:', token ? 'Yes (length: ' + token.length + ')' : 'No');
    } catch (tokenError) {
      console.error('[eventService] Token okuma hatası:', tokenError);
      token = null;
    }
    
    if (!token || token.trim().length === 0) {
      console.warn('[eventService] Oturum açılmamış veya token geçersiz, önerilen etkinlikler alınamıyor');
      return {
        success: false,
        message: 'Kişiselleştirilmiş öneriler için lütfen giriş yapın'
      };
    }
    
    // Token'ı temizle ve uzunluğunu kontrol et
    const cleanToken = token.toString().trim();
    
    if (cleanToken.length < 10) {
      console.warn('[eventService] Token çok kısa, geçersiz görünüyor:', cleanToken.length);
      return {
        success: false,
        message: 'Geçersiz token, lütfen tekrar giriş yapın'
      };
    }
    
    // API isteği için URL parametreleri
    const params = { page, limit };
    
    // Şehir parametresi eklendi (belirlenmişse)
    if (city) {
      params.city = city;
      console.log(`[eventService] Şehir filtresi eklendi: ${city}`);
    }
    
    // 3 FARKLI YÖNTEMLE API ÇAĞRISI DENEME:
    
    // 1. Yöntem: apiClient ile çağrı yapma
    try {
      console.log('[eventService] API çağrısı yapılıyor (Yöntem 1: api.events.getRecommended)');
      const response1 = await api.events.getRecommended(params);
      
      if (response1.data && response1.data.success) {
        console.log('[eventService] Yöntem 1 başarılı, etkinlik sayısı:', response1.data.data?.length || 0);
        return response1.data;
      } else {
        console.warn('[eventService] Yöntem 1 başarısız, diğer yöntemler deneniyor');
      }
    } catch (method1Error) {
      console.error('[eventService] Yöntem 1 hatası:', method1Error.message);
    }
    
    // 2. Yöntem: Manuel axios ile çağrı yapma
    try {
      console.log('[eventService] API çağrısı yapılıyor (Yöntem 2: axios ile manuel çağrı)');
      // Base URL'i al
      const baseUrl = await getBaseUrl();
      
      // Axios ile direkt API çağrısı
      const response2 = await axios.get(`${baseUrl}/events/recommended`, {
        params,
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response2.data && (response2.data.success || Array.isArray(response2.data))) {
        console.log('[eventService] Yöntem 2 başarılı, etkinlik sayısı:', 
          response2.data.data?.length || (Array.isArray(response2.data) ? response2.data.length : 0));
        
        // Yanıt formatını düzenle
        if (Array.isArray(response2.data)) {
          return {
            success: true,
            data: response2.data,
            message: 'Size özel etkinlikler'
          };
        }
        return response2.data;
      } else {
        console.warn('[eventService] Yöntem 2 başarısız, son yöntem deneniyor');
      }
    } catch (method2Error) {
      console.error('[eventService] Yöntem 2 hatası:', method2Error.message);
    }
    
    // 3. Yöntem: fetch API ile deneme
    try {
      console.log('[eventService] API çağrısı yapılıyor (Yöntem 3: fetch API)');
      // Base URL'i al
      const baseUrl = await getBaseUrl();
      
      // URL parametrelerini oluştur
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      if (city) queryParams.append('city', city);
      
      // fetch ile API çağrısı
      const response3 = await fetch(`${baseUrl}/events/recommended?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response3.ok) {
        throw new Error(`HTTP error! status: ${response3.status}`);
      }
      
      const data = await response3.json();
      console.log('[eventService] Yöntem 3 başarılı, yanıt:', data.success ? 'success true' : 'success false');
      
      if (data && (data.success || Array.isArray(data))) {
        console.log('[eventService] Yöntem 3 başarılı, etkinlik sayısı:', 
          data.data?.length || (Array.isArray(data) ? data.length : 0));
        
        // Yanıt formatını düzenle
        if (Array.isArray(data)) {
          return {
            success: true,
            data: data,
            message: 'Size özel etkinlikler'
          };
        }
        return data;
      } else {
        throw new Error('Geçersiz API yanıtı: ' + JSON.stringify(data));
      }
    } catch (method3Error) {
      console.error('[eventService] Yöntem 3 hatası:', method3Error.message);
      return {
        success: false,
        message: 'Tüm API çağrı yöntemleri başarısız oldu: ' + method3Error.message
      };
    }
  } catch (error) {
    console.error('[eventService] Önerilen etkinlikler getirilirken genel hata:', error);
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