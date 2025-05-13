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

// Türkiye'nin büyük şehirleri ve koordinatları
const cities = [
  { name: 'İstanbul', coordinates: [29.0121795, 41.0053215] },
  { name: 'Ankara', coordinates: [32.8597419, 39.9333635] },
  { name: 'İzmir', coordinates: [27.142826, 38.423733] },
  { name: 'Bursa', coordinates: [29.0609636, 40.1885425] },
  { name: 'Antalya', coordinates: [30.7133233, 36.8968908] }
];

// Tarih yardımcı fonksiyonları
const getRandomFutureDate = (daysOffset = 30) => {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * daysOffset) + 1);
  return date;
};

const getEndDate = (startDate, hoursOffset = 3) => {
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + hoursOffset);
  return endDate;
};

// Seed işlemi
const seedEvents = async () => {
  try {
    await connectDB();
    
    // Önce varolan etkinlikleri temizle
    await Event.deleteMany({});
    console.log('Mevcut etkinlikler silindi');
    
    // Hobiler ve kullanıcıları getir
    const hobbies = await Hobby.find({}).lean();
    
    if (hobbies.length === 0) {
      console.log('Önce hobiler yüklenmelidir. Seed-hobbies.js dosyasını çalıştırın.');
      process.exit(1);
    }
    
    // Admin kullanıcısını bul (veya ilk kullanıcıyı)
    const organizer = await User.findOne({}).lean();
    
    if (!organizer) {
      console.log('Etkinlikler için organizatör kullanıcı bulunamadı. Önce bir kullanıcı oluşturun.');
      process.exit(1);
    }
    
    const events = [];
    
    // Her şehir için her hobi kategorisinden en az 1 etkinlik oluştur
    for (const city of cities) {
      const cityName = city.name;
      
      // Her hobi kategorisinden bir etkinlik ekleyelim
      const categories = [...new Set(hobbies.map(hobby => hobby.category))];
      
      for (const category of categories) {
        // Bu kategorideki hobilerden birini rastgele seç
        const categoryHobbies = hobbies.filter(hobby => hobby.category === category);
        const randomHobby = categoryHobbies[Math.floor(Math.random() * categoryHobbies.length)];
        
        // Etkinlik başlangıç tarihi
        const startDate = getRandomFutureDate();
        const endDate = getEndDate(startDate);
        
        // Etkinlik oluştur
        events.push({
          title: `${randomHobby.name} Etkinliği - ${cityName}`,
          description: `${cityName}'da düzenlenen ${randomHobby.name} etkinliğimize davetlisiniz! ${randomHobby.description} konusunda deneyimli kişilerle bir araya gelerek yeni şeyler öğrenecek ve eğlenceli vakit geçireceksiniz.`,
          organizer: organizer._id,
          hobby: randomHobby._id,
          location: {
            type: 'Point',
            coordinates: city.coordinates,
            address: `${cityName} Merkez`
          },
          startDate,
          endDate,
          maxParticipants: Math.floor(Math.random() * 20) + 5,
          currentParticipants: 0,
          participants: [],
          images: ['default-event-image.jpg'],
          tags: [randomHobby.name, category, cityName],
          status: 'active',
          price: Math.random() > 0.7 ? Math.floor(Math.random() * 100) + 50 : 0,
          requirements: ['Katılımcı limiti dolmadan kayıt olunuz.'],
          comments: [],
          ratings: []
        });
      }
    }
    
    // Etkinlikleri ekle
    const insertedEvents = await Event.insertMany(events);
    console.log(`${insertedEvents.length} adet etkinlik eklendi`);
    
    process.exit();
  } catch (error) {
    console.error(`Hata: ${error.message}`);
    process.exit(1);
  }
};

// Seed işlemini başlat
seedEvents(); 