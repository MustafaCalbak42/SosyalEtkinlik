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
    
    if (response.data.success && response.data.data) {
      // Token'ı AsyncStorage'a kaydet
      if (response.data.data.token) {
        await AsyncStorage.setItem('token', response.data.data.token);
      }
      
      if (response.data.data.refreshToken) {
        await AsyncStorage.setItem('refreshToken', response.data.data.refreshToken);
      }
      
      // Kullanıcı bilgilerini kaydet
      await AsyncStorage.setItem('user', JSON.stringify(response.data.data));
    }
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
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
 * Şifre sıfırlama isteği oluşturur (şifremi unuttum)
 * @param {Object} emailData - Email bilgisi
 * @returns {Promise<Object>}
 */
export const forgotPassword = async (emailData) => {
  try {
    console.log('Şifre sıfırlama isteği gönderiliyor:', emailData);
    const response = await api.auth.forgotPassword(emailData);
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
    const response = await api.auth.verifyResetCode(data);
    console.log('Kod doğrulama cevabı:', response.data);
    return response.data;
  } catch (error) {
    console.error('Kod doğrulama hatası:', error);
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
    const response = await api.auth.resetPassword(data);
    console.log('Şifre yenileme cevabı:', response.data);
    
    // Otomatik giriş için token varsa kaydet
    if (response.data.success && response.data.data) {
      if (response.data.data.token) {
        await AsyncStorage.setItem('token', response.data.data.token);
      }
      
      if (response.data.data.refreshToken) {
        await AsyncStorage.setItem('refreshToken', response.data.data.refreshToken);
      }
      
      // Kullanıcı bilgilerini kaydet
      await AsyncStorage.setItem('user', JSON.stringify(response.data.data));
    }
    
    return response.data;
  } catch (error) {
    console.error('Şifre yenileme hatası:', error);
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

export default {
  loginUser,
  registerUser,
  logoutUser,
  isAuthenticated,
  forgotPassword,
  verifyResetCode,
  resetPassword
}; 