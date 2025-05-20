import axios from 'axios';

// Create a dynamic API URL that works in both development and production
const getApiUrl = () => {
  // If we're in development, use localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000/api/users';
  }
  
  // For production, get the hostname dynamically
  const hostname = window.location.hostname;
  
  // If running on localhost but in production build
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api/users';
  }
  
  // For actual production deployment
  return `${window.location.protocol}//${hostname}/api/users`;
};

const API_URL = getApiUrl();
console.log('API URL initialized as:', API_URL);

// Axios instance
const axiosInstance = axios.create({
  // Increase timeout for slow connections
  timeout: 30000
});

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
    console.log('Kullanıcı kaydı başlatılıyor, gelen veriler:', registerData);
    
    // Hobi verilerini işle - Eğer hobiler varsa yalnızca ID'lerini gönder
    let processedData = { ...registerData };
    
    if (registerData.hobbies && Array.isArray(registerData.hobbies)) {
      // Hobi objelerini ID'lere dönüştür
      processedData.hobbies = registerData.hobbies.map(hobby => {
        console.log('İşlenen hobi:', hobby);
        
        if (typeof hobby === 'object' && hobby._id) {
          return hobby._id;
        } else if (typeof hobby === 'string') {
          // Özel hobiler için string değeri doğrudan kullan
          return hobby;
        } else if (hobby && hobby.toString) {
          // Başka türlü bir değerse string'e dönüştür
          return hobby.toString();
        }
        
        return null;
      }).filter(id => id !== null); // Null değerleri filtrele
      
      console.log('İşlenmiş hobiler:', processedData.hobbies);
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
    
    console.log('Sunucuya gönderilecek veriler:', processedData);
    
    const response = await axios.post(`${API_URL}/register`, processedData);
    
    console.log('Sunucu yanıtı:', response.data);
    
    // Not: Kayıt sonrası token oluşmadığı için localStorage'a kaydetmiyoruz
    // Önce e-posta doğrulanması gerekiyor
    
    return response.data;
  } catch (error) {
    console.error('Kayıt hatası:', error);
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
    console.log('[userService] Attempting to get user profile');
    const token = localStorage.getItem('token');
    console.log('[userService] Token exists:', !!token);
    
    // Token yoksa hata döndür
    if (!token) {
      console.error('[userService] No token available for getUserProfile');
      return { success: false, message: 'No authentication token available' };
    }
    
    // Manuel olarak Authorization header'ı ekle
    const response = await axiosInstance.get(`${API_URL}/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('[userService] getUserProfile response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[userService] getUserProfile error:', error.response?.data || error.message);
    
    // Token geçersizse temizle
    if (error.response?.status === 401) {
      console.warn('[userService] Clearing invalid token');
      localStorage.removeItem('token');
    }
    
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
    const response = await axios.post(`${API_URL}/forgot-password`, emailData, {
      timeout: 30000, // Timeout değerini 30 saniyeye artır
      headers: {
        'Content-Type': 'application/json'
      }
    });
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
    const response = await axios.post(`${API_URL}/verify-reset-code`, data, {
      timeout: 30000, // Timeout değerini 30 saniyeye artır
      headers: {
        'Content-Type': 'application/json'
      }
    });
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
    const response = await axios.post(`${API_URL}/reset-password`, data, {
      timeout: 30000, // Timeout değerini 30 saniyeye artır
      headers: {
        'Content-Type': 'application/json'
      }
    });
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
 * E-posta doğrulama kodunu doğrular ve kullanıcı kaydını tamamlar
 * @param {Object} data - { email, code }
 * @returns {Promise<Object>}
 */
export const verifyEmailCode = async (data) => {
  try {
    console.log('E-posta doğrulama isteği gönderiliyor:', data);
    
    const response = await axios.post(`${API_URL}/verify-email`, data);
    
    console.log('Doğrulama yanıtı:', response.data);
    
    // Doğrulama başarılıysa ve token döndüyse localStorage'a kaydet
    if (response.data.success && response.data.accessToken) {
      localStorage.setItem('token', response.data.accessToken);
      
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
      
      console.log('Doğrulama başarılı, token ve kullanıcı kaydedildi');
    }
    
    return response.data;
  } catch (error) {
    console.error('E-posta doğrulama hatası:', error);
    
    if (error.response?.data) {
      return {
        success: false,
        message: error.response.data.message || 'Doğrulama işlemi başarısız oldu'
      };
    }
    
    throw handleError(error);
  }
};

/**
 * Kullanıcının katıldığı etkinlikleri getirir
 * @returns {Promise<Object>}
 */
export const getUserParticipatedEvents = async () => {
  try {
    console.log('[userService] Fetching user participated events');
    const response = await axiosInstance.get(`${API_URL}/participated-events`);
    
    if (response.data && response.data.success) {
      return response.data;
    } else {
      console.error('[userService] Invalid response format:', response.data);
      return {
        success: false,
        message: 'Beklenmeyen API yanıt formatı'
      };
    }
  } catch (error) {
    console.error('[userService] Error fetching participated events:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Katılınan etkinlikler yüklenirken bir hata oluştu'
    };
  }
};

/**
 * Kullanıcı bilgilerini ID'ye göre getirir
 * @param {string} userId - Kullanıcı ID'si
 * @returns {Promise<Object>}
 */
export const getUserById = async (userId) => {
  try {
    console.log(`Attempting to fetch user with ID: ${userId}`);
    
    if (!userId) {
      console.error('getUserById: Missing userId parameter');
      return {
        success: false,
        message: 'Kullanıcı ID\'si eksik'
      };
    }
    
    // If userId is an object, extract the ID
    let id = userId;
    
    // Handle object format
    if (typeof userId === 'object') {
      if (userId._id) {
        id = userId._id;
      } else if (userId.id) {
        id = userId.id;
      } else if (userId.user) {
        // Handle cases where it's in participant format
        id = typeof userId.user === 'object' ? userId.user._id : userId.user;
      }
    }
    
    // Convert to string if it's not already
    if (id && typeof id !== 'string') {
      id = id.toString();
    }
    
    // Special handling for MongoDB ObjectId - make sure we're formatting correctly
    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      // Valid MongoDB ObjectId format
      console.log(`ID appears to be a valid MongoDB ObjectId: ${id}`);
    } else {
      console.log(`ID doesn't match MongoDB ObjectId format: ${id}`);
      
      // If clearly not a valid ObjectId, return error early
      if (id && id.length === 24 && !id.match(/^[0-9a-fA-F]{24}$/)) {
        return {
          success: false,
          message: 'Geçersiz kullanıcı ID formatı'
        };
      }
    }
    
    // Log the final ID being used
    console.log(`Making request to ${API_URL}/${id}`);
    
    try {
      const response = await axiosInstance.get(`${API_URL}/${id}`);
      console.log('User data response:', response.data);
      return response.data;
    } catch (requestError) {
      console.error('API request error:', requestError.response?.status, requestError.message);
      
      // Handle 404 specifically
      if (requestError.response?.status === 404) {
        console.log(`User with ID ${id} not found, trying as username`);
        
        // Try a different approach - this might be a username instead of an ID
        try {
          console.log(`Trying as username: ${id}`);
          const profileResponse = await axiosInstance.get(`${API_URL}/profile/${id}`);
          console.log('User profile response:', profileResponse.data);
          return profileResponse.data;
        } catch (profileError) {
          console.error('Profile lookup failed too:', profileError.response?.status);
          
          // If we get a 404 from both endpoints, the user likely doesn't exist
          if (profileError.response?.status === 404) {
            return {
              success: false,
              message: 'Kullanıcı bulunamadı',
              code: 'USER_NOT_FOUND'
            };
          }
          
          return {
            success: false,
            message: 'Kullanıcı bilgisi alınamadı. Lütfen daha sonra tekrar deneyin.',
            code: 'API_ERROR'
          };
        }
      }
      
      // Handle other status codes
      const statusCode = requestError.response?.status;
      let errorMessage = 'Sunucu hatası';
      
      if (statusCode === 401) {
        errorMessage = 'Oturum süresi dolmuş olabilir. Lütfen tekrar giriş yapın.';
      } else if (statusCode === 403) {
        errorMessage = 'Bu kullanıcının profilini görüntüleme izniniz yok.';
      } else if (statusCode === 500) {
        errorMessage = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
      }
      
      return {
        success: false,
        message: requestError.response?.data?.message || errorMessage,
        code: `HTTP_${statusCode || 'UNKNOWN'}`
      };
    }
  } catch (error) {
    console.error('Kullanıcı bilgileri getirme hatası:', error);
    return {
      success: false,
      message: 'Kullanıcı bilgileri işlenirken beklenmedik bir hata oluştu',
      code: 'UNEXPECTED_ERROR'
    };
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