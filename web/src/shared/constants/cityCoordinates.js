/**
 * Türkiye İlleri Koordinatları
 * Her il için enlem ve boylam bilgisini içerir
 */

const TURKEY_CITY_COORDINATES = {
  "Adana": { lat: 37.0000, lng: 35.3213 },
  "Adıyaman": { lat: 37.7648, lng: 38.2786 },
  "Afyonkarahisar": { lat: 38.7507, lng: 30.5567 },
  "Ağrı": { lat: 39.7191, lng: 43.0503 },
  "Amasya": { lat: 40.6499, lng: 35.8353 },
  "Ankara": { lat: 39.9208, lng: 32.8541 },
  "Antalya": { lat: 36.8841, lng: 30.7056 },
  "Artvin": { lat: 41.1828, lng: 41.8183 },
  "Aydın": { lat: 37.8560, lng: 27.8416 },
  "Balıkesir": { lat: 39.6484, lng: 27.8826 },
  "Bilecik": { lat: 40.1506, lng: 29.9803 },
  "Bingöl": { lat: 39.0626, lng: 40.7696 },
  "Bitlis": { lat: 38.4006, lng: 42.1095 },
  "Bolu": { lat: 40.7391, lng: 31.6089 },
  "Burdur": { lat: 37.7260, lng: 30.2886 },
  "Bursa": { lat: 40.1885, lng: 29.0610 },
  "Çanakkale": { lat: 40.1553, lng: 26.4142 },
  "Çankırı": { lat: 40.6013, lng: 33.6134 },
  "Çorum": { lat: 40.5506, lng: 34.9556 },
  "Denizli": { lat: 37.7765, lng: 29.0864 },
  "Diyarbakır": { lat: 37.9144, lng: 40.2306 },
  "Edirne": { lat: 41.6818, lng: 26.5623 },
  "Elazığ": { lat: 38.6810, lng: 39.2264 },
  "Erzincan": { lat: 39.7500, lng: 39.5000 },
  "Erzurum": { lat: 39.9000, lng: 41.2700 },
  "Eskişehir": { lat: 39.7767, lng: 30.5206 },
  "Gaziantep": { lat: 37.0662, lng: 37.3833 },
  "Giresun": { lat: 40.9128, lng: 38.3895 },
  "Gümüşhane": { lat: 40.4602, lng: 39.4813 },
  "Hakkari": { lat: 37.5742, lng: 43.7408 },
  "Hatay": { lat: 36.2025, lng: 36.1606 },
  "Isparta": { lat: 37.7626, lng: 30.5537 },
  "Mersin": { lat: 36.8000, lng: 34.6333 },
  "İstanbul": { lat: 41.0082, lng: 28.9784 },
  "İzmir": { lat: 38.4192, lng: 27.1287 },
  "Kars": { lat: 40.6000, lng: 43.1000 },
  "Kastamonu": { lat: 41.3887, lng: 33.7827 },
  "Kayseri": { lat: 38.7205, lng: 35.4894 },
  "Kırklareli": { lat: 41.7333, lng: 27.2167 },
  "Kırşehir": { lat: 39.1500, lng: 34.1667 },
  "Kocaeli": { lat: 40.8533, lng: 29.8815 },
  "Konya": { lat: 37.8715, lng: 32.4846 },
  "Kütahya": { lat: 39.4167, lng: 29.9833 },
  "Malatya": { lat: 38.3552, lng: 38.3095 },
  "Manisa": { lat: 38.6191, lng: 27.4289 },
  "Kahramanmaraş": { lat: 37.5858, lng: 36.9371 },
  "Mardin": { lat: 37.3126, lng: 40.7245 },
  "Muğla": { lat: 37.2153, lng: 28.3636 },
  "Muş": { lat: 38.7333, lng: 41.5058 },
  "Nevşehir": { lat: 38.6241, lng: 34.7141 },
  "Niğde": { lat: 37.9667, lng: 34.6833 },
  "Ordu": { lat: 40.9839, lng: 37.8764 },
  "Rize": { lat: 41.0201, lng: 40.5234 },
  "Sakarya": { lat: 40.7731, lng: 30.3943 },
  "Samsun": { lat: 41.2867, lng: 36.3313 },
  "Siirt": { lat: 37.9333, lng: 41.9500 },
  "Sinop": { lat: 42.0264, lng: 35.1551 },
  "Sivas": { lat: 39.7477, lng: 37.0179 },
  "Tekirdağ": { lat: 40.9833, lng: 27.5167 },
  "Tokat": { lat: 40.3167, lng: 36.5500 },
  "Trabzon": { lat: 41.0027, lng: 39.7178 },
  "Tunceli": { lat: 39.1079, lng: 39.5401 },
  "Şanlıurfa": { lat: 37.1591, lng: 38.7969 },
  "Uşak": { lat: 38.6823, lng: 29.4082 },
  "Van": { lat: 38.5012, lng: 43.3737 },
  "Yozgat": { lat: 39.8181, lng: 34.8147 },
  "Zonguldak": { lat: 41.4564, lng: 31.7987 },
  "Aksaray": { lat: 38.3687, lng: 34.0370 },
  "Bayburt": { lat: 40.2552, lng: 40.2249 },
  "Karaman": { lat: 37.1759, lng: 33.2287 },
  "Kırıkkale": { lat: 39.8468, lng: 33.5153 },
  "Batman": { lat: 37.8812, lng: 41.1351 },
  "Şırnak": { lat: 37.5164, lng: 42.4611 },
  "Bartın": { lat: 41.6344, lng: 32.3375 },
  "Ardahan": { lat: 41.1105, lng: 42.7022 },
  "Iğdır": { lat: 39.9167, lng: 44.0333 },
  "Yalova": { lat: 40.6500, lng: 29.2667 },
  "Karabük": { lat: 41.2061, lng: 32.6204 },
  "Kilis": { lat: 36.7184, lng: 37.1212 },
  "Osmaniye": { lat: 37.0742, lng: 36.2478 },
  "Düzce": { lat: 40.8438, lng: 31.1565 }
};

export default TURKEY_CITY_COORDINATES; 