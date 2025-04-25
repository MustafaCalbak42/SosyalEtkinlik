import api from '../shared/api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Kullanıcı giriş işlemi
 * @param {Object} credentials - Giriş bilgileri (email, password)
 * @returns {Promise<Object>}
 */
export const login = async (credentials) => {
  try {
    const response = await api.auth.login(credentials);
    
    // Başarılı giriş durumunda token ve kullanıcı bilgilerini kaydet
    if (response.data.success) {
      const { token, refreshToken } = response.data.data;
      
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.data));
    }
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Kullanıcı çıkış işlemi
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('user');
    return { success: true };
  } catch (error) {
    throw error;
  }
};

/**
 * Mevcut kullanıcı kontrolü
 * @returns {Promise<Object>} Kullanıcı bilgileri veya null
 */
export const getCurrentUser = async () => {
  try {
    const userJson = await AsyncStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Şifremi unuttum işlemi
 * @param {Object} emailData - E-posta bilgisi
 * @returns {Promise<Object>}
 */
export const forgotPassword = async (emailData) => {
  try {
    const response = await api.auth.forgotPassword(emailData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Şifre sıfırlama kodu doğrulama
 * @param {Object} verificationData - Doğrulama bilgileri (email, code)
 * @returns {Promise<Object>}
 */
export const verifyResetCode = async (verificationData) => {
  try {
    const response = await api.auth.verifyResetCode(verificationData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Şifre sıfırlama
 * @param {Object} passwordData - Şifre bilgileri (email, verificationId, newPassword)
 * @returns {Promise<Object>}
 */
export const resetPassword = async (passwordData) => {
  try {
    const response = await api.auth.resetPassword(passwordData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Doğrulama e-postasını yeniden gönder
 * @param {Object} emailData - E-posta bilgisi
 * @returns {Promise<Object>}
 */
export const resendVerificationEmail = async (emailData) => {
  try {
    const response = await api.auth.resendVerification(emailData);
    return response.data;
  } catch (error) {
    throw error;
  }
}; 