// Veritabanına hobi ve ikonları eklemek için seed script
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
      
      // Hobi verilerini tanımla
      const hobbies = [
        // SPOR KATEGORİSİ
        {
          name: 'Futbol',
          description: 'Takım halinde oynanan, iki kale arasında topla gol atmaya dayalı popüler bir spor.',
          category: 'Spor',
          icon: 'football'
        },
        {
          name: 'Basketbol',
          description: 'İki takım arasında oynanan, topu rakip takımın potasına atmayı amaçlayan bir spor.',
          category: 'Spor',
          icon: 'basketball'
        },
        {
          name: 'Yüzme',
          description: 'Su içinde çeşitli tekniklerle hareket etmeye dayalı bir spor.',
          category: 'Spor',
          icon: 'swim'
        },
        {
          name: 'Tenis',
          description: 'Raket ve topla oynanan, tek veya çift kişilik olarak yapılan bir spor.',
          category: 'Spor',
          icon: 'tennis'
        },
        {
          name: 'Yoga',
          description: 'Zihinsel ve fiziksel sağlığı geliştiren, esneklik ve rahatlama sağlayan egzersiz sistemi.',
          category: 'Spor',
          icon: 'yoga'
        },
        {
          name: 'Koşu',
          description: 'Kısa veya uzun mesafelerde yapılan, dayanıklılık ve kondisyon gerektiren bir spor.',
          category: 'Spor',
          icon: 'run'
        },

        // SANAT KATEGORİSİ
        {
          name: 'Resim',
          description: 'Çeşitli malzemelerle yüzey üzerine görsel ifadeler oluşturma sanatı.',
          category: 'Sanat',
          icon: 'palette'
        },
        {
          name: 'Heykel',
          description: 'Taş, ahşap, metal, kil gibi malzemelerle üç boyutlu sanat eserleri yaratma.',
          category: 'Sanat',
          icon: 'sculpture'
        },
        {
          name: 'Fotoğrafçılık',
          description: 'Işık ve görüntü kaydetme teknikleriyle anları ölümsüzleştirme sanatı.',
          category: 'Sanat',
          icon: 'camera'
        },
        {
          name: 'El İşi',
          description: 'Örgü, nakış, dikiş gibi çeşitli el becerilerine dayalı hobiler.',
          category: 'Sanat',
          icon: 'hand-craft'
        },

        // MÜZİK KATEGORİSİ
        {
          name: 'Gitar',
          description: 'Telli bir çalgı aleti olan gitar çalma ve öğrenme.',
          category: 'Müzik',
          icon: 'guitar'
        },
        {
          name: 'Piyano',
          description: 'Tuşlu bir çalgı aleti olan piyano çalma ve öğrenme.',
          category: 'Müzik',
          icon: 'piano'
        },
        {
          name: 'Şarkı Söyleme',
          description: 'Vokal teknikleri ile şarkı söyleme ve ses geliştirme.',
          category: 'Müzik',
          icon: 'microphone'
        },
        {
          name: 'Müzik Prodüksiyonu',
          description: 'Dijital ortamda müzik besteleme ve kaydetme.',
          category: 'Müzik',
          icon: 'music-production'
        },

        // DANS KATEGORİSİ
        {
          name: 'Salsa',
          description: 'Latin Amerika kökenli, eşli olarak yapılan ritmik bir dans türü.',
          category: 'Dans',
          icon: 'dance-ballroom'
        },
        {
          name: 'Hip Hop',
          description: 'Sokak kültüründen doğan, özgür ve dinamik hareketlere dayalı bir dans türü.',
          category: 'Dans',
          icon: 'dance-urban'
        },
        {
          name: 'Bale',
          description: 'Klasik müzik eşliğinde yapılan, zarif ve teknik bir dans sanatı.',
          category: 'Dans',
          icon: 'ballet'
        },

        // YEMEK KATEGORİSİ
        {
          name: 'Pasta Yapımı',
          description: 'Çeşitli tatlı ve pasta tarifleri deneyerek fırıncılık becerisi geliştirme.',
          category: 'Yemek',
          icon: 'cake'
        },
        {
          name: 'Aşçılık',
          description: 'Farklı mutfaklardan yemekler pişirme ve teknikler öğrenme.',
          category: 'Yemek',
          icon: 'chef-hat'
        },
        {
          name: 'Kahve Uzmanlığı',
          description: 'Kahve çeşitleri, demleme teknikleri ve lezzet profilleri hakkında bilgi edinme.',
          category: 'Yemek',
          icon: 'coffee'
        },

        // SEYAHAT KATEGORİSİ
        {
          name: 'Doğa Yürüyüşü',
          description: 'Doğal alanlarda yürüyüş yaparak doğayı keşfetme ve spor yapma.',
          category: 'Seyahat',
          icon: 'hiking'
        },
        {
          name: 'Kamp',
          description: 'Doğada çadır ve temel ekipmanlarla geçici konaklama deneyimi.',
          category: 'Seyahat',
          icon: 'camping'
        },
        {
          name: 'Şehir Turu',
          description: 'Şehirlerin tarihi ve kültürel yerlerini keşfetme amaçlı geziler düzenleme.',
          category: 'Seyahat',
          icon: 'city-tour'
        },

        // EĞİTİM KATEGORİSİ
        {
          name: 'Yabancı Dil',
          description: 'Farklı dilleri öğrenme ve pratik yapma.',
          category: 'Eğitim',
          icon: 'language'
        },
        {
          name: 'Kitap Kulübü',
          description: 'Belirli kitapları okuyup tartışmak için bir araya gelme.',
          category: 'Eğitim',
          icon: 'book'
        },
        {
          name: 'Tarih',
          description: 'Tarih hakkında bilgi edinme, tartışma ve tarihi yerler ziyaret etme.',
          category: 'Eğitim',
          icon: 'history'
        },

        // TEKNOLOJİ KATEGORİSİ
        {
          name: 'Programlama',
          description: 'Yazılım geliştirme, kodlama ve programlama dillerini öğrenme.',
          category: 'Teknoloji',
          icon: 'code'
        },
        {
          name: 'Robotik',
          description: 'Robot tasarlama, inşa etme ve programlama.',
          category: 'Teknoloji',
          icon: 'robot'
        },
        {
          name: 'Oyun Geliştirme',
          description: 'Dijital oyunlar tasarlama ve geliştirme.',
          category: 'Teknoloji',
          icon: 'game-controller'
        },
        {
          name: 'Dijital Tasarım',
          description: 'Grafik tasarım, web tasarımı gibi dijital görsel içerik oluşturma.',
          category: 'Teknoloji',
          icon: 'design'
        },

        // DOĞA KATEGORİSİ
        {
          name: 'Bahçecilik',
          description: 'Bitkiler yetiştirme, bahçe düzenleme ve bakım yapma.',
          category: 'Doğa',
          icon: 'flower'
        },
        {
          name: 'Kuş Gözlemciliği',
          description: 'Doğal ortamlarında kuşları izleme ve tanıma.',
          category: 'Doğa',
          icon: 'bird'
        },
        {
          name: 'Doğa Fotoğrafçılığı',
          description: 'Doğa ve yaban hayatının fotoğraflarını çekme.',
          category: 'Doğa',
          icon: 'nature-photography'
        },

        // DİĞER KATEGORİ
        {
          name: 'Koleksiyonerlik',
          description: 'Pullar, madeni paralar, antikalar gibi nesneleri toplama ve organize etme.',
          category: 'Diğer',
          icon: 'collection'
        },
        {
          name: 'Gönüllülük',
          description: 'Topluma fayda sağlamak için vakit ve emek verme.',
          category: 'Diğer',
          icon: 'volunteer'
        },
        {
          name: 'Astroloji',
          description: 'Yıldızların ve gezegenlerin insan yaşamına etkisini inceleme.',
          category: 'Diğer',
          icon: 'stars'
        }
      ];
      
      // Önce tüm mevcut hobiler silinsin
      await Hobby.deleteMany({});
      console.log('🗑️ Mevcut hobiler silindi');
      
      // Yeni hobiler oluştur
      const createdHobbies = await Hobby.insertMany(hobbies);
      
      console.log('🔄 İşlem tamamlandı');
      console.log(`✅ ${createdHobbies.length} hobi başarıyla eklendi`);
      
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