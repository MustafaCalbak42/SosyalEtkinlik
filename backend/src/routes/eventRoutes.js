const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { moderateContent } = require('../middleware/contentModerationMiddleware');

// Controller fonksiyonları daha sonra oluşturulacak
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  joinEvent,
  leaveEvent,
  getEventParticipants,
  getNearbyEvents,
  getEventsByHobby,
  getRecommendedEvents,
  getUpcomingEvents,
  cleanupExpiredEvents
} = require('../controllers/eventController');

const { protect } = require('../middleware/authMiddleware');

// Etkinlik içeriği için özel moderation middleware
const moderateEventContent = (req, res, next) => {
  // Etkinlik açıklaması için moderation
  const content = req.body.description;
  if (content) {
    req.body.content = content; // moderateContent middleware'i için
  }
  next();
};

// @route   POST /api/events
// @desc    Yeni etkinlik oluştur
// @access  Private
router.post(
  '/',
  [
    check('title', 'Etkinlik başlığı zorunludur').not().isEmpty(),
    check('description', 'Etkinlik açıklaması zorunludur').not().isEmpty(),
    check('hobby', 'Hobi seçimi zorunludur').not().isEmpty(),
    check('location', 'Konum bilgisi zorunludur').not().isEmpty(),
    check('startDate', 'Başlangıç tarihi zorunludur').not().isEmpty(),
    check('endDate', 'Bitiş tarihi zorunludur').not().isEmpty(),
    check('maxParticipants', 'Maksimum katılımcı sayısı zorunludur').isInt({ min: 1 })
  ],
  protect,
  moderateEventContent,
  moderateContent,
  createEvent
);

// @route   GET /api/events
// @desc    Tüm etkinlikleri getir
// @access  Public
router.get('/', getEvents);

// @route   GET /api/events/nearby
// @desc    Yakındaki etkinlikleri getir
// @access  Public
router.get('/nearby', getNearbyEvents);

// @route   GET /api/events/hobby/:hobbyId
// @desc    Hobiye göre etkinlikleri getir
// @access  Public
router.get('/hobby/:hobbyId', getEventsByHobby);

// @route   GET /api/events/recommended
// @desc    Kullanıcıya önerilen etkinlikleri getir (Hobilerine göre)
// @access  Private
router.get('/recommended', protect, getRecommendedEvents);

// @route   GET /api/events/upcoming
// @desc    Yaklaşan etkinlikleri getir (48 saat içinde başlayacak)
// @access  Private
router.get('/upcoming', protect, getUpcomingEvents);

// @route   POST /api/events/cleanup
// @desc    Süresi dolmuş etkinlikleri temizle (Admin)
// @access  Private/Admin
router.post('/cleanup', protect, cleanupExpiredEvents);

// @route   GET /api/events/:id
// @desc    Etkinlik detaylarını getir
// @access  Public
router.get('/:id', getEventById);

// @route   PUT /api/events/:id
// @desc    Etkinlik güncelle
// @access  Private
router.put('/:id', protect, moderateEventContent, moderateContent, updateEvent);

// @route   DELETE /api/events/:id
// @desc    Etkinlik sil
// @access  Private
router.delete('/:id', protect, deleteEvent);

// @route   PUT /api/events/:id/join
// @desc    Etkinliğe katıl
// @access  Private
router.put('/:id/join', protect, joinEvent);

// @route   PUT /api/events/:id/leave
// @desc    Etkinlikten ayrıl
// @access  Private
router.put('/:id/leave', protect, leaveEvent);

// @route   GET /api/events/:id/participants
// @desc    Etkinlik katılımcılarını getir
// @access  Public
router.get('/:id/participants', getEventParticipants);

module.exports = router; 