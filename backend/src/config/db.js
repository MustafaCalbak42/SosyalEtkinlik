const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('MongoDB bağlantısı kuruluyor...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
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
    console.log(`🔗 Bağlantı: ${process.env.MONGODB_URI}`);
    
    // Hata tipine göre özel mesajlar
    if (error.name === 'MongoServerSelectionError') {
      console.log('💡 MongoDB sunucusuna bağlanılamadı. Lütfen bağlantı bilgilerinizi ve internet bağlantınızı kontrol edin.');
    } else if (error.name === 'MongoParseError') {
      console.log('💡 Bağlantı adresinin formatı geçersiz. Lütfen adresinizi kontrol edin.');
    } else if (error.name === 'MongoNetworkError') {
      console.log('💡 Ağ hatası. Sunucuya erişilemiyor.');
    }
    console.log('------------------------------------------------');
    
    // Hatayı üst seviyeye iletiyoruz
    throw error;
  }
};

module.exports = connectDB; 