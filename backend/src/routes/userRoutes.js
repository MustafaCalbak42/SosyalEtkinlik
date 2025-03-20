const express = require('express');
const router = express.Router();
const { check } = require('express-validator');

// Controller fonksiyonları daha sonra oluşturulacak
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile,
  getUsersByHobby,
  followUser,
  unfollowUser
} = require('../controllers/userController');

const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/users/register
// @desc    Kullanıcı kaydı
// @access  Public
router.post(
  '/register',
  [
    check('username', 'Kullanıcı adı zorunludur').not().isEmpty(),
    check('email', 'Geçerli bir email adresi giriniz').isEmail(),
    check('password', 'Şifre en az 6 karakter olmalıdır').isLength({ min: 6 }),
    check('fullName', 'Ad Soyad zorunludur').not().isEmpty()
  ],
  registerUser
);

// @route   POST /api/users/login
// @desc    Kullanıcı girişi
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Geçerli bir email adresi giriniz').isEmail(),
    check('password', 'Şifre zorunludur').exists()
  ],
  loginUser
);

// @route   GET /api/users/profile
// @desc    Kullanıcı profili getir
// @access  Private
router.get('/profile', protect, getUserProfile);

// @route   PUT /api/users/profile
// @desc    Kullanıcı profilini güncelle
// @access  Private
router.put('/profile', protect, updateUserProfile);

// @route   GET /api/users/hobby/:hobbyId
// @desc    Hobiye göre kullanıcıları getir
// @access  Private
router.get('/hobby/:hobbyId', protect, getUsersByHobby);

// @route   PUT /api/users/follow/:userId
// @desc    Kullanıcıyı takip et
// @access  Private
router.put('/follow/:userId', protect, followUser);

// @route   PUT /api/users/unfollow/:userId
// @desc    Kullanıcıyı takipten çık
// @access  Private
router.put('/unfollow/:userId', protect, unfollowUser);

module.exports = router; 