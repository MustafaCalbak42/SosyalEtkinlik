const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Event = require('../models/Event');
const Hobby = require('../models/Hobby');
const User = require('../models/User');

// Çevre değişkenlerini yükle
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// MongoDB bağlantısı
const connectDB = async () => {
  try {
    // MongoDB URI'yi çevre değişkeninden al
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sosyaletkinlik';
    
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

// Türkiye'nin 81 ili ve yaklaşık koordinatları
const turkeyProvinces = [
  { name: 'Adana', coordinates: [35.3308, 37.0000] },
  { name: 'Adıyaman', coordinates: [38.2762, 37.7636] },
  { name: 'Afyonkarahisar', coordinates: [30.5411, 38.7507] },
  { name: 'Ağrı', coordinates: [43.0503, 39.7192] },
  { name: 'Amasya', coordinates: [35.8373, 40.6499] },
  { name: 'Ankara', coordinates: [32.8597, 39.9334] },
  { name: 'Antalya', coordinates: [30.7133, 36.8969] },
  { name: 'Artvin', coordinates: [41.8208, 41.1836] },
  { name: 'Aydın', coordinates: [27.8456, 37.8560] },
  { name: 'Balıkesir', coordinates: [27.8903, 39.6484] },
  { name: 'Bilecik', coordinates: [29.9804, 40.1506] },
  { name: 'Bingöl', coordinates: [40.4983, 38.8847] },
  { name: 'Bitlis', coordinates: [42.1093, 38.4006] },
  { name: 'Bolu', coordinates: [31.6089, 40.7398] },
  { name: 'Burdur', coordinates: [30.2917, 37.7214] },
  { name: 'Bursa', coordinates: [29.0610, 40.1885] },
  { name: 'Çanakkale', coordinates: [26.4086, 40.1553] },
  { name: 'Çankırı', coordinates: [33.6191, 40.6013] },
  { name: 'Çorum', coordinates: [34.9537, 40.5489] },
  { name: 'Denizli', coordinates: [29.0963, 37.7765] },
  { name: 'Diyarbakır', coordinates: [40.2307, 37.9144] },
  { name: 'Edirne', coordinates: [26.5557, 41.6771] },
  { name: 'Elazığ', coordinates: [39.2210, 38.6749] },
  { name: 'Erzincan', coordinates: [39.4900, 39.7500] },
  { name: 'Erzurum', coordinates: [41.2658, 39.9000] },
  { name: 'Eskişehir', coordinates: [30.5206, 39.7767] },
  { name: 'Gaziantep', coordinates: [37.3765, 37.0662] },
  { name: 'Giresun', coordinates: [38.3927, 40.9128] },
  { name: 'Gümüşhane', coordinates: [39.4822, 40.4603] },
  { name: 'Hakkari', coordinates: [43.7408, 37.5744] },
  { name: 'Hatay', coordinates: [36.1626, 36.2000] },
  { name: 'Isparta', coordinates: [30.5539, 37.7648] },
  { name: 'Mersin', coordinates: [34.6401, 36.8000] },
  { name: 'İstanbul', coordinates: [29.0122, 41.0053] },
  { name: 'İzmir', coordinates: [27.1428, 38.4237] },
  { name: 'Kars', coordinates: [43.0975, 40.6013] },
  { name: 'Kastamonu', coordinates: [33.7760, 41.3887] },
  { name: 'Kayseri', coordinates: [35.4900, 38.7312] },
  { name: 'Kırklareli', coordinates: [27.2267, 41.7333] },
  { name: 'Kırşehir', coordinates: [34.1588, 39.1425] },
  { name: 'Kocaeli', coordinates: [29.9257, 40.7655] },
  { name: 'Konya', coordinates: [32.4930, 37.8667] },
  { name: 'Kütahya', coordinates: [29.9858, 39.4242] },
  { name: 'Malatya', coordinates: [38.3552, 38.3555] },
  { name: 'Manisa', coordinates: [27.4305, 38.6191] },
  { name: 'Kahramanmaraş', coordinates: [36.9150, 37.5833] },
  { name: 'Mardin', coordinates: [40.7235, 37.3126] },
  { name: 'Muğla', coordinates: [28.3665, 37.2154] },
  { name: 'Muş', coordinates: [41.4982, 38.7432] },
  { name: 'Nevşehir', coordinates: [34.7240, 38.6241] },
  { name: 'Niğde', coordinates: [34.6781, 37.9696] },
  { name: 'Ordu', coordinates: [37.8780, 40.9862] },
  { name: 'Rize', coordinates: [40.5218, 41.0201] },
  { name: 'Sakarya', coordinates: [30.4034, 40.7731] },
  { name: 'Samsun', coordinates: [36.3360, 41.2867] },
  { name: 'Siirt', coordinates: [41.9430, 37.9333] },
  { name: 'Sinop', coordinates: [35.1550, 42.0264] },
  { name: 'Sivas', coordinates: [37.0150, 39.7477] },
  { name: 'Tekirdağ', coordinates: [27.5100, 40.9781] },
  { name: 'Tokat', coordinates: [36.5550, 40.3092] },
  { name: 'Trabzon', coordinates: [39.7217, 41.0053] },
  { name: 'Tunceli', coordinates: [39.5481, 39.0992] },
  { name: 'Şanlıurfa', coordinates: [38.7956, 37.1675] },
  { name: 'Uşak', coordinates: [29.4058, 38.6742] },
  { name: 'Van', coordinates: [43.3821, 38.4942] },
  { name: 'Yozgat', coordinates: [34.8048, 39.8198] },
  { name: 'Zonguldak', coordinates: [31.7928, 41.4536] },
  { name: 'Aksaray', coordinates: [33.9999, 38.3686] },
  { name: 'Bayburt', coordinates: [40.2260, 40.2553] },
  { name: 'Karaman', coordinates: [33.2153, 37.1759] },
  { name: 'Kırıkkale', coordinates: [33.5067, 39.8353] },
  { name: 'Batman', coordinates: [41.1200, 37.8819] },
  { name: 'Şırnak', coordinates: [42.4595, 37.5138] },
  { name: 'Bartın', coordinates: [32.3378, 41.6359] },
  { name: 'Ardahan', coordinates: [42.7022, 41.1105] },
  { name: 'Iğdır', coordinates: [44.0456, 39.9167] },
  { name: 'Yalova', coordinates: [29.2770, 40.6550] },
  { name: 'Karabük', coordinates: [32.6227, 41.1956] },
  { name: 'Kilis', coordinates: [37.1153, 36.7202] },
  { name: 'Osmaniye', coordinates: [36.2478, 37.0746] },
  { name: 'Düzce', coordinates: [31.1624, 40.8430] }
];

// Tarih yardımcı fonksiyonları
const getRandomFutureDate = (daysOffset = 30) => {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * daysOffset) + 1);
  // Saat dakika ayarı
  date.setHours(Math.floor(Math.random() * 12) + 8); // 8:00 - 20:00 arası
  date.setMinutes(Math.floor(Math.random() * 4) * 15); // 0, 15, 30, 45 dakika
  return date;
};

