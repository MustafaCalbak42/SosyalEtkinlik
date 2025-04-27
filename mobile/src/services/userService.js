import api from '../shared/api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Kullanıcı giriş işlemi yapar
 * @param {Object} loginData - Giriş bilgileri (email, password)
 * @returns {Promise<Object>}
 */
export const loginUser = async (loginData) => {
  try {
    const response = await api.auth.login(loginData);
    
    // Token'ları AsyncStorage'a kaydet
    if (response.data && response.data.success && response.data.data.token) {
      await AsyncStorage.setItem('token', response.data.data.token);
      await AsyncStorage.setItem('refreshToken', response.data.data.refreshToken);
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
    // Form verilerini işle
    let processedData = { ...registerData };
    
    // Hobi verilerini işle - Eğer hobiler varsa yalnızca ID'lerini gönder
    if (registerData.hobbies && Array.isArray(registerData.hobbies)) {
      // Hobi objelerini ID'lere dönüştür
      processedData.hobbies = registerData.hobbies.map(hobby => 
        typeof hobby === 'object' && hobby._id ? hobby._id : hobby
      );
    }
    
    // İlgi alanlarını işle
    if (!registerData.interests) {
      processedData.interests = [];
    }
    
    // Biyografiyi kontrol et
    if (!registerData.bio) {
      processedData.bio = '';
    }
    
    // Şehir bilgisini konum nesnesine dönüştür
    if (registerData.city) {
      processedData.location = {
        address: registerData.city,
        // Gerçek koordinatlar API tarafında hesaplanabilir
        coordinates: [0, 0]
      };
    }
    
    const response = await api.auth.register(processedData);
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Kullanıcı çıkış işlemi
 */
export const logoutUser = async () => {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('refreshToken');
  await AsyncStorage.removeItem('userData');
};

/**
 * Token'ın geçerli olup olmadığını kontrol eder
 * @returns {Promise<boolean>}
 */
export const isAuthenticated = async () => {
  const token = await AsyncStorage.getItem('token');
  return !!token;
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

export default {
  loginUser,
  registerUser,
  logoutUser,
  isAuthenticated
}; 