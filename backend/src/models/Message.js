const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Mesaj içeriği
  content: {
    type: String,
    required: [true, 'Mesaj içeriği zorunludur'],
    trim: true
  },
  
  // Mesaj tipi: 'private' (özel) veya 'event' (etkinlik)
  messageType: {
    type: String,
    enum: ['private', 'event'],
    required: true
  },
  
  // Mesajı gönderen kullanıcı
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Mesajı alan kullanıcı (özel mesajlar için)
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // İlgili etkinlik (etkinlik mesajları için)
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  
  // Mesajın okunma durumu
  isRead: {
    type: Boolean,
    default: false
  },
  
  // Varsa ekli dosya/görsel
  attachments: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Özel mesajlar ve etkinlik mesajları için gerekli alanları kontrol et
messageSchema.pre('save', function(next) {
  if (this.messageType === 'private' && !this.recipient) {
    return next(new Error('Özel mesajlar için alıcı (recipient) zorunludur'));
  }
  
  if (this.messageType === 'event' && !this.event) {
    return next(new Error('Etkinlik mesajları için etkinlik (event) zorunludur'));
  }
  
  next();
});

// Mesaj listesi için indeksler
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ event: 1 });
messageSchema.index({ createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 