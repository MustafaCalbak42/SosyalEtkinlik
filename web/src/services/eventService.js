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

// Etkinliğe katıl
export const joinEvent = async (eventId) => {
  try {
    console.log(`[eventService] Joining event with ID: ${eventId}`);
    const response = await api.put(`/events/${eventId}/join`);
    
    if (response.data && response.data.success) {
      return response.data;
    } else if (response.data) {
      return {
        success: true,
        message: response.data.message || 'Etkinliğe başarıyla katıldınız'
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

// Etkinliğe katılımdan çık
export const leaveEvent = async (eventId) => {
  try {
    console.log(`[eventService] Leaving event with ID: ${eventId}`);
    const response = await api.put(`/events/${eventId}/leave`);
    
    if (response.data && response.data.success) {
      return response.data;
    } else if (response.data) {
      return {
        success: true,
        message: response.data.message || 'Etkinlikten başarıyla ayrıldınız'
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
export const getRecommendedEvents = async (page = 1, limit = 4) => {
  try {
    console.log(`[eventService] Fetching recommended events based on user hobbies - page: ${page}, limit: ${limit}`);
    
    // Kimlik doğrulama kontrolü
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('[eventService] No token found, cannot fetch personalized recommendations');
      return {
        success: false,
        message: 'Kişiselleştirilmiş öneriler için lütfen giriş yapın'
      };
    }
    
    const response = await api.get(`/events/recommended?page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
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
    return {
      success: false,
      message: error.response?.data?.message || 'Önerilen etkinlikler yüklenirken bir hata oluştu'
    };
  }
}; 