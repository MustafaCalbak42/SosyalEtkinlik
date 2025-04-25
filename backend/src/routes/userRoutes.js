const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const emailService = require('../services/emailService');

// Controller fonksiyonları
const { 
  registerUser, 
  loginUser, 
  refreshToken,
  getUserProfile, 
  updateUserProfile,
  getUsersByHobby,
  followUser,
  unfollowUser,
  changePassword,
  forgotPassword,
  resetPassword,
  validateResetToken,
  uploadProfilePicture,
  getUserByUsername,
  verifyEmail,
  resendVerificationEmail
} = require('../controllers/userController');

// Middleware ve Validatörler
const { protect } = require('../middleware/authMiddleware');
const {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation
} = require('../validators/userValidator');

// Profil resmi yüklemek için Multer konfigürasyonu
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'public/uploads/profiles/');
  },
  filename: function(req, file, cb) {
    cb(null, 'profile-' + req.user.id + '-' + Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Sadece resim dosyalarına izin ver
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Lütfen sadece resim dosyası yükleyin.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB
  },
  fileFilter: fileFilter
});

/**
 * @route   POST /api/users/register
 * @desc    Kullanıcı kaydı
 * @access  Public
 */
router.post('/register', registerValidation, registerUser);

/**
 * @route   POST /api/users/login
 * @desc    Kullanıcı girişi
 * @access  Public
 */
router.post('/login', loginValidation, loginUser);

/**
 * @route   POST /api/users/refresh-token
 * @desc    JWT token yenileme
 * @access  Public
 */
router.post('/refresh-token', refreshToken);

/**
 * @route   GET /api/users/verify-email/:token
 * @desc    E-posta doğrulama
 * @access  Public
 */
router.get('/verify-email/:token', verifyEmail);

/**
 * @route   POST /api/users/resend-verification
 * @desc    Doğrulama e-postasını tekrar gönder
 * @access  Public
 */
router.post('/resend-verification', resendVerificationEmail);

/**
 * @route   POST /api/users/forgot-password
 * @desc    Şifre sıfırlama isteği oluştur
 * @access  Public
 */
router.post('/forgot-password', forgotPasswordValidation, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email adresi gereklidir' 
      });
    }
    
    try {
      // Kullanıcıyı bul
      const User = require('../models/User');
      const user = await User.findOne({ email });
      
      // Kullanıcı bulunamadıysa bile güvenlik nedeniyle başarılı mesajı döndür
      if (!user) {
        console.log('Kullanıcı bulunamadı ama güvenlik için başarılı mesajı döndürülüyor');
        return res.status(200).json({
          success: true,
          message: 'Şifre sıfırlama kodu email adresinize gönderildi'
        });
      }
      
      console.log('Kullanıcı bulundu, şifre sıfırlama email\'i gönderiliyor...');
      
      // Şifre sıfırlama e-postası gönder
      const emailResult = await emailService.sendPasswordResetEmail(
        email,
        'temp-token', // Bu değer artık kullanılmıyor ama fonksiyon imzası için gerekli
        user.fullName
      );

      if (!emailResult.success) {
        console.error('Şifre sıfırlama email gönderimi başarısız:', emailResult.error);
        return res.status(500).json({
          success: false,
          message: 'Email gönderimi sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
          error: emailResult.error
        });
      }

      // Geliştirme ortamında kod bilgisini gönderebiliriz (DEBUG amaçlı)
      const responseData = {
        success: true,
        message: 'Şifre sıfırlama kodu email adresinize gönderildi'
      };
      
      // Sadece geliştirme ortamında debug bilgisini ekle
      if (process.env.NODE_ENV === 'development' && emailResult.resetCode) {
        console.log('Geliştirme ortamı için sıfırlama kodu:', emailResult.resetCode);
        responseData.developerInfo = {
          resetCode: emailResult.resetCode
        };
      }

      return res.status(200).json(responseData);
    } catch (error) {
      console.error('Şifre sıfırlama işlemi sırasında hata:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Şifre sıfırlama isteği işlenirken bir hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } catch (error) {
    console.error('Şifre sıfırlama genel hatası:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/users/verify-reset-code
 * @desc    Şifre sıfırlama kodunu doğrula
 * @access  Public
 */
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email ve doğrulama kodu gereklidir' 
      });
    }
    
    // Verify the code using the emailService 
    const verificationResult = emailService.verifyResetCode(email, code);
    
    if (verificationResult.valid) {
      // Generate a verification ID to use for resetting the password
      const verificationId = crypto.randomBytes(32).toString('hex');
      
      // Return success with verification ID which will be used in the next step
      return res.status(200).json({ 
        success: true, 
        message: 'Kod doğrulandı',
        verificationId
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: verificationResult.message || 'Geçersiz veya süresi dolmuş kod' 
      });
    }
  } catch (error) {
    console.error('Reset code verification error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Doğrulama sırasında bir hata oluştu' 
    });
  }
});

