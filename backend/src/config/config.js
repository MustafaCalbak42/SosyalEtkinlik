require('dotenv').config();

// Veritabanı bağlantı ayarları
const db = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sosyaletkinlik',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
};

// JWT ayarları
const jwt = {
  secret: process.env.JWT_SECRET || 'sosyal-etkinlik-gizli-anahtar',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'sosyal-etkinlik-refresh-gizli-anahtar',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
};

// Sunucu ayarları
const server = {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development'
};

// Email ayarları
const email = {
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'user@example.com',
    pass: process.env.EMAIL_PASS || 'password'
  },
  from: process.env.EMAIL_FROM || 'SosyalEtkinlik <noreply@sosyaletkinlik.com>'
};

// Diğer ayarlar
const frontend = {
  url: process.env.FRONTEND_URL || 'http://localhost:3000'
};

module.exports = {
  db,
  jwt,
  server,
  email,
  frontend
}; 