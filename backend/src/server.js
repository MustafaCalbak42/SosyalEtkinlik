// Önce çevre değişkenlerini yükle
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const socketio = require('socket.io');
const connectDB = require('./config/db');
const path = require('path');
const socketManager = require('./socket/socketManager');
const fs = require('fs');
const emailService = require('./services/emailService');
const cleanupService = require('./services/cleanupService');

// Routes
const userRoutes = require('./routes/userRoutes');
const hobbyRoutes = require('./routes/hobbyRoutes');
const eventRoutes = require('./routes/eventRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  // Tüm isteklere izin ver
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
}));

// File upload directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Statik dosyaları sunmak için middleware ekle
app.use(express.static(path.join(__dirname, '../public')));

// Profil resimlerinin yükleneceği dizini oluştur (yoksa)
const uploadDir = path.join(__dirname, '../public/uploads/profiles');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Server health check
app.get('/', (req, res) => {
  res.send('Sosyal Etkinlik API Sunucusu çalışıyor');
});

// Mobil bağlantı testi için özel endpoint
app.get('/api/health', (req, res) => {
  // IP adresi bilgisini ekle
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  // Detaylı durum bilgisini gönder
  res.json({
    status: 'success',
    message: 'Sosyal Etkinlik API Sunucusu çalışıyor',
    timestamp: new Date().toISOString(),
    clientIp: clientIp,
    dbStatus: global.dbStatus || { connected: false, message: 'Veritabanı durumu henüz bilinmiyor' },
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Portu sabit 5000 olarak ayarla ve tüm ortamlarda aynı değeri kullan
const PORT = 5000;

// Create HTTP server
const server = http.createServer(app);

// Set up Socket.io
const io = socketio(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
});

// Socket.io connection handling with dedicated manager
socketManager(io);

// MongoDB bağlantısını yapıp, sonrasında API rotalarını tanımlayacağız
const startServer = async () => {
  try {
    let dbConnected = false;
    
    // Connect to database - Veritabanına bağlan
    try {
      await connectDB();
      console.log('👍 Veritabanı bağlantısı başarılı, API rotaları etkinleştiriliyor...');
      dbConnected = true;
    } catch (dbError) {
      console.log('⚠️ Veritabanı bağlantısı başarısız, API rotaları sınırlı çalışacak!');
      console.log('Veritabanı hatası detayı:', dbError.message);
      
      // Veritabanı hatası için global değişken, tüm controller'larda kullanılabilir
      global.dbConnectionError = {
        connected: false,
        error: dbError.message
      };
    }
    
    // Veritabanı bağlantı durumunu global değişkene kaydet
    global.dbStatus = {
      connected: dbConnected,
      timestamp: new Date().toISOString()
    };
    
    // Temizleme sistemi için global değişken
    global.cleanupScheduleStarted = false;
    
    // Event endpoint'lerine middleware ekle - otomatik temizleme sistemi için
    app.use('/api/events', (req, res, next) => {
      // Eğer temizleme zamanlayıcısı henüz başlatılmamışsa ve veritabanı bağlantısı varsa
      if (!global.cleanupScheduleStarted && dbConnected) {
        // Her 5 dakikada bir süresi dolmuş etkinlikleri temizle
        const CLEANUP_INTERVAL_MINUTES = 5;
        console.log('🔄 İlk etkinlik isteği alındı, otomatik temizleme sistemi başlatılıyor...');
        console.log(`🕒 Temizleme sıklığı: Her ${CLEANUP_INTERVAL_MINUTES} dakikada bir`);
        cleanupService.startCleanupSchedule(CLEANUP_INTERVAL_MINUTES);
        global.cleanupScheduleStarted = true;
      }
      next();
    });
    
    // API rotalarını tanımla
    app.use('/api/users', userRoutes);
    app.use('/api/hobbies', hobbyRoutes);
    app.use('/api/events', eventRoutes);
    
    // Start server - Sunucuyu başlat
    server.listen(PORT, '0.0.0.0', () => {
      console.log('------------------------------------------------');
      console.log('🚀 SUNUCU BAŞLATILDI');
      console.log(`🔧 Ortam: ${process.env.NODE_ENV}`);
      console.log(`🌐 Adres: http://192.168.1.36:${PORT}`);
      console.log('📱 Web ve Mobil istemcilere hizmet veriyor');
      console.log(`💾 Veritabanı bağlantısı: ${dbConnected ? 'BAŞARILI ✅' : 'BAŞARISIZ ❌'}`);
      console.log('------------------------------------------------');
      
      /* Otomatik temizleme sistemi artık ilk etkinlik işleminden sonra başlatılacak
      if (dbConnected) {
        // Her 5 dakikada bir süresi dolmuş etkinlikleri temizle
        const CLEANUP_INTERVAL_MINUTES = 5;
        cleanupService.startCleanupSchedule(CLEANUP_INTERVAL_MINUTES);
      }
      */
    });
    
  } catch (error) {
    console.log('------------------------------------------------');
    console.log('⛔ SUNUCU BAŞLATMA HATASI');
    console.log(`🔍 Hata: ${error.message}`);
    console.log('💡 Lütfen bağlantı sorunlarını kontrol ediniz.');
    console.log('------------------------------------------------');
    process.exit(1);
  }
};

// Sunucuyu başlat
startServer(); 