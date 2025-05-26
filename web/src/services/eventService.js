import api from '../shared/api';
import TURKEY_CITY_COORDINATES from '../shared/constants/cityCoordinates';
import DISTRICT_COORDINATES from '../shared/constants/districtCoordinates';

// Tüm etkinlikleri getir
export const getAllEvents = async (page = 1, limit = 10, category = null) => {
  try {
    console.log(`[eventService] Fetching events - page: ${page}, limit: ${limit}, category: ${category}`);
    
    let url = `/events?page=${page}&limit=${limit}`;
    
    // Kategori filtresi ekle
    if (category && category !== 'Tümü') {
      url += `&category=${encodeURIComponent(category)}`;
    }
    
    const response = await api.get(url);
    
    if (response.data && response.data.success) {
      return response.data;
    } else if (response.data && Array.isArray(response.data)) {
      // Eski API formatı için geriye uyumluluk
      return {
        success: true,
        data: response.data,
        pagination: {
          page: 1,
          limit: response.data.length,
          total: response.data.length,
          pages: 1
        }
      };
    } else {
      console.error('[eventService] Invalid response format:', response.data);
      return {
        success: false,
        message: 'Beklenmeyen API yanıt formatı'
      };
    }
  } catch (error) {
    console.error('[eventService] Error fetching events:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Etkinlikler yüklenirken bir hata oluştu'
    };
  }
};

// Etkinlik detaylarını getir
export const getEventById = async (eventId) => {
  try {
    console.log(`[eventService] Fetching event with ID: ${eventId}`);
    const response = await api.get(`/events/${eventId}`);
    
    if (response.data && response.data.success) {
      return response.data;
    } else if (response.data) {
      return {
        success: true,
        data: response.data
      };
    } else {
      console.error('[eventService] Invalid response format:', response.data);
      return {
        success: false,
        message: 'Beklenmeyen API yanıt formatı'
      };
    }
  } catch (error) {
    console.error(`[eventService] Error fetching event ${eventId}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || 'Etkinlik detayları yüklenirken bir hata oluştu'
    };
  }
};

// Hobi kategorisine göre etkinlikleri getir
export const getEventsByHobby = async (hobbyId) => {
  try {
    console.log(`[eventService] Fetching events for hobby ID: ${hobbyId}`);
    const response = await api.get(`/events/hobby/${hobbyId}`);
    
    if (response.data && Array.isArray(response.data)) {
      return {
        success: true,
        data: response.data
      };
    } else if (response.data && response.data.success) {
      return response.data;
    } else {
      console.error('[eventService] Invalid response format:', response.data);
      return {
        success: false,
        message: 'Beklenmeyen API yanıt formatı'
      };
    }
  } catch (error) {
    console.error(`[eventService] Error fetching events for hobby ${hobbyId}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || 'Hobi etkinlikleri yüklenirken bir hata oluştu'
    };
  }
};

/**
 * Etkinliğe katılma
 * @param {string} eventId - Etkinlik ID
 * @returns {Promise} - API yanıtı
 */
export const joinEvent = async (eventId) => {
  try {
    console.log(`[eventService] Joining event with ID: ${eventId}`);
    const response = await api.put(`/events/${eventId}/join`);
    
    if (response.data && response.data.success) {
      return response.data;
    } else if (response.data) {
      return {
        success: true,
        message: response.data.message || 'Etkinliğe başarıyla katıldınız',
        data: response.data
      };
    } else {
      console.error('[eventService] Invalid response format:', response.data);
      return {
        success: false,
        message: 'Beklenmeyen API yanıt formatı'
      };
    }
  } catch (error) {
    console.error(`[eventService] Error joining event ${eventId}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || 'Etkinliğe katılırken bir hata oluştu'
    };
  }
};

/**
 * Etkinlikten ayrılma
 * @param {string} eventId - Etkinlik ID
 * @returns {Promise} - API yanıtı
 */
export const leaveEvent = async (eventId) => {
  try {
    console.log(`[eventService] Leaving event with ID: ${eventId}`);
    const response = await api.put(`/events/${eventId}/leave`);
    
    if (response.data && response.data.success) {
      return response.data;
    } else if (response.data) {
      return {
        success: true,
        message: response.data.message || 'Etkinlikten başarıyla ayrıldınız',
        data: response.data
      };
    } else {
      console.error('[eventService] Invalid response format:', response.data);
      return {
        success: false,
        message: 'Beklenmeyen API yanıt formatı'
      };
    }
  } catch (error) {
    console.error(`[eventService] Error leaving event ${eventId}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || 'Etkinlikten ayrılırken bir hata oluştu'
    };
  }
};

