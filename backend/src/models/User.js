const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Kullanıcı Şeması
 */
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Kullanıcı adı zorunludur'],
    unique: true,
    trim: true,
    minlength: [3, 'Kullanıcı adı en az 3 karakter olmalıdır'],
    maxlength: [30, 'Kullanıcı adı en fazla 30 karakter olabilir']
  },
  email: {
    type: String,
    required: [true, 'Email adresi zorunludur'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Geçerli bir email adresi giriniz']
  },
  password: {
    type: String,
    required: [true, 'Şifre zorunludur'],
    minlength: [6, 'Şifre en az 6 karakter olmalıdır'],
    select: false // Varsayılan olarak şifreyi çekme
  },
  fullName: {
    type: String,
    required: [true, 'Ad Soyad zorunludur'],
    trim: true
  },
  profilePicture: {
    type: String,
    default: 'default-profile.png'
  },
  bio: {
    type: String,
    maxlength: [500, 'Biyografi en fazla 500 karakter olabilir']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    address: {
      type: String,
      default: ''
    }
  },
  hobbies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hobby'
  }],
  interests: [{
    type: String,
    trim: true
  }],
  events: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  participatedEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpire: {
    type: Date
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  notifications: [
    {
      type: {
        type: String,
        enum: ['event', 'follow', 'message', 'system'],
        required: true
      },
      title: {
        type: String,
        required: true
      },
      message: {
        type: String,
        required: true
      },
      read: {
        type: Boolean,
        default: false
      },
      relatedId: {
        type: mongoose.Schema.Types.ObjectId
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ]
}, {
  timestamps: true
});

/**
 * Şifre hashleme middleware
 */
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Şifre karşılaştırma metodu
 * @param {string} candidatePassword - Karşılaştırılacak şifre
 * @returns {boolean} - Eşleşme durumu
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Kullanıcı için bildirim ekleme metodu
 * @param {Object} notification - Bildirim detayları
 * @returns {User} - Güncellenmiş kullanıcı
 */
userSchema.methods.addNotification = async function(notification) {
  this.notifications.unshift(notification);
  // Bildirim sayısını 50 ile sınırla
  if (this.notifications.length > 50) {
    this.notifications = this.notifications.slice(0, 50);
  }
  return this.save();
};

/**
 * Kullanıcı için bildirim işaretleme metodu
 * @param {string} notificationId - Bildirim ID'si
 * @returns {User} - Güncellenmiş kullanıcı
 */
userSchema.methods.markNotificationAsRead = async function(notificationId) {
  const notification = this.notifications.id(notificationId);
  if (notification) {
    notification.read = true;
    return this.save();
  }
  return this;
};

// Konum indeksi
userSchema.index({ location: '2dsphere' });

// Kullanıcı adı ve email için indeks
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User; 