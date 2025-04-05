const express = require('express');
const router = express.Router();

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
  validateResetToken
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