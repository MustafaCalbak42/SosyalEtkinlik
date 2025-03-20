const express = require('express');
const router = express.Router();
const { check } = require('express-validator');

// Controller fonksiyonları daha sonra oluşturulacak
const {
  createHobby,
  getHobbies,
  getHobbyById,
  updateHobby,
  deleteHobby,
  getHobbyUsers,
  getHobbyEvents
} = require('../controllers/hobbyController');

const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/hobbies
// @desc    Yeni hobi oluştur
// @access  Private
router.post(
  '/',
  [
    check('name', 'Hobi adı zorunludur').not().isEmpty(),
    check('description', 'Hobi açıklaması zorunludur').not().isEmpty(),
    check('category', 'Hobi kategorisi zorunludur').not().isEmpty()
  ],
  protect,
  createHobby
);

// @route   GET /api/hobbies
// @desc    Tüm hobileri getir
// @access  Public
router.get('/', getHobbies);

// @route   GET /api/hobbies/:id
// @desc    Hobi detaylarını getir
// @access  Public
router.get('/:id', getHobbyById);

// @route   PUT /api/hobbies/:id
// @desc    Hobi güncelle
// @access  Private
router.put('/:id', protect, updateHobby);

// @route   DELETE /api/hobbies/:id
// @desc    Hobi sil
// @access  Private
router.delete('/:id', protect, deleteHobby);

// @route   GET /api/hobbies/:id/users
// @desc    Hobideki kullanıcıları getir
// @access  Public
router.get('/:id/users', getHobbyUsers);

// @route   GET /api/hobbies/:id/events
// @desc    Hobideki etkinlikleri getir
// @access  Public
router.get('/:id/events', getHobbyEvents);

module.exports = router; 