// Tüm illerde hobilerle ilgili etkinlikler eklemek için seed script
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// .env dosyasını yükle
dotenv.config();

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('📊 MongoDB bağlantısı başarılı');
    
    try {
      // Modelleri yükle
      const Event = require('./src/models/Event');
      const Hobby = require('./src/models/Hobby');
      const User = require('./src/models/User');
      
      // Önce tüm etkinlikleri sil
      await Event.deleteMany({});
      console.log('🗑️ Mevcut etkinlikler silindi');
      
      // Hobiler ve kullanıcıyı getir
      const hobbies = await Hobby.find();
      if (hobbies.length === 0) {
        throw new Error("Veritabanında hiç hobi bulunamadı. Önce hobiler eklenmelidir.");
      }
      
      // Admin kullanıcısını bul, yoksa oluştur
      let admin = await User.findOne({ email: "admin@example.com" });
      if (!admin) {
        admin = await User.create({
          username: "admin",
          email: "admin@example.com",
          password: "Admin123!",
          fullName: "Admin Kullanıcı",
          isAdmin: true,
          emailVerified: true
        });
        console.log('👤 Admin kullanıcısı oluşturuldu');
      }
      
      // Türkiye'deki iller
      const cities = [
        { name: "Adana", lat: 37.0000, lng: 35.3213 },
        { name: "Adıyaman", lat: 37.7648, lng: 38.2786 },
        { name: "Afyonkarahisar", lat: 38.7507, lng: 30.5567 },
        { name: "Ağrı", lat: 39.7191, lng: 43.0503 },
        { name: "Amasya", lat: 40.6499, lng: 35.8353 },
        { name: "Ankara", lat: 39.9208, lng: 32.8541 },
        { name: "Antalya", lat: 36.8841, lng: 30.7056 },
        { name: "Artvin", lat: 41.1828, lng: 41.8183 },
        { name: "Aydın", lat: 37.8560, lng: 27.8416 },
        { name: "Balıkesir", lat: 39.6484, lng: 27.8826 },
        { name: "Bilecik", lat: 40.1506, lng: 29.9792 },
        { name: "Bingöl", lat: 39.0626, lng: 40.7696 },
        { name: "Bitlis", lat: 38.4006, lng: 42.1095 },
        { name: "Bolu", lat: 40.7351, lng: 31.6082 },
        { name: "Burdur", lat: 37.7260, lng: 30.2880 },
        { name: "Bursa", lat: 40.1885, lng: 29.0610 },
        { name: "Çanakkale", lat: 40.1553, lng: 26.4142 },
        { name: "Çankırı", lat: 40.6013, lng: 33.6134 },
        { name: "Çorum", lat: 40.5489, lng: 34.9537 },
        { name: "Denizli", lat: 37.7765, lng: 29.0864 },
        { name: "Diyarbakır", lat: 37.9144, lng: 40.2306 },
        { name: "Edirne", lat: 41.6818, lng: 26.5623 },
        { name: "Elazığ", lat: 38.6743, lng: 39.2232 },
        { name: "Erzincan", lat: 39.7500, lng: 39.5000 },
        { name: "Erzurum", lat: 39.9000, lng: 41.2700 },
        { name: "Eskişehir", lat: 39.7767, lng: 30.5206 },
        { name: "Gaziantep", lat: 37.0662, lng: 37.3833 },
        { name: "Giresun", lat: 40.9128, lng: 38.3895 },
        { name: "Gümüşhane", lat: 40.4386, lng: 39.5086 },
        { name: "Hakkari", lat: 37.5742, lng: 43.7408 },
        { name: "Hatay", lat: 36.4018, lng: 36.3498 },
        { name: "Isparta", lat: 37.7648, lng: 30.5566 },
        { name: "Mersin", lat: 36.8000, lng: 34.6333 },
        { name: "İstanbul", lat: 41.0082, lng: 28.9784 },
        { name: "İzmir", lat: 38.4189, lng: 27.1287 },
        { name: "Kars", lat: 40.6013, lng: 43.0975 },
        { name: "Kastamonu", lat: 41.3887, lng: 33.7827 },
        { name: "Kayseri", lat: 38.7205, lng: 35.4826 },
        { name: "Kırklareli", lat: 41.7333, lng: 27.2167 },
        { name: "Kırşehir", lat: 39.1425, lng: 34.1709 },
        { name: "Kocaeli", lat: 40.7654, lng: 29.9408 },
        { name: "Konya", lat: 37.8746, lng: 32.4932 },
        { name: "Kütahya", lat: 39.4167, lng: 29.9833 },
        { name: "Malatya", lat: 38.3552, lng: 38.3095 },
        { name: "Manisa", lat: 38.6191, lng: 27.4289 },
        { name: "Kahramanmaraş", lat: 37.5753, lng: 36.9228 },
        { name: "Mardin", lat: 37.3126, lng: 40.7247 },
        { name: "Muğla", lat: 37.2153, lng: 28.3636 },
        { name: "Muş", lat: 38.7432, lng: 41.5064 },
        { name: "Nevşehir", lat: 38.6245, lng: 34.7141 },
        { name: "Niğde", lat: 37.9696, lng: 34.6788 },
        { name: "Ordu", lat: 40.9839, lng: 37.8764 },
        { name: "Rize", lat: 41.0201, lng: 40.5234 },
        { name: "Sakarya", lat: 40.7731, lng: 30.3948 },
        { name: "Samsun", lat: 41.2867, lng: 36.3307 },
        { name: "Siirt", lat: 37.9274, lng: 41.9419 },
        { name: "Sinop", lat: 42.0231, lng: 35.1531 },
        { name: "Sivas", lat: 39.7477, lng: 37.0179 },
        { name: "Tekirdağ", lat: 40.9833, lng: 27.5167 },
        { name: "Tokat", lat: 40.3013, lng: 36.5550 },
        { name: "Trabzon", lat: 41.0015, lng: 39.7178 },
        { name: "Tunceli", lat: 39.1079, lng: 39.5401 },
        { name: "Şanlıurfa", lat: 37.1674, lng: 38.7955 },
        { name: "Uşak", lat: 38.6823, lng: 29.4082 },
        { name: "Van", lat: 38.4891, lng: 43.4089 },
        { name: "Yozgat", lat: 39.8181, lng: 34.8147 },
        { name: "Zonguldak", lat: 41.4535, lng: 31.7894 },
        { name: "Aksaray", lat: 38.3687, lng: 34.0370 },
        { name: "Bayburt", lat: 40.2552, lng: 40.2249 },
        { name: "Karaman", lat: 37.1759, lng: 33.2287 },
        { name: "Kırıkkale", lat: 39.8400, lng: 33.5200 },
        { name: "Batman", lat: 37.8812, lng: 41.1351 },
        { name: "Şırnak", lat: 37.5164, lng: 42.4611 },
        { name: "Bartın", lat: 41.6358, lng: 32.3375 },
        { name: "Ardahan", lat: 41.1105, lng: 42.7022 },
        { name: "Iğdır", lat: 39.9167, lng: 44.0333 },
        { name: "Yalova", lat: 40.6500, lng: 29.2667 },
        { name: "Karabük", lat: 41.2061, lng: 32.6204 },
        { name: "Kilis", lat: 36.7184, lng: 37.1212 },
        { name: "Osmaniye", lat: 37.0746, lng: 36.2464 },
        { name: "Düzce", lat: 40.8431, lng: 31.1637 }
      ];

      // Etkinlik başlıkları için kullanılabilir sıfatlar
      const adjectives = ["Heyecanlı", "Eğlenceli", "İnanılmaz", "Muhteşem", "Unutulmaz", "Büyüleyici", "Öğretici", "İlginç", "Yeni Başlayanlar için", "İleri Seviye", "Haftalık", "Aylık", "Sezonluk", "Yıllık", "Geleneksel"];
      
      // Etkinlik başlıkları için kullanılabilir fiiller
      const verbs = ["Buluşma", "Etkinlik", "Atölye", "Workshop", "Kurs", "Festival", "Turnuva", "Gösteri", "Sergi", "Yarışma", "Şenlik", "Parti"];
      
      // Etkinlik açıklamaları için kullanılabilir cümleler
      const descriptions = [
        "Bu etkinlikte %HOBBY% hakkında temel bilgileri öğreneceksiniz.",
        "%CITY% merkezinde düzenlenen bu %HOBBY% etkinliğine tüm seviyelerden katılımcılar bekliyoruz.",
        "Profesyonel eğitmenler eşliğinde %HOBBY% becerilerinizi geliştirebileceğiniz harika bir fırsat.",
        "%CITY%'da %HOBBY% tutkunlarını bir araya getiren bu etkinliği kaçırmayın.",
        "Hem eğlenmek hem de %HOBBY% hakkında bilgi edinmek isteyenler için ideal bir etkinlik.",
        "%HOBBY% konusunda deneyimli kişilerle tanışıp fikir alışverişinde bulunabileceğiniz sosyal bir ortam.",
        "Yeni başlayanlar için özel olarak tasarlanmış %HOBBY% atölyesi.",
        "İleri seviye %HOBBY% teknikleri üzerine yoğunlaşacağımız bu etkinlikte yerinizi ayırtmayı unutmayın.",
        "%CITY%'nın en güzel mekanlarından birinde gerçekleşecek olan %HOBBY% etkinliğimize davetlisiniz.",
        "Hafta sonunuzu %HOBBY% yaparak değerlendirmek ister misiniz?",
        "%HOBBY% alanında kendinizi geliştirmek için harika bir fırsat.",
        "Farklı bakış açıları kazanmak ve yeni insanlarla tanışmak için %HOBBY% topluluğumuza katılın.",
        "Bu %HOBBY% etkinliğinde teori ve pratiği bir arada sunuyoruz.",
        "%CITY%'daki %HOBBY% meraklılarını bir araya getiren aylık etkinliğimiz.",
        "Her seviyeden katılımcının keyif alabileceği şekilde tasarlanmış %HOBBY% atölyesi."
      ];
      
      // Etkinlik gereksinimleri için kullanılabilir maddeler
      const requirements = [
        "Kendi ekipmanınızı getirmeniz gerekmektedir.",
        "Rahat kıyafetler giymeniz tavsiye edilir.",
        "Etkinlik öncesi kayıt yaptırmak zorunludur.",
        "18 yaş üzeri katılımcılar içindir.",
        "Her seviyeden katılımcıya açıktır.",
        "Temel seviye %HOBBY% bilgisi gereklidir.",
        "İleri seviye %HOBBY% bilgisi gerektirir.",
        "Etkinlik yerine toplu ulaşım ile ulaşılabilir.",
        "Otopark imkanı bulunmaktadır.",
        "Etkinlik ücreti girişte ödenecektir."
      ];
      
      // Etkinlik etiketleri için kullanılabilir kelimeler
      const tags = [
        "workshop", "eğitim", "sosyal", "networking", "öğrenme", "gelişim", "eğlence", 
        "hobi", "akşam", "haftasonu", "kapalıalan", "açıkhava", "ücretsiz", "ücretli", "başlangıç", 
        "ileri", "topluluketkinliği", "grup"
      ];
      
      // Etkinlikler için rastgele tarih oluştur (şimdiden itibaren 1-90 gün arası)
      const getRandomFutureDate = () => {
        const now = new Date();
        const futureDate = new Date();
        const randomDays = Math.floor(Math.random() * 90) + 1; // 1-90 gün arası
        futureDate.setDate(now.getDate() + randomDays);
        return futureDate;
      };
      
      // Rastgele süre (1-5 saat arası)
      const getRandomDuration = () => {
        return Math.floor(Math.random() * 4) + 1; // 1-5 saat arası
      };
      
      // Rastgele fiyat (0-200 TL arası, %30 şansla ücretsiz)
      const getRandomPrice = () => {
        const isFree = Math.random() < 0.3; // %30 şansla ücretsiz
        if (isFree) return 0;
        
        return Math.floor(Math.random() * 20) * 10; // 10, 20, ..., 190, 200 TL
      };
      
      // Rastgele katılımcı sayısı (5-50 arası)
      const getRandomMaxParticipants = () => {
        return Math.floor(Math.random() * 46) + 5; // 5-50 arası
      };
      
      // Rastgele dizi öğeleri seç (1-3 arası)
      const getRandomItems = (array, min = 1, max = 3) => {
        const count = Math.floor(Math.random() * (max - min + 1)) + min;
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
      };
      
      // Etkinlikler listesi oluştur
      let events = [];
      let eventCount = 0;
      
      // Her il için 3-10 adet etkinlik oluştur, her hobi kategorisinden en az bir tane olsun
      const eventsPerCity = Math.floor(Math.random() * 8) + 3; // 3-10 arası
      
      for (const city of cities) {
        // Her şehir için farklı hobilerden rastgele seçim yap
        const selectedHobbies = getRandomItems(hobbies, eventsPerCity, eventsPerCity);
        
        for (const hobby of selectedHobbies) {
          // Etkinlik için rastgele bir başlangıç tarihi oluştur
          const startDate = getRandomFutureDate();
          const durationHours = getRandomDuration();
          
          // Bitiş tarihi hesapla (başlangıçtan x saat sonra)
          const endDate = new Date(startDate);
          endDate.setHours(endDate.getHours() + durationHours);
          
          // Rastgele bir başlık oluştur
          const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
          const verb = verbs[Math.floor(Math.random() * verbs.length)];
          const title = `${adjective} ${hobby.name} ${verb}`;
          
          // Şehir ve hobi ismini içeren bir açıklama oluştur
          let description = descriptions[Math.floor(Math.random() * descriptions.length)]
            .replace('%HOBBY%', hobby.name)
            .replace('%CITY%', city.name);
          
          // Rastgele gereksinimler seç ve içlerinde hobi adını yerleştir
          const eventRequirements = getRandomItems(requirements, 2, 4).map(req => 
            req.replace('%HOBBY%', hobby.name)
          );
          
          // Rastgele etiketler seç
          const eventTags = getRandomItems(tags, 3, 6);
          
          // Etkinlik nesnesi oluştur
          const event = {
            title: title,
            description: description,
            organizer: admin._id,
            hobby: hobby._id,
            location: {
              type: 'Point',
              coordinates: [city.lng, city.lat], // [longitude, latitude]
              address: `${city.name} Merkez`
            },
            startDate: startDate,
            endDate: endDate,
            maxParticipants: getRandomMaxParticipants(),
            currentParticipants: 0,
            participants: [],
            images: [],
            tags: eventTags,
            status: 'active',
            price: getRandomPrice(),
            requirements: eventRequirements,
            comments: [],
            ratings: [],
            averageRating: 0
          };
          
          events.push(event);
          eventCount++;
        }
      }
      
      // Etkinlikleri veritabanına ekle
      await Event.insertMany(events);
      
      console.log('🔄 İşlem tamamlandı');
      console.log(`✅ Toplam ${eventCount} etkinlik ${cities.length} farklı şehir için oluşturuldu.`);
      
    } catch (error) {
      console.error('❌ Hata:', error);
    } finally {
      // Bağlantıyı kapat
      mongoose.connection.close();
      console.log('📵 Veritabanı bağlantısı kapatıldı');
    }
  })
  .catch(err => {
    console.error('❌ MongoDB bağlantı hatası:', err.message);
  }); 