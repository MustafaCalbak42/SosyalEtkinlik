/**
 * Moderasyon Servisi
 * Kullanıcının gönderdiği mesajları kontrol eden ve uyarı mesajları gösteren servis
 */

/**
 * Yerel kelime kontrolü yapan fonksiyon
 * Basit yasaklı kelimeler listesi üzerinden ilk kontrol yapılır
 * 
 * @param {string} content - Kontrol edilecek metin içeriği
 * @returns {boolean} - İçeriğin uygunsuz olup olmadığı
 */
const localProfanityCheck = (content) => {
  if (!content) return false;
  
  // Türkçe yasaklı kelimeler listesi
  const profanityList = [
    // Yaygın Türkçe küfürler (sansürlü yazdım)
    'sik', 'sikik', 'sikim', 'salak', 'mal', 'gerizekalı', 'aptal', 'gavat', 'amcık', 'amına', 
    'oç', 'oc', 'orospu', 'piç', 'pic', 'ibne', 'yarak', 'yarrak', 'göt', 'got', 'am', 'amk',
    'aq', 'mk', 'awk', 'pezevenk', 'dangalak', 'siktir', 'haysiyetsiz', 'orusbu', 'orosbu',
    'amq', 'anan', 'avrad', 's*kim', 'a*k', 'p*ç', 's*ktir', 'bok', 'boktan', 'puşt', 'ibnelik',
    'hıyar', 'zıkkım', 'taşak', 'dalyarak', 'amcik', 'serefsiz', 'şerefsiz', 'pipi', 'çük', 'cük',
    'sürtük', 'orsp', 'orsp çocuğu', 'süt', 'kahpe', 'kahb', 'g*t', 'götveren', 'sokuk',
    // Küfür yazım varyasyonları
    's1k', '51k', 's1kt1r', 'sikt1r', 'sıktır', 'amq', 'a.m.k', 'a.q', 'a*ına', 'amc*k',
    'a.m.c.ı.k', 'o.ç', 'o.r.s.p.u', 'p.i.ç', 'y.r.k', 'g.ö.t',
    // Bileşik kelimeler
    'ananı', 'bacını', 'avradını', 'allahını', 'sülaleni', 'sg'
  ];
  
  const normalizedContent = content.toLowerCase();
  
  // Yasaklı kelimeleri kontrol et
  return profanityList.some(word => normalizedContent.includes(word));
};

/**
 * İçeriği kullanıcıya göstermeden önce kontrol eden fonksiyon
 * 
 * @param {string} content - Kontrol edilecek metin içeriği
 * @returns {Object} - Kontrol sonucu
 */
const checkContentBeforeSend = (content) => {
  // Boş içerik kontrolü
  if (!content || content.trim() === '') {
    return {
      isValid: false,
      message: 'Boş mesaj gönderemezsiniz.'
    };
  }
  
  // Basit yerel kontrol yap
  const isProfane = localProfanityCheck(content);
  
  if (isProfane) {
    return {
      isValid: false,
      message: 'Mesajınızda uygunsuz ifadeler olabilir. Lütfen dilinize dikkat ediniz.'
    };
  }
  
  return {
    isValid: true
  };
};

/**
 * API yanıtındaki moderasyon hata mesajlarını formatlar
 * 
 * @param {Object} error - API hata yanıtı
 * @returns {string} - Kullanıcıya gösterilecek mesaj
 */
const formatModerationError = (error) => {
  // API'den gelen moderasyon hatası
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  // Genel hata mesajı
  return 'Mesajınız gönderilemedi. Lütfen içeriğinizi kontrol ediniz.';
};

/**
 * Kullanıcıya moderasyon uyarısı gösterir
 * 
 * @param {Object} options - Uyarı seçenekleri
 * @param {Function} options.showAlert - Uyarı gösterme fonksiyonu
 * @param {string} options.message - Gösterilecek mesaj
 */
const showModerationWarning = ({ showAlert, message }) => {
  showAlert({
    severity: 'warning',
    message: message || 'Mesajınızda uygunsuz içerik tespit edildi. Lütfen dilinize dikkat ediniz.',
    duration: 5000
  });
};

export default {
  checkContentBeforeSend,
  formatModerationError,
  showModerationWarning
}; 