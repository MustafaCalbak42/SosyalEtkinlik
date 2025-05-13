import api from '../shared/api';

// Tüm etkinlikleri getir
export const getAllEvents = async () => {
  try {
    console.log('[eventService] Fetching all events...');
    const response = await api.get('/events');
    
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