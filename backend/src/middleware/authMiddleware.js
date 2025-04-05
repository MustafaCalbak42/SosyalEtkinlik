const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken } = require('../config/jwt');

/**
 * JWT token ile kullanıcı kimlik doğrulama middleware'i
 * @param {Object} req - Request nesnesi
 * @param {Object} res - Response nesnesi
 * @param {Function} next - Sonraki middleware'e geçiş
 */
const protect = async (req, res, next) => {
  let token;

  // Token'ı Authorization header'dan al
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Token'ı ayır
      token = req.headers.authorization.split(' ')[1];

      // Token'ı doğrula (güncellenmiş verifyToken fonksiyonunu kullan)
      const decoded = verifyToken(token);
      
      if (!decoded.success) {
        // Token doğrulama hatası
        if (decoded.error === 'JsonWebTokenError') {
          return res.status(401).json({ 
            success: false,
            message: 'Geçersiz token' 
          });
        }
        
        if (decoded.error === 'TokenExpiredError') {
          return res.status(401).json({ 
            success: false,
            message: 'Token süresi doldu, lütfen tekrar giriş yapın' 
          });
        }
        
        return res.status(401).json({ 
          success: false,
          message: 'Kimlik doğrulama başarısız' 
        });
      }

      // Token'daki kullanıcı bilgilerini al
      req.user = await User.findById(decoded.data.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ 
          success: false,
          message: 'Geçersiz token - Kullanıcı bulunamadı' 
        });
      }

      // Kullanıcının aktif olup olmadığını kontrol et
      if (!req.user.isActive) {
        return res.status(403).json({ 
          success: false,
          message: 'Hesabınız devre dışı bırakılmış' 
        });
      }

      // Son aktivite zamanını güncelle (her 5 dakikada bir)
      const now = new Date();
      const lastActive = new Date(req.user.lastActive);
      const fiveMinutes = 5 * 60 * 1000;

      if (now - lastActive > fiveMinutes) {
        // Sadece zamanlama farkı varsa güncelle, gereksiz veritabanı işlemi yapma
        await User.findByIdAndUpdate(req.user._id, { lastActive: now });
      }

      next();
    } catch (error) {
      console.error('Token doğrulama hatası:', error);
      res.status(401).json({ 
        success: false,
        message: 'Beklenmeyen bir kimlik doğrulama hatası oluştu' 
      });
    }
  } else {
    // Token bulunamadı
    return res.status(401).json({ 
      success: false,
      message: 'Token bulunamadı, erişim engellendi' 
    });
  }
};

/**
 * Admin yetki kontrolü middleware'i
 * @param {Object} req - Request nesnesi
 * @param {Object} res - Response nesnesi
 * @param {Function} next - Sonraki middleware'e geçiş
 */
const admin = (req, res, next) => {
  // protect middleware'i zaten req.user'ı doldurmuş olmalı
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ 
      success: false,
      message: 'Admin yetkisi gerekiyor' 
    });
  }
};

module.exports = { protect, admin }; 