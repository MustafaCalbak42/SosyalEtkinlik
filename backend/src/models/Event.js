const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Etkinlik başlığı zorunludur'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Etkinlik açıklaması zorunludur'],
    trim: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hobby: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hobby',
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  startDate: {
    type: Date,
    required: [true, 'Başlangıç tarihi zorunludur']
  },
  endDate: {
    type: Date,
    required: [true, 'Bitiş tarihi zorunludur']
  },
  maxParticipants: {
    type: Number,
    required: [true, 'Maksimum katılımcı sayısı zorunludur'],
    min: [1, 'En az 1 katılımcı olmalıdır']
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  images: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['active', 'cancelled', 'completed', 'full'],
    default: 'active'
  },
  price: {
    type: Number,
    default: 0,
    min: [0, 'Fiyat 0\'dan küçük olamaz']
  },
  requirements: [{
    type: String,
    trim: true
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String
  }],
  averageRating: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Konum indeksi
eventSchema.index({ location: '2dsphere' });

// Tarih indeksi
eventSchema.index({ startDate: 1 });

// Katılımcı sayısı kontrolü
eventSchema.pre('save', function(next) {
  if (this.currentParticipants > this.maxParticipants) {
    this.status = 'full';
  }
  next();
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event; 