// Kullanıcının hobilerine göre önerilen etkinlikleri getir
export const getRecommendedEvents = async (page = 1, limit = 4, city = null) => {
  try {
    console.log(`[eventService] Fetching recommended events based on user hobbies - page: ${page}, limit: ${limit}, city: ${city || 'Not specified'}`);
    
    // Kimlik doğrulama kontrolü
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('[eventService] No token found, cannot fetch personalized recommendations');
      return {
        success: false,
        message: 'Kişiselleştirilmiş öneriler için lütfen giriş yapın'
      };
    }
    
    // API'den önerilen etkinlikleri getir
    // URL parametrelerini oluştur
    let url = `/events/recommended?page=${page}&limit=${limit}`;
    
    // Şehir parametresi (eğer belirtilmişse)
    if (city) {
      url += `&city=${encodeURIComponent(city)}`;
      console.log(`[eventService] Adding city filter: ${city}`);
    }
    
    // İsteği gönder
    const response = await api.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Yanıt başarılı ise detaylı log göster
    if (response.data && (response.data.success || Array.isArray(response.data))) {
      const eventData = response.data.data || response.data;
      const totalEvents = Array.isArray(eventData) ? eventData.length : 0;
      
      console.log(`[eventService] Successfully fetched ${totalEvents} recommended events`);
      
      // İl bazlı filtreleme yapılmış mı kontrol et
      if (response.data.message && response.data.message.includes('ilinizdeki')) {
        console.log('[eventService] Events filtered by user province:', response.data.message);
      }
      
      // İlk birkaç etkinliğin hobi ve konum bilgisini göster
      if (totalEvents > 0) {
        const sampleEvents = eventData.slice(0, Math.min(3, totalEvents));
        console.log('[eventService] Sample recommended events:', 
          sampleEvents.map(event => ({
            id: event._id,
            title: event.title,
            hobby: event.hobby?.name || 'No hobby',
            category: event.hobby?.category || 'No category',
            location: event.location?.address || 'No location'
          }))
        );
      }
    }
    
    // Yanıt formatlarını ele al (başarılı olması durumunda)
    if (response.data && response.data.success) {
      return response.data;
    } else if (response.data && Array.isArray(response.data)) {
      return {
        success: true,
        data: response.data,
        pagination: {
          page: 1,
          limit: response.data.length,
          total: response.data.length,
          pages: 1
        }
      };
    } else {
      console.error('[eventService] Invalid response format:', response.data);
      return {
        success: false,
        message: 'Beklenmeyen API yanıt formatı'
      };
    }
  } catch (error) {
    console.error('[eventService] Error fetching recommended events:', error);
    console.error('[eventService] Error details:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Önerilen etkinlikler yüklenirken bir hata oluştu'
    };
  }
};

/**
 * Şehir/il/ilçe adından koordinat bilgisini döndürür
 * @param {string} locationName - Şehir/il/ilçe adı
 * @returns {Object|null} - {lat, lng} formatında koordinat bilgisi veya null
 */
