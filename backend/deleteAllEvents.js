// Tüm etkinlikleri silmek için script
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// .env dosyasını yükle
dotenv.config();

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('📊 MongoDB bağlantısı başarılı');
    
    try {
      // Event modelini yükle
      const Event = require('./src/models/Event');
      
      // Tüm etkinlikleri sil
      const result = await Event.deleteMany({});
      
      console.log('🔄 İşlem tamamlandı');
      console.log(`🗑️ Silinen toplam etkinlik sayısı: ${result.deletedCount}`);
    } catch (error) {
      console.error('❌ Hata:', error.message);
    } finally {
      // Bağlantıyı kapat
      mongoose.connection.close();
      console.log('📵 Veritabanı bağlantısı kapatıldı');
    }
  })
  .catch(err => {
    console.error('❌ MongoDB bağlantı hatası:', err.message);
  }); 