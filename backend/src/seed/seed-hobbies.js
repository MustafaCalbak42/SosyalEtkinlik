const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Hobby = require('../models/Hobby');

// Çevre değişkenlerini yükle
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// MongoDB bağlantısı
const connectDB = async () => {
  try {
    // MongoDB URI'yi çevre değişkeninden al
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://clbkmustafa123:427626Clbk.@sosyaletkinlikcluster.a42w5.mongodb.net/sosyaletkinlik?retryWrites=true&w=majority';
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB bağlantısı başarılı: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB bağlantı hatası: ${error.message}`);
    process.exit(1);
  }
};

// Örnek hobi verileri
const hobbies = [
  {
    name: 'Futbol',
    description: 'Takım olarak oynanan, iki kale arasında topla gol atmaya dayalı popüler bir spor.',
    category: 'Spor'
  },
  {
    name: 'Basketbol',
    description: 'Beş kişilik takımlar halinde oynanan, potaya top atmaya dayalı bir spor.',
    category: 'Spor'
  },
  {
    name: 'Yüzme',
    description: 'Suda, çeşitli stillerle yapılan egzersiz ve yarış sporu.',
    category: 'Spor'
  },
  {
    name: 'Yoga',
    description: 'Zihin ve beden sağlığını iyileştiren esneklik ve nefes çalışmaları.',
    category: 'Spor'
  },
  {
    name: 'Resim',
    description: 'Çeşitli araçlarla yüzeyler üzerine görsel çalışmalar yapma sanatı.',
    category: 'Sanat'
  },
  {
    name: 'Fotoğrafçılık',
    description: 'Fotoğraf makinesi ile çeşitli konuları görsel olarak kaydetme sanatı.',
    category: 'Sanat'
  },
  {
    name: 'El Sanatları',
    description: 'Örgü, dikiş, nakış gibi elle yapılan yaratıcı çalışmalar.',
    category: 'Sanat'
  },
  {
    name: 'Gitar',
    description: 'Telli bir müzik aleti olan gitarı çalma yeteneği.',
    category: 'Müzik'
  },
  {
    name: 'Piyano',
    description: 'Tuşlu bir müzik aleti olan piyanoyu çalma yeteneği.',
    category: 'Müzik'
  },
  {
    name: 'Şarkı Söyleme',
    description: 'Vokal yeteneklerini kullanarak şarkı söyleme sanatı.',
    category: 'Müzik'
  },
  {
    name: 'Modern Dans',
    description: 'Çağdaş ve yenilikçi hareketlerin kullanıldığı dans türü.',
    category: 'Dans'
  },
  {
    name: 'Salsa',
    description: 'Latin müziği eşliğinde çiftler halinde yapılan dans türü.',
    category: 'Dans'
  },
  {
    name: 'Pasta Yapımı',
    description: 'Çeşitli tatlı hamur işleri ve pastalar hazırlama sanatı.',
    category: 'Yemek'
  },
  {
    name: 'Türk Mutfağı',
    description: 'Geleneksel Türk yemeklerini pişirme ve sunma sanatı.',
    category: 'Yemek'
  },
  {
    name: 'Kamp',
    description: 'Doğada çadır kurarak, doğayla iç içe vakit geçirme etkinliği.',
    category: 'Seyahat'
  },
  {
    name: 'Şehir Turu',
    description: 'Şehirleri gezerek tarihi ve kültürel yerlerini keşfetme etkinliği.',
    category: 'Seyahat'
  },
  {
    name: 'Yabancı Dil',
    description: 'Yabancı dilleri öğrenme ve pratik yapma etkinliği.',
    category: 'Eğitim'
  },
  {
    name: 'Bilgisayar Programlama',
    description: 'Yazılım geliştirme ve kodlama becerileri öğrenme.',
    category: 'Eğitim'
  },
  {
    name: 'Web Tasarım',
    description: 'Web siteleri için arayüz tasarlama ve kodlama.',
    category: 'Teknoloji'
  },
  {
    name: 'Mobil Uygulama Geliştirme',
    description: 'Akıllı telefonlar için yazılım ve uygulamalar geliştirme.',
    category: 'Teknoloji'
  },
  {
    name: 'Bahçecilik',
    description: 'Bitki yetiştirme ve bakımı ile ilgili hobiler.',
    category: 'Doğa'
  },
  {
    name: 'Doğa Yürüyüşü',
    description: 'Doğal alanlarda yürüyüş yaparak doğayı keşfetme.',
    category: 'Doğa'
  },
  {
    name: 'Satranç',
    description: 'İki kişi ile oynanan, strateji ve taktik gerektiren zeka oyunu.',
    category: 'Diğer'
  },
  {
    name: 'Koleksiyon',
    description: 'Çeşitli nesneleri biriktirme ve düzenleme hobisi.',
    category: 'Diğer'
  }
];

// Seed işlemi
const seedHobbies = async () => {
  try {
    await connectDB();
    
    // Önce varolan hobileri temizle
    await Hobby.deleteMany({});
    console.log('Mevcut hobiler silindi');
    
    // Yeni hobileri ekle
    await Hobby.insertMany(hobbies);
    console.log(`${hobbies.length} adet hobi eklendi`);
    
    process.exit();
  } catch (error) {
    console.error(`Hata: ${error.message}`);
    process.exit(1);
  }
};

// Seed işlemini başlat
seedHobbies(); 