const getCityCoordinates = (locationName) => {
  if (!locationName) return null;
  
  console.log(`[getCityCoordinates] Konum bilgisi analiz ediliyor: "${locationName}"`);
  
  // İl adı alternatif yazımları ve kısaltmalar için eşleşme desenleri
  const cityPatterns = {
    // İstanbul alternatifleri
    'istanbul': ['ist', 'istanbulda', 'istanbuldan', 'istanbuldaki'],
    // Ankara alternatifleri
    'ankara': ['ank', 'ankarada', 'ankaradan', 'ankaradaki'],
    // İzmir alternatifleri
    'izmir': ['izm', 'izmirde', 'izmirden', 'izmirdeki'],
    // Bursa alternatifleri
    'bursa': ['bursada', 'bursadan', 'bursadaki'],
    // Adana alternatifleri
    'adana': ['adanada', 'adanadan', 'adanadaki'],
    // Konya alternatifleri
    'konya': ['konyada', 'konyadan', 'konyadaki'],
    // Antalya alternatifleri
    'antalya': ['antalyada', 'antalyadan', 'antalyadaki'],
    // Elazığ alternatifleri
    'elazığ': ['elazig', 'elâzığ', 'elazıg', 'elazı', 'elaz', 'elazığda', 'elazığdan'],
    // Diğer illerin alternatifleri de eklenebilir
  };
  
  // Normalize edilmiş adres metni
  const normalizedLocation = normalizeText(locationName);
  
  // Desenleri kontrol et
  for (const [city, patterns] of Object.entries(cityPatterns)) {
    // Ana il adı kontrolü
    if (normalizedLocation.includes(normalizeText(city))) {
      console.log(`[getCityCoordinates] İl eşleşmesi bulundu: "${locationName}" içinde "${city}" deseni`);
      return TURKEY_CITY_COORDINATES[capitalizeFirstLetter(city)];
    }
    
    // Alternatif desenleri kontrol et
    for (const pattern of patterns) {
      if (normalizedLocation.includes(normalizeText(pattern))) {
        console.log(`[getCityCoordinates] İl alternatifi eşleşmesi: "${locationName}" içinde "${pattern}" deseni (${city})`);
        return TURKEY_CITY_COORDINATES[capitalizeFirstLetter(city)];
      }
    }
  }
  
  // Leaflet formatındaki adresi parçala (virgülle ayrılmış)
  // Örnek: "Sarıgül, Elâzığ Merkez, Elazığ, Doğu Anadolu Bölgesi, Türkiye"
  const addressParts = locationName.split(/,\s*/);
  console.log(`[getCityCoordinates] Adres parçaları:`, addressParts);
  
  // "Merkez" kelimesi varsa, özel olarak işle (birçok adres "X Merkez" formatında gelir)
  for (const part of addressParts) {
    if (part.toLowerCase().includes('merkez')) {
      // İlçe merkezi formatı: "Elazığ Merkez" -> "Elazığ" ili
      const cityPart = part.split(/\s+/)[0]; // İlk kelime il adı olabilir
      console.log(`[getCityCoordinates] Merkez formatı algılandı, il adı olabilir: "${cityPart}"`);
      
      // İl adını koordinatlarda ara
      for (const city of Object.keys(TURKEY_CITY_COORDINATES)) {
        if (fuzzyMatch(cityPart, city)) {
          console.log(`[getCityCoordinates] İl eşleşmesi bulundu: "${cityPart}" -> "${city}"`);
          return TURKEY_CITY_COORDINATES[city];
        }
      }
    }
  }
  
  // Tüm adres parçalarını işle (virgülle ayrılmış parçalar)
  // Önce il ve ilçe adlarını tam eşleşme ile ara
  for (const part of addressParts) {
    // İl koordinatlarında tam eşleşme ara
    for (const city of Object.keys(TURKEY_CITY_COORDINATES)) {
      if (normalizeText(part) === normalizeText(city)) {
        console.log(`[getCityCoordinates] İl tam eşleşmesi: "${part}" -> "${city}"`);
        return TURKEY_CITY_COORDINATES[city];
      }
    }
    
    // İlçe koordinatlarında tam eşleşme ara
    for (const district of Object.keys(DISTRICT_COORDINATES)) {
      if (normalizeText(part) === normalizeText(district)) {
        console.log(`[getCityCoordinates] İlçe tam eşleşmesi: "${part}" -> "${district}"`);
        return DISTRICT_COORDINATES[district];
      }
    }
  }
  
  // Bulanık eşleşme ile tekrar dene
  for (const part of addressParts) {
    // Çok kısa parçaları atla (2 karakterden az)
    if (part.trim().length <= 2) continue;
    
    // İlçe koordinatlarında bulanık eşleşme ara
    for (const district of Object.keys(DISTRICT_COORDINATES)) {
      if (fuzzyMatch(part, district)) {
        console.log(`[getCityCoordinates] İlçe bulanık eşleşmesi: "${part}" -> "${district}"`);
        return DISTRICT_COORDINATES[district];
      }
    }
    
    // İl koordinatlarında bulanık eşleşme ara
    for (const city of Object.keys(TURKEY_CITY_COORDINATES)) {
      if (fuzzyMatch(part, city)) {
        console.log(`[getCityCoordinates] İl bulanık eşleşmesi: "${part}" -> "${city}"`);
        return TURKEY_CITY_COORDINATES[city];
      }
    }
  }
  
  // Tüm adres tek bir string olarak ele al ve içinde il/ilçe isimleri ara
  const fullAddress = addressParts.join(' ');
  
  // İlçe isimlerini ara
  for (const district of Object.keys(DISTRICT_COORDINATES)) {
    if (fullAddress.toLowerCase().includes(normalizeText(district))) {
      console.log(`[getCityCoordinates] Tam adreste ilçe bulundu: "${district}"`);
      return DISTRICT_COORDINATES[district];
    }
  }
  
  // İl isimlerini ara
  for (const city of Object.keys(TURKEY_CITY_COORDINATES)) {
    if (fullAddress.toLowerCase().includes(normalizeText(city))) {
      console.log(`[getCityCoordinates] Tam adreste il bulundu: "${city}"`);
      return TURKEY_CITY_COORDINATES[city];
    }
  }
  
  // Son çare: adresi kelime kelime analiz et
  const words = fullAddress.split(/\s+/);
  for (const word of words) {
    // Çok kısa kelimeleri atla
    if (word.length <= 2) continue;
    
    // İl/ilçe isimleriyle karşılaştır
    for (const city of Object.keys(TURKEY_CITY_COORDINATES)) {
      if (fuzzyMatch(word, city)) {
        console.log(`[getCityCoordinates] Kelime bazlı il eşleşmesi: "${word}" -> "${city}"`);
        return TURKEY_CITY_COORDINATES[city];
      }
    }
    
    for (const district of Object.keys(DISTRICT_COORDINATES)) {
      if (fuzzyMatch(word, district)) {
        console.log(`[getCityCoordinates] Kelime bazlı ilçe eşleşmesi: "${word}" -> "${district}"`);
        return DISTRICT_COORDINATES[district];
      }
    }
  }
  
  console.log(`[getCityCoordinates] Konum için koordinat bulunamadı: "${locationName}"`);
  return null;
};

