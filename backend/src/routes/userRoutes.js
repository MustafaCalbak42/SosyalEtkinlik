const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const User = require('../models/User');

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
  resendVerificationEmail,
  getUserParticipatedEvents,
  getUserCreatedEvents,
  getUserById,
  getAllUsers,
  getSimilarUsers
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
    // Kayıt sırasında kullanıcı ID'si henüz yok, o yüzden timestamp ve random string kullanıyoruz
    const userId = req.user ? req.user.id : 'temp';
    const randomString = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now();
    cb(null, `profile-${userId}-${timestamp}-${randomString}${path.extname(file.originalname)}`);
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
router.post('/register', upload.single('profilePicture'), registerValidation, registerUser);

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
 * @route   POST /api/users/verify-email
 * @desc    E-posta doğrulama
 * @access  Public
 */
router.post('/verify-email', verifyEmail);

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
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);

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
router.post('/reset-password', resetPasswordValidation, resetPassword);

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

/**
 * @route   GET /api/users/participated-events
 * @desc    Kullanıcının katıldığı etkinlikleri getir
 * @access  Private
 */
router.get('/participated-events', protect, getUserParticipatedEvents);

/**
 * @route   GET /api/users/created-events
 * @desc    Kullanıcının oluşturduğu etkinlikleri getir
 * @access  Private
 */
router.get('/created-events', protect, getUserCreatedEvents);

/**
 * @route   GET /api/users/similar
 * @desc    Benzer hobilere sahip kullanıcıları getir
 * @access  Private
 */
router.get('/similar', protect, getSimilarUsers);

/**
 * @route   GET /api/users/all
 * @desc    Tüm kullanıcıları getir
 * @access  Private
 */
router.get('/all', protect, getAllUsers);

/**
 * @route   GET /api/users
 * @desc    Tüm kullanıcıları getir (alternatif endpoint)
 * @access  Private
 */
router.get('/', protect, getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Kullanıcı bilgilerini ID ile getir
 * @access  Public
 */
router.get('/:id', async (req, res, next) => {
  try {
    console.log('[userRoutes] GET /:id route called with id:', req.params.id);
    
    // Check if it's a valid MongoDB ObjectId
    const mongoose = require('mongoose');
    const isValidObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    
    // If not a valid ObjectId, first try to find by username
    if (!isValidObjectId) {
      console.log('[userRoutes] Not a valid ObjectId, trying username');
      const user = await User.findOne({ username: req.params.id })
        .select('-password')
        .populate('hobbies', 'name category description');
      
      if (user) {
        console.log('[userRoutes] User found by username');
        return res.json({
          success: true,
          data: user
        });
      }
      
      console.log('[userRoutes] User not found by username, continuing to getUserById');
    }
    
    // Continue to the controller handler
    return getUserById(req, res, next);
  } catch (error) {
    console.error('[userRoutes] Error in user lookup:', error);
    next(error);
  }
});

module.exports = router; 