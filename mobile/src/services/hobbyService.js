import api from '../shared/api/apiClient';

/**
 * Tüm hobileri getir
 * @returns {Promise} - API yanıtı
 */
export const getAllHobbies = async () => {
  try {
    console.log('Hobiler getiriliyor...');
    const response = await api.hobbies.getAll();
    console.log('Hobiler API yanıtı:', response);
    
    if (!response) {
      console.error('Sunucudan yanıt alınamadı');
      throw new Error('Sunucudan yanıt alınamadı');
    }
    
    // Backend'in döndürdüğü yanıt formatını doğrudan döndür
    if (response.data) {
      console.log('API yanıtından data dönüyorum:', typeof response.data);
      return response.data;
    }
    
    console.warn('Beklenmeyen API yanıt formatı:', response);
    throw new Error('Hobiler beklenen formatta değil');
  } catch (error) {
    console.error('Hobiler alınırken hata:', error);
    throw error;
  }
};

/**
 * Belirli bir hobi kategorisine göre hobileri getir
 * @param {string} category - Hobi kategorisi
 * @returns {Promise} - API yanıtı
 */
export const getHobbiesByCategory = async (category) => {
  try {
    const response = await api.hobbies.getByCategory(category);
    return response.data;
  } catch (error) {
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
    const response = await api.hobbies.getById(id);
    return response.data;
  } catch (error) {
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
    const response = await api.hobbies.getUsersByHobby(id);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Hobiye sahip kullanıcılar alınırken bir hata oluştu');
  }
};

export default {
  getAllHobbies,
  getHobbiesByCategory,
  getHobbyById,
  getUsersByHobby
}; 