const getEndDate = (startDate, hoursOffset = 3) => {
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + (Math.floor(Math.random() * 4) + 1)); // 1-4 saat arası
  return endDate;
};

// Seed işlemi
const seedEvents = async () => {
  try {
    await connectDB();
    
    // Kullanıcı ve hobileri kontrol et
    const hobbyCount = await Hobby.countDocuments();
    const userCount = await User.countDocuments();
    
    if (hobbyCount === 0) {
      console.error('Veritabanında hobi bulunamadı. Önce hobiler eklenmelidir.');
      process.exit(1);
    }
    
    if (userCount === 0) {
      console.error('Veritabanında kullanıcı bulunamadı. Önce kullanıcı eklenmelidir.');
      process.exit(1);
    }
    
    console.log(`Veritabanında ${hobbyCount} hobi ve ${userCount} kullanıcı bulundu.`);
    
    // Tüm kullanıcıları getir (rastgele organizatör atamak için)
    const users = await User.find({}).lean();
    console.log(`${users.length} kullanıcı bulundu.`);
    
    // Tüm hobileri getir
    const hobbies = await Hobby.find({}).lean();
    console.log(`${hobbies.length} hobi bulundu.`);
    
    // Mevcut etkinliklerin sayısını kontrol et
    const existingEventCount = await Event.countDocuments();
    console.log(`Mevcut etkinlik sayısı: ${existingEventCount}`);
    
    // Oluşturulacak etkinlikler
    const events = [];
    let addedCount = 0;
    
    // Her şehir için her hobi kategorisinden etkinlik oluştur
    for (const province of turkeyProvinces) {
      // Hobi kategorilerini al (tekrarları kaldır)
      const categories = [...new Set(hobbies.map(hobby => hobby.category))];
      
      for (const category of categories) {
        // Bu kategorideki hobiler
        const categoryHobbies = hobbies.filter(h => h.category === category);
        
        // Her kategori için 1-3 rastgele hobi seç
        const hobbiesToUse = getRandomHobbies(categoryHobbies, Math.floor(Math.random() * 3) + 1);
        
        for (const hobby of hobbiesToUse) {
          // Rastgele bir organizatör seç
          const organizer = users[Math.floor(Math.random() * users.length)];
          
          // Etkinlik bilgileri
          const startDate = getRandomFutureDate(60); // Önümüzdeki 60 gün içinde
          const endDate = getEndDate(startDate);
          
          // Örnek adresler
          const addresses = [
            `${province.name} Merkez`,
            `${province.name} Kültür Merkezi`,
            `${province.name} Spor Salonu`,
            `${province.name} Parkı`,
            `${province.name} Belediye Meydanı`,
            `${province.name} Üniversitesi`
          ];
          
          const address = addresses[Math.floor(Math.random() * addresses.length)];
          
          // Etkinlik nesnesi
          const event = {
            title: `${hobby.name} Etkinliği - ${province.name}`,
            description: `${province.name}'da düzenlenen ${hobby.name} etkinliğimize davetlisiniz! ${hobby.description} Bu etkinlikte alanında uzman kişilerle bir araya gelerek hem yeni bilgiler öğrenecek hem de keyifli vakit geçireceksiniz.`,
            organizer: organizer._id,
            hobby: hobby._id,
            location: {
              type: 'Point',
              coordinates: province.coordinates,
              address: address
            },
            startDate,
            endDate,
            maxParticipants: Math.floor(Math.random() * 46) + 5, // 5-50 arası
            currentParticipants: 0,
            participants: [],
            tags: [hobby.name, category, province.name],
            status: 'active',
            price: Math.random() > 0.7 ? Math.floor(Math.random() * 200) + 50 : 0, // %70 ücretsiz, %30 ücretli
            requirements: []
          };
          
          // Gereksinimleri ekle (rastgele)
          const possibleRequirements = [
            'Erken kayıt yaptırmanızı öneriyoruz.',
            'Rahat kıyafetlerle gelmeniz önerilir.',
            'Kendi ekipmanınızı getirmeniz faydalı olacaktır.',
            '18 yaş ve üzeri katılımcılar içindir.',
            'Başlangıç seviyesine uygundur, ön deneyim gerekmez.',
            'Etkinlik için malzeme ücreti ayrıca alınacaktır.',
            'Lütfen randevu saatinden 15 dakika önce geliniz.'
          ];
          
          // Rastgele 1-3 gereksinim ekle
          const requirementCount = Math.floor(Math.random() * 3) + 1;
          for (let i = 0; i < requirementCount; i++) {
            const req = possibleRequirements[Math.floor(Math.random() * possibleRequirements.length)];
            if (!event.requirements.includes(req)) {
              event.requirements.push(req);
            }
          }
          
          events.push(event);
          addedCount++;
          
          // Düzenli feedback göster
          if (addedCount % 50 === 0) {
            console.log(`${addedCount} etkinlik hazırlandı...`);
          }
        }
      }
    }
    
    console.log(`Toplam ${events.length} etkinlik hazırlandı, veritabanına ekleniyor...`);
    
    // Gruplar halinde ekle (çok fazla veri olduğu için)
    const BATCH_SIZE = 100;
    for (let i = 0; i < events.length; i += BATCH_SIZE) {
      const batch = events.slice(i, i + BATCH_SIZE);
      await Event.insertMany(batch);
      console.log(`${i + batch.length}/${events.length} etkinlik eklendi.`);
    }
    
    console.log(`Toplam ${events.length} etkinlik başarıyla veritabanına eklendi.`);
    
    // Bağlantıyı kapat ve çık
    mongoose.connection.close();
    console.log('Veritabanı bağlantısı kapatıldı.');
    process.exit(0);
  } catch (error) {
    console.error(`Hata: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
};

// Rastgele hobi seçimi için yardımcı fonksiyon
function getRandomHobbies(hobbies, count) {
  const result = [];
  const hobbiesToSelect = [...hobbies];
  
  count = Math.min(count, hobbiesToSelect.length);
  
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * hobbiesToSelect.length);
    result.push(hobbiesToSelect[randomIndex]);
    hobbiesToSelect.splice(randomIndex, 1);
  }
  
  return result;
}

// Seed işlemini başlat
console.log('81 il için etkinlik seed işlemi başlatılıyor...');
seedEvents(); 