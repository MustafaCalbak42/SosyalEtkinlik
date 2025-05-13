const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('MongoDB bağlantısı kuruluyor...');
    
    // MongoDB URI'yi çevre değişkeninden al
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://clbkmustafa123:427626Clbk.@sosyaletkinlikcluster.a42w5.mongodb.net/sosyaletkinlik?retryWrites=true&w=majority';
    
    // Bağlantı URI'sini kontrol et
    if (!mongoURI) {
      throw new Error('MongoDB URI tanımlanmamış!');
    }
    
    // Şifreyi gizlenerek URI'yi göster
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
    const mongoURI = process.env.MONGODB_URI || '';
    const safeUri = mongoURI
      ? mongoURI.replace(/mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/, 'mongodb$1://$2:****@')
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
    
    // Hatayı üst seviyeye iletiyoruz
    throw error;
  }
};

module.exports = connectDB; 