// Normalize işlevi (dışarıya çıkarıldı)
const normalizeText = (text) => {
  if (!text) return '';
  return text.trim().toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
};

// İlk harfi büyük yapan yardımcı fonksiyon
const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// İki metin arasında bulanık eşleşme kontrolü (daha esnek arama için)
const fuzzyMatch = (text1, text2) => {
  const norm1 = normalizeText(text1);
  const norm2 = normalizeText(text2);
  
  // Tam eşleşme
  if (norm1 === norm2) return true;
  
  // İçerme kontrolü (her iki yönde)
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  
  // Parça eşleşmesi (en az 3 karakter ve %60 eşleşme)
  if (norm1.length >= 3 && norm2.length >= 3) {
    // Başlangıç veya bitiş eşleşmesi
    if (norm1.startsWith(norm2.substring(0, 3)) || norm1.endsWith(norm2.substring(norm2.length - 3))) return true;
    if (norm2.startsWith(norm1.substring(0, 3)) || norm2.endsWith(norm1.substring(norm1.length - 3))) return true;
  }
  
  return false;
};

/**
 * İki nokta arasındaki mesafeyi hesaplar (Haversine formülü)
 * @param {number} lat1 - İlk noktanın enlemi
 * @param {number} lon1 - İlk noktanın boylamı
 * @param {number} lat2 - İkinci noktanın enlemi
 * @param {number} lon2 - İkinci noktanın boylamı
 * @returns {number} - İki nokta arasındaki mesafe (km)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  
  const R = 6371; // Dünya yarıçapı (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Kilometre cinsinden mesafe
  
  return distance;
};

/**
 * Kullanıcının mevcut konumuna yakın etkinlikleri getir
 * @param {Array} coordinates - [latitude, longitude] formatında konum koordinatları
 * @param {number} maxDistance - Kilometre cinsinden maksimum uzaklık (varsayılan: 20km)
 * @param {number} page - Sayfa numarası
 * @param {number} limit - Sayfa başına öğe sayısı
 * @returns {Promise} - API yanıtı
 */
