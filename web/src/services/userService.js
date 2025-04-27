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
 * Kullanıcı giriş işlemi yapar
 * @param {Object} loginData - Giriş bilgileri (email, password)
 * @returns {Promise<Object>}
 */
export const loginUser = async (loginData) => {
  try {
    const response = await axios.post(`${API_URL}/login`, loginData);
    
    // Token'ı localStorage'a kaydet
    if (response.data.success && response.data.data && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
    }
    
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Kullanıcı kaydı yapar
 * @param {Object} registerData - Kayıt bilgileri
 * @returns {Promise<Object>}
 */
export const registerUser = async (registerData) => {
  try {
    // Hobi verilerini işle - Eğer hobiler varsa yalnızca ID'lerini gönder
    let processedData = { ...registerData };
    
    if (registerData.hobbies && Array.isArray(registerData.hobbies)) {
      // Hobi objelerini ID'lere dönüştür
      processedData.hobbies = registerData.hobbies.map(hobby => 
        typeof hobby === 'object' && hobby._id ? hobby._id : hobby
      );
    }
    
    // Şehir bilgisini konum nesnesine dönüştür
    if (registerData.city) {
      processedData.location = {
        address: registerData.city,
        // Gerçek koordinatlar API tarafında hesaplanabilir
        // Şimdilik varsayılan değerler gönderelim
        coordinates: [0, 0]
      };
      
      // Frontend'de kullanılan city alanını kaldır (backend'de yok)
      delete processedData.city;
    }
    
    const response = await axios.post(`${API_URL}/register`, processedData);
    
    // Not: Kayıt sonrası token oluşmadığı için localStorage'a kaydetmiyoruz
    // Önce e-posta doğrulanması gerekiyor
    
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * E-posta doğrulama işlemi için yeni bağlantı gönderir
 * @param {Object} emailData - E-posta bilgisi
 * @returns {Promise<Object>}
 */
export const resendVerificationEmail = async (emailData) => {
  try {
    console.log("Resending verification email to:", emailData.email);
    const response = await axios.post(`${API_URL}/resend-verification`, emailData);
    
    // API yanıtını kontrol et
    if (response.data) {
      // Test modunda ise ve response.developerInfo varsa, bu bilgiyi döndür
      if (response.data.developerInfo && response.data.developerInfo.emailPreviewUrl) {
        console.log("Email preview URL:", response.data.developerInfo.emailPreviewUrl);
        return {
          success: true,
          message: "Doğrulama e-postası gönderildi",
          data: {
            testEmailUrl: response.data.developerInfo.emailPreviewUrl
          }
        };
      }
      
      // API yanıtı başarılı mı?
      if (response.data.success) {
        return response.data;
      } else {
        // API başarısız yanıt döndü
        console.error("API error:", response.data.message);
        return {
          success: false,
          message: response.data.message || "Doğrulama e-postası gönderilemedi"
        };
      }
    } else {
      // Yanıt beklenen formatta değil
      return {
        success: false,
        message: "Beklenmeyen sunucu yanıtı"
      };
    }
  } catch (error) {
    console.error("Request error:", error);
    throw handleError(error);
  }
};

/**
 * Kullanıcı çıkış işlemi
 */
export const logoutUser = () => {
  localStorage.removeItem('token');
};

/**
 * Token'ın geçerli olup olmadığını kontrol eder
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

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
 * Şifre sıfırlama isteği oluşturur (şifremi unuttum)
 * @param {Object} emailData - Email bilgisi
 * @returns {Promise<Object>}
 */
export const forgotPassword = async (emailData) => {
  try {
    console.log('Şifre sıfırlama isteği gönderiliyor:', emailData);
    const response = await axios.post(`${API_URL}/forgot-password`, emailData);
    console.log('Şifre sıfırlama cevabı:', response.data);
    return response.data;
  } catch (error) {
    console.error('Şifre sıfırlama hatası:', error);
    throw handleError(error);
  }
};

/**
 * Şifre sıfırlama kodunu doğrular
 * @param {Object} data - Kod doğrulama verileri (email, code)
 * @returns {Promise<Object>}
 */
export const verifyResetCode = async (data) => {
  try {
    console.log('Kod doğrulama isteği gönderiliyor:', data);
    const response = await axios.post(`${API_URL}/verify-reset-code`, data);
    console.log('Kod doğrulama cevabı:', response.data);
    return response.data;
  } catch (error) {
    console.error('Kod doğrulama hatası:', error);
    throw handleError(error);
  }
};

/**
 * Şifre sıfırlama token'ını doğrular
 * @param {string} token - Şifre sıfırlama token'ı
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
 * @param {Object} data - Şifre sıfırlama verileri (email, code, password)
 * @returns {Promise<Object>}
 */
export const resetPassword = async (data) => {
  try {
    console.log('Şifre yenileme isteği gönderiliyor:', {...data, password: '******'});
    const response = await axios.post(`${API_URL}/reset-password`, data);
    console.log('Şifre yenileme cevabı:', response.data);
    return response.data;
  } catch (error) {
    console.error('Şifre yenileme hatası:', error);
    throw handleError(error);
  }
};

/**
 * Kullanıcı adına göre kullanıcı profilini getirir
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
 * API hata işleme
 * @param {Error} error - Axios hatası
 * @returns {Error} - İşlenmiş hata
 */
const handleError = (error) => {
  if (error.response) {
    // Sunucu yanıtı hatası
    const errorMessage = error.response.data.message || error.response.statusText;
    const customError = new Error(errorMessage);
    customError.status = error.response.status;
    customError.data = error.response.data;
    return customError;
  } else if (error.request) {
    // İstek yapıldı ama yanıt alınamadı
    return new Error('Sunucudan yanıt alınamadı. Lütfen internet bağlantınızı kontrol edin.');
  } else {
    // İstek yapılırken bir hata oluştu
    return error;
  }
}; 