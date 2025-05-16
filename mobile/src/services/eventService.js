import api from '../shared/api/apiClient';

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
      params.category = category;
    }
    
    const response = await api.events.getAll(params);
    
    if (!response) {
      throw new Error('API yanıtı alınamadı');
    }
    
    if (response.status >= 400) {
      throw new Error(response.data?.message || 'Etkinlikler alınırken bir hata oluştu');
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
 * @returns {Promise} - API yanıtı
 */
export const getRecommendedEvents = async (page = 1, limit = 4) => {
  try {
    console.log(`[eventService] Önerilen etkinlikler getiriliyor - sayfa: ${page}, limit: ${limit}`);
    
    const params = { page, limit, recommended: true };
    const response = await api.events.getAll(params);
    
    if (!response) {
      throw new Error('API yanıtı alınamadı');
    }
    
    if (response.status >= 400) {
      throw new Error(response.data?.message || 'Önerilen etkinlikler alınırken bir hata oluştu');
    }
    
    // Farklı API yanıt formatlarını ele al
    if (response.data && response.data.success) {
      return response.data;
    } else if (response.data && Array.isArray(response.data)) {
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