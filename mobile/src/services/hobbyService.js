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
      throw new Error('Sunucudan yanıt alınamadı');
    }
    
    if (response.status === 404) {
      throw new Error('Hobiler bulunamadı');
    }
    
    if (response.status >= 400) {
      throw new Error(response.data?.message || 'Hobiler alınırken bir hata oluştu');
    }
    
    // Response formatı kontrol edilir
    if (response.data && typeof response.data === 'object') {
      // Backend'in döndürdüğü success/message/data formatı
      if (response.data.success !== undefined && Array.isArray(response.data.data)) {
        console.log('Standart API yanıt formatı (data dizisi)');
        return response.data.data; // Sadece data dizisini dön
      }
      // Backend direk hobi dizisini döndürmüş
      else if (Array.isArray(response.data)) {
        console.log('Düz dizi yanıt formatı');
        return response.data;
      }
      // Belirsiz veya başka bir formatta
      else {
        console.warn('Bilinmeyen yanıt formatı:', response.data);
        return response.data.hobbies || response.data.data || [];
      }
    } else {
      console.error('Geçersiz veri formatı:', response.data);
      throw new Error('Hobiler beklenen formatta değil');
    }
  } catch (error) {
    console.error('Hobiler alınırken hata:', error);
    throw new Error(error.message || 'Hobiler alınırken bir hata oluştu');
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