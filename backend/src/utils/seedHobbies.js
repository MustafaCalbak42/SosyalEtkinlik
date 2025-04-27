const mongoose = require('mongoose');
const Hobby = require('../models/Hobby');
const connectDB = require('../config/db');

// Hobi kategorileri ve içerikleri
const hobbies = [
  {
    name: 'Futbol',
    description: 'Futbol oynamak ve izlemek için.',
    category: 'Spor',
    icon: 'football'
  },
  {
    name: 'Basketbol',
    description: 'Basketbol oynamak ve izlemek için.',
    category: 'Spor',
    icon: 'basketball'
  },
  {
    name: 'Yüzme',
    description: 'Yüzme ve su sporları etkinlikleri.',
    category: 'Spor',
    icon: 'swim'
  },
  {
    name: 'Yoga',
    description: 'Yoga ve meditasyon etkinlikleri.',
    category: 'Spor',
    icon: 'yoga'
  },
  {
    name: 'Resim',
    description: 'Resim yapma etkinlikleri.',
    category: 'Sanat',
    icon: 'palette'
  },
  {
    name: 'Müzik',
    description: 'Müzik dinleme ve çalma etkinlikleri.',
    category: 'Müzik',
    icon: 'music'
  },
  {
    name: 'Dans',
    description: 'Dans etkinlikleri.',
    category: 'Dans',
    icon: 'dance'
  },
  {
    name: 'Yemek Yapma',
    description: 'Yemek yapma ve tadım etkinlikleri.',
    category: 'Yemek',
    icon: 'food'
  },
  {
    name: 'Seyahat',
    description: 'Seyahat etme ve gezi etkinlikleri.',
    category: 'Seyahat',
    icon: 'airplane'
  },
  {
    name: 'Programlama',
    description: 'Kodlama ve yazılım geliştirme etkinlikleri.',
    category: 'Teknoloji',
    icon: 'laptop'
  }
];

// Veri tabanını başlangıç verileriyle doldur
const seedHobbies = async () => {
  try {
    // Veritabanına bağlan
    await connectDB();
    
    // Mevcut hobileri kontrol et
    const hobbyCount = await Hobby.countDocuments();
    
    if (hobbyCount > 0) {
      console.log(`${hobbyCount} hobi zaten veritabanında mevcut.`);
      console.log('Yeni hobi eklemek ister misiniz? (Mevcutları silmez)');
    } else {
      // Hobileri oluştur
      console.log('Veritabanına hobi verileri ekleniyor...');
      
      for (const hobby of hobbies) {
        // Hobi zaten var mı kontrol et
        const exists = await Hobby.findOne({ name: hobby.name });
        
        if (!exists) {
          await Hobby.create(hobby);
          console.log(`"${hobby.name}" eklendi.`);
        } else {
          console.log(`"${hobby.name}" zaten mevcut, atlanıyor.`);
        }
      }
      
      console.log('✅ Hobiler başarıyla eklendi!');
    }
    
    // Bağlantıyı kapat
    process.exit();
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
};

// Scripti çalıştır
seedHobbies(); 