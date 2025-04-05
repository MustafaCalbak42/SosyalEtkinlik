/**
 * JWT Konfigürasyon Dosyası
 * Kimlik doğrulama için JWT ayarları
 */

const jwt = require('jsonwebtoken');

/**
 * JWT token oluşturma
 * @param {Object} payload - Token içine gömülecek veri
 * @param {string} expiresIn - Token geçerlilik süresi
 * @returns {string} - Oluşturulan token
 */
const generateToken = (payload, expiresIn = '30d') => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

/**
 * JWT token doğrulama
 * @param {string} token - Doğrulanacak token
 * @returns {Object} - Token payload'ı veya hata
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return {
      success: true,
      data: decoded
    };
  } catch (error) {
    return {
      success: false,
      error: error.name,
      message: error.message
    };
  }
};

/**
 * JWT yenileme token'ı oluşturma
 * @param {string} userId - Kullanıcı ID'si
 * @returns {string} - Oluşturulan yenileme token'ı
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
    { expiresIn: '7d' }
  );
};

/**
 * JWT yenileme token'ı doğrulama
 * @param {string} refreshToken - Doğrulanacak yenileme token'ı
 * @returns {Object} - Token payload'ı veya hata
 */
const verifyRefreshToken = (refreshToken) => {
  try {
    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh'
    );
    return {
      success: true,
      data: decoded
    };
  } catch (error) {
    return {
      success: false,
      error: error.name,
      message: error.message
    };
  }
};

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken,
  verifyRefreshToken
}; 