export const getNearbyEvents = async (coordinates, maxDistance = 20, page = 1, limit = 10) => {
  try {
    console.log(`[eventService] Yakındaki etkinlikler getiriliyor - koordinatlar: [${coordinates}], maksimum mesafe: ${maxDistance}km`);
    
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      console.error('[eventService] Geçersiz koordinat formatı:', coordinates);
      return {
        success: false,
        message: 'Geçersiz konum koordinatları'
      };
    }
    
    const [latitude, longitude] = coordinates;
    
    // API endpoint'i
    let url = `/events/nearby?lat=${latitude}&lng=${longitude}&maxDistance=${maxDistance}&page=${page}&limit=${limit}`;
    
    try {
      const response = await api.get(url);
      
      if (response.data && response.data.success) {
        console.log(`[eventService] Başarıyla ${response.data.data.length} yakındaki etkinlik alındı`);
        return response.data;
      } else if (response.data && Array.isArray(response.data)) {
        // Eski API formatı için geriye uyumluluk
        return {
          success: true,
          data: response.data,
          pagination: {
            page: 1,
            limit: response.data.length,
            total: response.data.length,
            pages: 1
          }
        };
      }
    } catch (apiError) {
      console.warn('[eventService] API endpoint bulunamadı veya hata oluştu, mock veri kullanılıyor:', apiError);
      
      // Alternatif: Doğrudan API çağrısı yapmayı dene
      console.log('[eventService] Alternatif API çağrısı deneniyor...');
      
      try {
        const alternativeUrl = `${api.defaults.baseURL}/events/nearby?lat=${latitude}&lng=${longitude}&maxDistance=${maxDistance}&page=${page}&limit=${limit}`;
        console.log('[eventService] Alternatif URL:', alternativeUrl);
        
        const directResponse = await fetch(alternativeUrl);
        const data = await directResponse.json();
        
        if (data && (data.success || Array.isArray(data))) {
          console.log('[eventService] Alternatif API çağrısı başarılı:', data);
          
          if (data.success) {
            return data;
          } else if (Array.isArray(data)) {
            return {
              success: true,
              data: data,
              pagination: {
                page: 1,
                limit: data.length,
                total: data.length,
                pages: 1
              }
            };
          }
        } else {
          console.warn('[eventService] Alternatif API çağrısı başarısız, mock veri kullanılacak');
        }
      } catch (altError) {
        console.error('[eventService] Alternatif API çağrısı hatası:', altError);
      }
      
      // Backend API henüz hazır değilse mock data ile devam et
      // Tüm etkinlikleri getir ve sonra mesafe hesabı yap
      console.log('[eventService] Fallback olarak tüm etkinlikler getiriliyor');
      const allEventsResponse = await getAllEvents(page, limit * 20); // Daha fazla etkinlik getir, filtreleme yapacağız
      
      if (allEventsResponse.success) {
        // API'nin veri yapısını kontrol et ve ona göre işlem yap
        const eventsData = allEventsResponse.data || [];
        // data alanı varsa onu kullan, yoksa doğrudan veriyi kullan
        const events = Array.isArray(eventsData.data) ? eventsData.data : eventsData;
        
        console.log(`[eventService] İşlenecek etkinlik sayısı: ${events.length}`);
        console.log('[eventService] İlk birkaç etkinliğin adres bilgileri:');
        events.slice(0, 5).forEach((event, index) => {
          console.log(`[${index}] ${event.title}: ${JSON.stringify(event.location)}`);
        });
        
        // Adreslerden il adlarını ayıklayarak gruplama yap
        const eventsByCity = {};
        const unidentifiedEvents = [];
        
        // Tüm etkinlikleri dön ve her birinin konumunu kontrol et
        const eventsWithCoordinates = events.map(event => {
          try {
            // Event.location kontrolü
            if (!event.location) {
              console.log(`[eventService] Etkinlik için konum bilgisi yok: ${event.title}`);
              event.location = { address: 'Konum bilgisi yok' };
              unidentifiedEvents.push(event);
              return event;
            }
            
            // String formatındaki location'ı objeye çevir
            if (typeof event.location === 'string') {
              const address = event.location;
              console.log(`[eventService] String adres dönüştürülüyor: "${address}"`);
              event.location = { address };
            }
            
            // Adres bilgisini al
            const address = event.location.address || '';
            
            // Koordinat bilgisi var mı kontrol et
            if (event.location.coordinates && Array.isArray(event.location.coordinates) && event.location.coordinates.length === 2) {
              // Koordinatlar var, mesafeyi hesapla
              const eventLng = event.location.coordinates[0];
              const eventLat = event.location.coordinates[1];
              
              const distance = calculateDistance(latitude, longitude, eventLat, eventLng);
              event.distance = distance ? distance.toFixed(1) : null;
              
              if (distance !== null) {
                console.log(`[eventService] "${event.title}" etkinliği mesafesi: ${distance.toFixed(1)} km (konum: [${eventLat}, ${eventLng}])`);
              }
              
              return event;
            }
            
            // Koordinat bilgisi yoksa, adres bilgisinden çıkarmaya çalış
            const cityCoords = getCityCoordinates(address);
            if (cityCoords) {
              console.log(`[eventService] "${address}" için koordinatlar bulundu:`, cityCoords);
              event.location.coordinates = [cityCoords.lng, cityCoords.lat]; // MongoDB formatı: [longitude, latitude]
              
              // Mesafeyi hesapla
              const distance = calculateDistance(latitude, longitude, cityCoords.lat, cityCoords.lng);
              event.distance = distance ? distance.toFixed(1) : null;
              
              // İl adını belirle (adres içindeki il adını bul)
              let cityName = findCityNameInAddress(address);
              
              if (cityName) {
                console.log(`[eventService] "${event.title}" etkinliği için il bulundu: ${cityName}`);
                
                // İl bazlı gruplama için ekle
                if (!eventsByCity[cityName]) {
                  eventsByCity[cityName] = [];
                }
                eventsByCity[cityName].push(event);
              } else {
                console.log(`[eventService] "${event.title}" etkinliği için il belirlenemedi, adres: ${address}`);
                unidentifiedEvents.push(event);
              }
              
              return event;
            } else {
              console.log(`[eventService] "${address}" için koordinat bulunamadı, rastgele konum oluşturuluyor`);
              unidentifiedEvents.push(event);
              
              // Rastgele yakın bir konum ata
              const randomDistance = Math.random() * maxDistance * 0.8;
              const randomAngle = Math.random() * 2 * Math.PI;
              
              const offsetLat = randomDistance * Math.cos(randomAngle) / 111.32;
              const offsetLng = randomDistance * Math.sin(randomAngle) / (111.32 * Math.cos(latitude * Math.PI / 180));
              
              event.location.coordinates = [longitude + offsetLng, latitude + offsetLat];
              
              // Mesafeyi hesapla
              const distance = calculateDistance(latitude, longitude, latitude + offsetLat, longitude + offsetLng);
              event.distance = distance ? distance.toFixed(1) : null;
              
              return event;
            }
          } catch (error) {
            console.error(`[eventService] Etkinlik işlenirken hata: "${event.title}"`, error);
            unidentifiedEvents.push(event);
            return event;
          }
        });
        
        // İl bazlı istatistikler
        console.log('[eventService] İl bazlı etkinlik sayıları:');
        Object.entries(eventsByCity).forEach(([city, cityEvents]) => {
          console.log(`- ${city}: ${cityEvents.length} etkinlik`);
        });
        console.log(`- Tanımlanamayan etkinlikler: ${unidentifiedEvents.length}`);
        
        // Sadece maxDistance içindeki etkinlikleri filtrele
        const nearbyEvents = eventsWithCoordinates.filter(event => {
          const distance = parseFloat(event.distance);
          const isNearby = !isNaN(distance) && distance <= maxDistance;
          
          if (isNearby) {
            console.log(`[eventService] Yakında etkinlik bulundu: "${event.title}" - Mesafe: ${event.distance} km`);
          }
          
          return isNearby;
        });
        
        // Mesafeye göre sırala (yakından uzağa)
        nearbyEvents.sort((a, b) => {
          const distanceA = parseFloat(a.distance) || 999999;
          const distanceB = parseFloat(b.distance) || 999999;
          return distanceA - distanceB;
        });
        
        console.log(`[eventService] ${maxDistance}km içinde ${nearbyEvents.length} etkinlik filtrelendi`);
        
        // İl bazlı yakın etkinlik istatistikleri
        const nearbyCityStats = {};
        nearbyEvents.forEach(event => {
          const address = event.location.address || '';
          const cityName = findCityNameInAddress(address);
          
          if (cityName) {
            if (!nearbyCityStats[cityName]) {
              nearbyCityStats[cityName] = 0;
            }
            nearbyCityStats[cityName]++;
          }
        });
        
        console.log('[eventService] Yakındaki etkinlikler - il bazlı dağılım:');
        Object.entries(nearbyCityStats).forEach(([city, count]) => {
          console.log(`- ${city}: ${count} etkinlik`);
        });
        
        // Sayfalama için sınırla
        const paginatedEvents = nearbyEvents.slice(0, limit);
        
        return {
          success: true,
          data: paginatedEvents,
          pagination: {
            page: 1,
            limit: limit,
            total: nearbyEvents.length,
            pages: Math.ceil(nearbyEvents.length / limit)
          },
          message: `${maxDistance}km yakınınızdaki etkinlikler (${paginatedEvents.length}/${nearbyEvents.length})`
        };
      }
    }
    
    return {
      success: false,
      message: 'Yakındaki etkinlikler bulunamadı'
    };
  } catch (error) {
    console.error('[eventService] Yakındaki etkinlikler getirilirken hata:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Yakındaki etkinlikler yüklenirken bir hata oluştu'
    };
  }
};

