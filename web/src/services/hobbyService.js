import axios from 'axios';

// API URL
const API_URL = '/api/hobbies';

/**
 * Tüm hobileri getir
 * @returns {Promise} - API yanıtı
 */
export const getAllHobbies = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Hobiler alınırken bir hata oluştu');
  }
};

/**
 * Belirli bir hobi kategorisine göre hobileri getir
 * @param {string} category - Hobi kategorisi
 * @returns {Promise} - API yanıtı
 */
export const getHobbiesByCategory = async (category) => {
  try {
    const response = await axios.get(`${API_URL}/category/${category}`);
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
    const response = await axios.get(`${API_URL}/${id}`);
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
    const response = await axios.get(`/api/users/hobby/${id}`);
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