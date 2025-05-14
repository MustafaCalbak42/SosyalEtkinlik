import axios from 'axios';

// API URL
const API_URL = 'http://localhost:5000/api/hobbies';

/**
 * Tüm hobileri getir
 * @returns {Promise} - API yanıtı
 */
export const getAllHobbies = async () => {
  try {
    console.log('[hobbyService] Attempting to get all hobbies');
    const token = localStorage.getItem('token');
    console.log('[hobbyService] Token exists:', !!token);
    
    const response = await axios.get(API_URL, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('[hobbyService] Hobbies API response:', response.data);
    
    // Response formatı kontrol edilir
    if (response.data && typeof response.data === 'object') {
      // Backend'in döndürdüğü success/message/data formatı
      if (response.data.success !== undefined && Array.isArray(response.data.data)) {
        console.log('[hobbyService] Standardized API response format with data array');
        return response.data; // {success, message, data} formatında
      }
      // Backend direk hobi dizisini döndürmüş
      else if (Array.isArray(response.data)) {
        console.log('[hobbyService] Plain array response format');
        return {
          success: true,
          message: 'Hobiler başarıyla alındı',
          data: response.data
        };
      }
      // Belirsiz veya boş yanıt
      else {
        console.warn('[hobbyService] Unknown response format:', response.data);
        return {
          success: true,
          message: 'Hobiler alındı, ancak format beklenen gibi değil',
          data: response.data.hobbies || response.data.data || response.data || []
        };
      }
    } else {
      // Veri yok veya beklenen formatta değil
      console.error('[hobbyService] Invalid data format:', response.data);
      return {
        success: false,
        message: 'Hobi verileri geçerli bir formatta değil',
        data: []
      };
    }
  } catch (error) {
    console.error('[hobbyService] Error getting hobbies:', error);
    console.error('[hobbyService] Error response:', error.response?.data);
    console.error('[hobbyService] Error status:', error.response?.status);
    
    const errorMessage = error.response?.data?.message || error.message || 'Hobiler alınırken bir hata oluştu';
    
    return {
      success: false,
      message: errorMessage,
      data: []
    };
  }
};

/**
 * Belirli bir hobi kategorisine göre hobileri getir
 * @param {string} category - Hobi kategorisi
 * @returns {Promise} - API yanıtı
 */
export const getHobbiesByCategory = async (category) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/category/${category}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && response.data.success !== undefined) {
      return response.data;
    } else if (Array.isArray(response.data)) {
      return {
        success: true,
        message: `${category} kategorisindeki hobiler başarıyla alındı`,
        data: response.data
      };
    }
    
    return response.data;
  } catch (error) {
    console.error(`[hobbyService] ${category} kategorisindeki hobiler alınırken hata:`, error);
    throw new Error(error.response?.data?.message || 'Kategoriye göre hobiler alınırken bir hata oluştu');
  }
};

/**
 * ID'ye göre hobi bilgilerini getir
 * @param {string} id - Hobi ID'si
 * @returns {Promise} - API yanıtı
 */
export const getHobbyById = async (id) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`[hobbyService] ID'si ${id} olan hobi alınırken hata:`, error);
    throw new Error(error.response?.data?.message || 'Hobi bilgileri alınırken bir hata oluştu');
  }
};

/**
 * ID'ye göre hobiye sahip kullanıcıları getir
 * @param {string} id - Hobi ID'si
 * @returns {Promise} - API yanıtı
 */
export const getUsersByHobby = async (id) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/${id}/users`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`[hobbyService] ID'si ${id} olan hobiye ait kullanıcılar alınırken hata:`, error);
    throw new Error(error.response?.data?.message || 'Hobiye sahip kullanıcılar alınırken bir hata oluştu');
  }
};

const hobbyService = {
  getAllHobbies,
  getHobbiesByCategory,
  getHobbyById,
  getUsersByHobby
};

export default hobbyService; 