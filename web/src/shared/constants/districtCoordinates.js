/**
 * İstanbul İlçeleri Koordinatları
 * Her ilçe için enlem ve boylam bilgisini içerir
 */

const ISTANBUL_DISTRICT_COORDINATES = {
  // Avrupa Yakası
  "Beyoğlu": { lat: 41.0293, lng: 28.9769 },
  "Şişli": { lat: 41.0599, lng: 28.9866 },
  "Beşiktaş": { lat: 41.0430, lng: 29.0094 },
  "Bakırköy": { lat: 40.9795, lng: 28.8733 },
  "Fatih": { lat: 41.0186, lng: 28.9395 },
  "Eyüp": { lat: 41.0487, lng: 28.9322 },
  "Gaziosmanpaşa": { lat: 41.0570, lng: 28.9121 },
  "Kağıthane": { lat: 41.0819, lng: 28.9824 },
  "Sarıyer": { lat: 41.1669, lng: 29.0528 },
  "Zeytinburnu": { lat: 40.9923, lng: 28.9012 },
  "Bayrampaşa": { lat: 41.0394, lng: 28.9146 },
  "Güngören": { lat: 41.0019, lng: 28.8743 },
  "Esenler": { lat: 41.0457, lng: 28.8635 },
  "Bağcılar": { lat: 41.0319, lng: 28.8266 },
  "Bahçelievler": { lat: 40.9966, lng: 28.8536 },
  "Avcılar": { lat: 40.9748, lng: 28.7232 },
  "Küçükçekmece": { lat: 41.0038, lng: 28.7745 },
  "Başakşehir": { lat: 41.0874, lng: 28.8026 },
  "Beylikdüzü": { lat: 40.9900, lng: 28.6371 },
  "Esenyurt": { lat: 41.0259, lng: 28.6750 },
  "Arnavutköy": { lat: 41.1901, lng: 28.7394 },
  "Büyükçekmece": { lat: 41.0204, lng: 28.5920 },
  "Çatalca": { lat: 41.1433, lng: 28.4613 },
  "Silivri": { lat: 41.0709, lng: 28.2409 },
  
  // Anadolu Yakası
  "Kadıköy": { lat: 40.9906, lng: 29.0306 },
  "Üsküdar": { lat: 41.0274, lng: 29.0150 },
  "Maltepe": { lat: 40.9344, lng: 29.1273 },
  "Kartal": { lat: 40.8944, lng: 29.1865 },
  "Pendik": { lat: 40.8770, lng: 29.2573 },
  "Tuzla": { lat: 40.8135, lng: 29.2983 },
  "Ataşehir": { lat: 40.9892, lng: 29.1076 },
  "Ümraniye": { lat: 41.0221, lng: 29.0962 },
  "Beykoz": { lat: 41.1452, lng: 29.0996 },
  "Çekmeköy": { lat: 41.0366, lng: 29.1851 },
  "Sancaktepe": { lat: 40.9981, lng: 29.2359 },
  "Sultanbeyli": { lat: 40.9610, lng: 29.2722 },
  "Şile": { lat: 41.1777, lng: 29.6077 },
  "Adalar": { lat: 40.8714, lng: 29.0907 }
};

// Diğer büyük illerin popüler ilçeleri
const OTHER_DISTRICT_COORDINATES = {
  // Ankara
  "Çankaya": { lat: 39.9023, lng: 32.8636 },
  "Yenimahalle": { lat: 39.9659, lng: 32.7307 },
  "Keçiören": { lat: 39.9742, lng: 32.8501 },
  "Mamak": { lat: 39.9279, lng: 32.9043 },
  "Etimesgut": { lat: 39.9674, lng: 32.6772 },
  "Sincan": { lat: 39.9723, lng: 32.5820 },
  "Gölbaşı": { lat: 39.7930, lng: 32.8051 },
  
  // İzmir
  "Konak": { lat: 38.4228, lng: 27.1367 },
  "Karşıyaka": { lat: 38.4668, lng: 27.1114 },
  "Bornova": { lat: 38.4781, lng: 27.2189 },
  "Buca": { lat: 38.3857, lng: 27.1750 },
  "Çiğli": { lat: 38.5153, lng: 27.0742 },
  "Gaziemir": { lat: 38.3234, lng: 27.1388 },
  "Karabağlar": { lat: 38.3702, lng: 27.1236 },
  
  // Bursa
  "Osmangazi": { lat: 40.1996, lng: 29.0633 },
  "Nilüfer": { lat: 40.2196, lng: 28.9487 },
  "Yıldırım": { lat: 40.1938, lng: 29.1211 },
  
  // Antalya
  "Muratpaşa": { lat: 36.8919, lng: 30.7236 },
  "Konyaaltı": { lat: 36.8834, lng: 30.6356 },
  "Kepez": { lat: 37.0069, lng: 30.7289 },
  "Alanya": { lat: 36.5482, lng: 31.9977 },
  "Manavgat": { lat: 36.7733, lng: 31.4435 },
  "Kemer": { lat: 36.5942, lng: 30.5550 },
  
  // Adana
  "Seyhan": { lat: 37.0089, lng: 35.3092 },
  "Çukurova": { lat: 37.0624, lng: 35.3555 },
  "Yüreğir": { lat: 37.0277, lng: 35.3911 },
  
  // Diğer önemli turistik yerler
  "Bodrum": { lat: 37.0346, lng: 27.4305 },
  "Çeşme": { lat: 38.3242, lng: 26.3041 },
  "Marmaris": { lat: 36.8552, lng: 28.2705 },
  "Fethiye": { lat: 36.6610, lng: 29.1259 },
  "Kuşadası": { lat: 37.8579, lng: 27.2690 },
  "Didim": { lat: 37.3842, lng: 27.2673 },
  "Göreme": { lat: 38.6448, lng: 34.8291 }, // Kapadokya
  "Ürgüp": { lat: 38.6319, lng: 34.9145 }  // Kapadokya
};

const DISTRICT_COORDINATES = {
  ...ISTANBUL_DISTRICT_COORDINATES,
  ...OTHER_DISTRICT_COORDINATES
};

export default DISTRICT_COORDINATES; 