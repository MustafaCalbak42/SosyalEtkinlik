const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const { moderateContent } = require('../middleware/contentModerationMiddleware');

// Tüm rotalar için kimlik doğrulama gerekli
router.use(protect);

// Özel mesajlar
router.post('/private', moderateContent, messageController.sendPrivateMessage);
router.get('/private/:userId', messageController.getPrivateMessages);

// Etkinlik mesajları
router.post('/event', moderateContent, messageController.sendEventMessage);
router.get('/event/:eventId', messageController.getEventMessages);

// Konuşma listeleri
router.get('/conversations', messageController.getConversations);
router.get('/events', messageController.getEventConversations);

module.exports = router; 