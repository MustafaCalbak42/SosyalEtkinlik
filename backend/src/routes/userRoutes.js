const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

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
  getUserByUsername
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
 * @route   POST /api/users/forgot-password
 * @desc    Şifre sıfırlama isteği oluştur
 * @access  Public
 */
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);

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

module.exports = router; 