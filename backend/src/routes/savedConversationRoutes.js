const express = require('express');
const router = express.Router();
const savedConversationController = require('../controllers/savedConversationController');
const { protect } = require('../middleware/authMiddleware');

// Tüm rotalar için kimlik doğrulama gerekli
router.use(protect);

// Kaydedilmiş konuşmaları listele
router.get('/', savedConversationController.getSavedConversations);

// Konuşma kaydet
router.post('/', savedConversationController.saveConversation);

// Kaydedilmiş konuşmayı sil
router.delete('/:id', savedConversationController.deleteSavedConversation);

module.exports = router; 