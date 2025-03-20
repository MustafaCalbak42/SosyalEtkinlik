const mongoose = require('mongoose');

const hobbySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Hobi adı zorunludur'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Hobi açıklaması zorunludur'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Hobi kategorisi zorunludur'],
    enum: [
      'Spor',
      'Sanat',
      'Müzik',
      'Dans',
      'Yemek',
      'Seyahat',
      'Eğitim',
      'Teknoloji',
      'Doğa',
      'Diğer'
    ]
  },
  icon: {
    type: String,
    default: 'default-hobby-icon.png'
  },
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  events: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hobi adı için indeks
hobbySchema.index({ name: 1 });

const Hobby = mongoose.model('Hobby', hobbySchema);

module.exports = Hobby; 