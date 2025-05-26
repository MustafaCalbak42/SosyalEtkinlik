const mongoose = require('mongoose');

/**
 * Kaydedilmiş Konuşma Modeli
 * Kullanıcı tarafından seçilen ve sürekli görüntülenmesi istenen konuşmaları saklar
 */
const savedConversationSchema = new mongoose.Schema({
  // Konuşmayı kaydeden kullanıcı
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Seçilen kullanıcı
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Kaydedilme tarihi
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // Son mesaj tarihi (varsa)
  lastMessageDate: {
    type: Date,
    default: null
  },
  
  // Not (kullanıcı tarafından eklenebilir)
  note: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Bir kullanıcı, bir hedef kullanıcıyı bir kez kaydedebilir
savedConversationSchema.index({ owner: 1, targetUser: 1 }, { unique: true });

module.exports = mongoose.model('SavedConversation', savedConversationSchema); 