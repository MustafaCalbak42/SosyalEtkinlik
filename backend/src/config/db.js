const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('MongoDB bağlantısı kuruluyor...');
    
    // MONGODB_URI çevre değişkeni yoksa varsayılan olarak yerel MongoDB bağlantısı kullan
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sosyaletkinlik';
    
    console.log(`MongoDB URI: ${mongoURI.replace(/mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/, 'mongodb$1://$2:****@')}`);
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('------------------------------------------------');
    console.log('✅ MONGODB BAĞLANTISI BAŞARILI');
    console.log(`📡 Sunucu: ${conn.connection.host}`);
    console.log(`🗃️  Veritabanı: ${conn.connection.name}`);
    console.log('------------------------------------------------');
    return conn;
  } catch (error) {
    console.log('------------------------------------------------');
    console.log('❌ MONGODB BAĞLANTISI BAŞARISIZ');
    console.log(`🔍 Hata: ${error.message}`);
    
    // Hassas bilgileri gizleyerek bağlantı bilgisini yazdır
    const safeUri = process.env.MONGODB_URI 
      ? process.env.MONGODB_URI.replace(/mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/, 'mongodb$1://$2:****@')
      : 'Tanımlanmamış';
    console.log(`🔗 Bağlantı: ${safeUri}`);
    
    // Hata tipine göre özel mesajlar
    if (error.name === 'MongoServerSelectionError') {
      console.log('💡 MongoDB sunucusuna bağlanılamadı. Lütfen bağlantı bilgilerinizi ve internet bağlantınızı kontrol edin.');
      console.log('💡 Yerel bir MongoDB kurulumu kullanıyorsanız MongoDB servisinin çalıştığından emin olun.');
    } else if (error.name === 'MongoParseError') {
      console.log('💡 Bağlantı adresinin formatı geçersiz. Lütfen adresinizi kontrol edin.');
    } else if (error.name === 'MongoNetworkError') {
      console.log('💡 Ağ hatası. Sunucuya erişilemiyor.');
    }
    console.log('------------------------------------------------');
    
    // Yerel MongoDB'ye bağlanmayı dene
    if (process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('localhost')) {
      console.log('Yerel MongoDB\'ye bağlanmayı deneyeceğim...');
      try {
        const localConn = await mongoose.connect('mongodb://localhost:27017/sosyaletkinlik', {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        console.log('✅ Yerel MongoDB\'ye başarıyla bağlanıldı!');
        return localConn;
      } catch (localError) {
        console.error('❌ Yerel MongoDB bağlantısı da başarısız:', localError.message);
      }
    }
    
    // Hatayı üst seviyeye iletiyoruz
    throw error;
  }
};

module.exports = connectDB; 