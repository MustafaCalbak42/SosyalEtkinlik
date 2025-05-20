import api from '../shared/api';

// Tüm etkinlikleri getir
export const getAllEvents = async (page = 1, limit = 10, category = null) => {
  try {
    console.log(`[eventService] Fetching events - page: ${page}, limit: ${limit}, category: ${category}`);
    
    let url = `/events?page=${page}&limit=${limit}`;
    
    // Kategori filtresi ekle
    if (category && category !== 'Tümü') {
      url += `&category=${encodeURIComponent(category)}`;
    }
    
    const response = await api.get(url);
    
    if (response.data && response.data.success) {
      return response.data;
    } else if (response.data && Array.isArray(response.data)) {
      // Eski API formatı için geriye uyumluluk
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
      console.error('[eventService] Invalid response format:', response.data);
      return {
        success: false,
        message: 'Beklenmeyen API yanıt formatı'
      };
    }
  } catch (error) {
    console.error('[eventService] Error fetching events:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Etkinlikler yüklenirken bir hata oluştu'
    };
  }
};

// Etkinlik detaylarını getir
export const getEventById = async (eventId) => {
  try {
    console.log(`[eventService] Fetching event with ID: ${eventId}`);
    const response = await api.get(`/events/${eventId}`);
    
    if (response.data && response.data.success) {
      return response.data;
    } else if (response.data) {
      return {
        success: true,
        data: response.data
      };
    } else {
      console.error('[eventService] Invalid response format:', response.data);
      return {
        success: false,
        message: 'Beklenmeyen API yanıt formatı'
      };
    }
  } catch (error) {
    console.error(`[eventService] Error fetching event ${eventId}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || 'Etkinlik detayları yüklenirken bir hata oluştu'
    };
  }
};

// Hobi kategorisine göre etkinlikleri getir
export const getEventsByHobby = async (hobbyId) => {
  try {
    console.log(`[eventService] Fetching events for hobby ID: ${hobbyId}`);
    const response = await api.get(`/events/hobby/${hobbyId}`);
    
    if (response.data && Array.isArray(response.data)) {
      return {
        success: true,
        data: response.data
      };
    } else if (response.data && response.data.success) {
      return response.data;
    } else {
      console.error('[eventService] Invalid response format:', response.data);
      return {
        success: false,
        message: 'Beklenmeyen API yanıt formatı'
      };
    }
  } catch (error) {
    console.error(`[eventService] Error fetching events for hobby ${hobbyId}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || 'Hobi etkinlikleri yüklenirken bir hata oluştu'
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
    console.log(`[eventService] Joining event with ID: ${eventId}`);
    const response = await api.put(`/events/${eventId}/join`);
    
    if (response.data && response.data.success) {
      return response.data;
    } else if (response.data) {
      return {
        success: true,
        message: response.data.message || 'Etkinliğe başarıyla katıldınız',
        data: response.data
      };
    } else {
      console.error('[eventService] Invalid response format:', response.data);
      return {
        success: false,
        message: 'Beklenmeyen API yanıt formatı'
      };
    }
  } catch (error) {
    console.error(`[eventService] Error joining event ${eventId}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || 'Etkinliğe katılırken bir hata oluştu'
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
    console.log(`[eventService] Leaving event with ID: ${eventId}`);
    const response = await api.put(`/events/${eventId}/leave`);
    
    if (response.data && response.data.success) {
      return response.data;
    } else if (response.data) {
      return {
        success: true,
        message: response.data.message || 'Etkinlikten başarıyla ayrıldınız',
        data: response.data
      };
    } else {
      console.error('[eventService] Invalid response format:', response.data);
      return {
        success: false,
        message: 'Beklenmeyen API yanıt formatı'
      };
    }
  } catch (error) {
    console.error(`[eventService] Error leaving event ${eventId}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || 'Etkinlikten ayrılırken bir hata oluştu'
    };
  }
};

// Kullanıcının hobilerine göre önerilen etkinlikleri getir
export const getRecommendedEvents = async (page = 1, limit = 4, city = null) => {
  try {
    console.log(`[eventService] Fetching recommended events based on user hobbies - page: ${page}, limit: ${limit}, city: ${city || 'Not specified'}`);
    
    // Kimlik doğrulama kontrolü
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('[eventService] No token found, cannot fetch personalized recommendations');
      return {
        success: false,
        message: 'Kişiselleştirilmiş öneriler için lütfen giriş yapın'
      };
    }
    
    // API'den önerilen etkinlikleri getir
    // URL parametrelerini oluştur
    let url = `/events/recommended?page=${page}&limit=${limit}`;
    
    // Şehir parametresi (eğer belirtilmişse)
    if (city) {
      url += `&city=${encodeURIComponent(city)}`;
      console.log(`[eventService] Adding city filter: ${city}`);
    }
    
    // İsteği gönder
    const response = await api.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Yanıt başarılı ise detaylı log göster
    if (response.data && (response.data.success || Array.isArray(response.data))) {
      const eventData = response.data.data || response.data;
      const totalEvents = Array.isArray(eventData) ? eventData.length : 0;
      
      console.log(`[eventService] Successfully fetched ${totalEvents} recommended events`);
      
      // İl bazlı filtreleme yapılmış mı kontrol et
      if (response.data.message && response.data.message.includes('ilinizdeki')) {
        console.log('[eventService] Events filtered by user province:', response.data.message);
      }
      
      // İlk birkaç etkinliğin hobi ve konum bilgisini göster
      if (totalEvents > 0) {
        const sampleEvents = eventData.slice(0, Math.min(3, totalEvents));
        console.log('[eventService] Sample recommended events:', 
          sampleEvents.map(event => ({
            id: event._id,
            title: event.title,
            hobby: event.hobby?.name || 'No hobby',
            category: event.hobby?.category || 'No category',
            location: event.location?.address || 'No location'
          }))
        );
      }
    }
    
    // Yanıt formatlarını ele al (başarılı olması durumunda)
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
      console.error('[eventService] Invalid response format:', response.data);
      return {
        success: false,
        message: 'Beklenmeyen API yanıt formatı'
      };
    }
  } catch (error) {
    console.error('[eventService] Error fetching recommended events:', error);
    console.error('[eventService] Error details:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Önerilen etkinlikler yüklenirken bir hata oluştu'
    };
  }
}; 