/**
 * @route   POST /api/users/reset-password
 * @desc    Şifre sıfırlama işlemini tamamla
 * @access  Public
 */
router.post('/reset-password', resetPasswordValidation, async (req, res) => {
  try {
    const { email, verificationId, newPassword } = req.body;
    
    if (!email || !verificationId || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tüm alanlar gereklidir' 
      });
    }
    
    // Kullanıcıyı e-posta adresine göre bul
    const User = require('../models/User');
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false, 
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    // Yeni şifreyi belirle
    user.password = newPassword; // Model içinde otomatik hash edilecek
    await user.save();
    
    // Otomatik giriş için token oluştur
    const { generateToken, generateRefreshToken } = require('../config/jwt');
    const accessToken = generateToken({ id: user._id });
    const refreshToken = generateRefreshToken(user._id);
    
    return res.status(200).json({
      success: true,
      message: 'Şifreniz başarıyla sıfırlandı',
      data: {
        _id: user._id,
        email: user.email,
        token: accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Şifre sıfırlama hatası:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Şifre sıfırlama sırasında bir hata oluştu' 
    });
  }
});

/**
 * @route   GET /api/users/validate-reset-token/:token
 * @desc    Şifre sıfırlama token'ını doğrula
 * @access  Public
 */
router.get('/validate-reset-token/:token', validateResetToken);

/**
 * @route   GET /api/users/profile
 * @desc    Kullanıcı profili getir
 * @access  Private
 */
router.get('/profile', protect, getUserProfile);

/**
 * @route   GET /api/users/profile/:username
 * @desc    Kullanıcı adına göre profil getir
 * @access  Private
 */
router.get('/profile/:username', protect, getUserByUsername);

/**
 * @route   PUT /api/users/profile
 * @desc    Kullanıcı profilini güncelle
 * @access  Private
 */
router.put('/profile', protect, updateProfileValidation, updateUserProfile);

/**
 * @route   PUT /api/users/change-password
 * @desc    Kullanıcı şifresini değiştir
 * @access  Private
 */
router.put('/change-password', protect, changePasswordValidation, changePassword);

/**
 * @route   POST /api/users/upload-profile-picture
 * @desc    Profil fotoğrafı yükle
 * @access  Private
 */
router.post('/upload-profile-picture', protect, upload.single('profilePicture'), uploadProfilePicture);

/**
 * @route   GET /api/users/hobby/:hobbyId
 * @desc    Hobiye göre kullanıcıları getir
 * @access  Private
 */
router.get('/hobby/:hobbyId', protect, getUsersByHobby);

/**
 * @route   PUT /api/users/follow/:userId
 * @desc    Kullanıcıyı takip et
 * @access  Private
 */
router.put('/follow/:userId', protect, followUser);

/**
 * @route   PUT /api/users/unfollow/:userId
 * @desc    Kullanıcıyı takipten çık
 * @access  Private
 */
router.put('/unfollow/:userId', protect, unfollowUser);

module.exports = router; 