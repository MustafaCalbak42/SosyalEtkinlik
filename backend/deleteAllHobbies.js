// Tüm hobileri silmek için script
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// .env dosyasını yükle
dotenv.config();

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('📊 MongoDB bağlantısı başarılı');
    
    try {
      // Hobby modelini yükle
      const Hobby = require('./src/models/Hobby');
      
      // Tüm hobileri sil
      const result = await Hobby.deleteMany({});
      
      console.log('🔄 İşlem tamamlandı');
      console.log(`🗑️ Silinen toplam hobi sayısı: ${result.deletedCount}`);
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