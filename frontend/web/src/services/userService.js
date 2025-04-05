import axios from 'axios';

const API_URL = '/api/users';

// Axios instance
const axiosInstance = axios.create();

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Kullanıcı profil bilgilerini getirir
 * @returns {Promise<Object>}
 */
export const getUserProfile = async () => {
  try {
    const response = await axiosInstance.get(`${API_URL}/profile`);
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Kullanıcı profilini günceller
 * @param {Object} userData - Güncellenecek kullanıcı bilgileri
 * @returns {Promise<Object>}
 */
export const updateUserProfile = async (userData) => {
  try {
    const response = await axiosInstance.put(`${API_URL}/profile`, userData);
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Kullanıcı şifresini değiştirir
 * @param {Object} passwordData - Şifre değiştirme verileri
 * @returns {Promise<Object>}
 */
export const changePassword = async (passwordData) => {
  try {
    const response = await axiosInstance.put(`${API_URL}/change-password`, passwordData);
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Kullanıcı profil resmi yükler
 * @param {FormData} formData - Yüklenecek resim bilgisi
 * @returns {Promise<Object>}
 */
export const uploadProfilePicture = async (formData) => {
  try {
    const response = await axiosInstance.post(`${API_URL}/upload-profile-picture`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Kullanıcıyı takip eder
 * @param {string} userId - Takip edilecek kullanıcı ID
 * @returns {Promise<Object>}
 */
export const followUser = async (userId) => {
  try {
    const response = await axiosInstance.put(`${API_URL}/follow/${userId}`);
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Kullanıcıyı takipten çıkartır
 * @param {string} userId - Takipten çıkarılacak kullanıcı ID
 * @returns {Promise<Object>}
 */
export const unfollowUser = async (userId) => {
  try {
    const response = await axiosInstance.put(`${API_URL}/unfollow/${userId}`);
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Kullanıcının hobilerine göre kullanıcıları getirir
 * @param {string} hobbyId - Hobi ID
 * @returns {Promise<Object>}
 */
export const getUsersByHobby = async (hobbyId) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/hobby/${hobbyId}`);
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Şifre değiştirme isteği oluşturur (şifremi unuttum)
 * @param {Object} emailData - Email bilgisi
 * @returns {Promise<Object>}
 */
export const forgotPassword = async (emailData) => {
  try {
    const response = await axios.post(`${API_URL}/forgot-password`, emailData);
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Şifre sıfırlama tokenını doğrular
 * @param {string} token - Doğrulanacak token
 * @returns {Promise<Object>}
 */
export const validateResetToken = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/validate-reset-token/${token}`);
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Şifreyi sıfırlar
 * @param {Object} passwordData - Şifre sıfırlama bilgileri
 * @returns {Promise<Object>}
 */
export const resetPassword = async (passwordData) => {
  try {
    const response = await axios.post(`${API_URL}/reset-password`, passwordData);
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Kullanıcı adına göre profil bilgilerini getirir
 * @param {string} username - Kullanıcı adı
 * @returns {Promise<Object>}
 */
export const getUserByUsername = async (username) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/profile/${username}`);
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Hata işleme
 * @param {Error} error - Hata nesnesi
 * @returns {Error} - İşlenmiş hata
 */
const handleError = (error) => {
  if (error.response) {
    // Sunucu cevabı ile gelen hata
    const serverError = {
      status: error.response.status,
      data: error.response.data,
      message: error.response.data.message || 'Sunucu hatası'
    };
    return serverError;
  } else if (error.request) {
    // İstek yapıldı ama cevap alınamadı
    return { message: 'Sunucuya erişilemiyor' };
  } else {
    // İstek oluşturulurken hata
    return { message: `İstek hatası: ${error.message}` };
  }
}; 