/**
 * Adres metninden il adını bulmaya çalışır
 * @param {string} address - Adres metni
 * @returns {string|null} - İl adı veya null
 */
const findCityNameInAddress = (address) => {
  if (!address) return null;
  
  // Tüm il isimlerini kontrol et
  for (const city of Object.keys(TURKEY_CITY_COORDINATES)) {
    // Adres içinde il adı geçiyor mu
    if (address.toLowerCase().includes(normalizeText(city))) {
      return city;
    }
  }
  
  // Alternatif il isimlerini kontrol et
  const cityPatterns = {
    'istanbul': ['ist', 'istanbulda', 'istanbuldan'],
    'ankara': ['ank', 'ankarada', 'ankaradan'],
    'izmir': ['izm', 'izmirde', 'izmirden'],
    'bursa': ['bursada', 'bursadan'],
    'adana': ['adanada', 'adanadan'],
    'konya': ['konyada', 'konyadan'],
    'antalya': ['antalyada', 'antalyadan'],
    'elazığ': ['elazig', 'elâzığ', 'elazıg', 'elazı', 'elazığda', 'elazığdan'],
  };
  
  for (const [city, patterns] of Object.entries(cityPatterns)) {
    for (const pattern of patterns) {
      if (address.toLowerCase().includes(normalizeText(pattern))) {
        return capitalizeFirstLetter(city);
      }
    }
  }
  
  // Leaflet formatı için virgülle ayrılmış parçaları kontrol et
  const parts = address.split(/,\s*/);
  
  for (const part of parts) {
    // Merkez formatı kontrolü: "X Merkez" -> "X" ili
    if (part.toLowerCase().includes('merkez')) {
      const cityPart = part.split(/\s+/)[0]; // İlk kelime il adı olabilir
      
      // Bu kelime bir il adı mı?
      for (const city of Object.keys(TURKEY_CITY_COORDINATES)) {
        if (fuzzyMatch(cityPart, city)) {
          return city;
        }
      }
    }
    
    // Parçayı doğrudan il olarak kontrol et
    for (const city of Object.keys(TURKEY_CITY_COORDINATES)) {
      if (fuzzyMatch(part, city)) {
        return city;
      }
    }
  }
  
  return null;
};

 