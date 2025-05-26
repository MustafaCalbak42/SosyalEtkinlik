/**
 * Moderasyon Servisi
 * Kullanıcı içeriğini kontrol eder ve uygunsuz içerikleri engeller.
 */

/**
 * İçeriği uygunsuz kelimeler açısından kontrol eder
 * @param {string} content - Kontrol edilecek metin içeriği
 * @returns {Promise<Object>} - Moderasyon sonucu
 */
const checkInappropriateContent = async (content) => {
  // Boş içerik kontrolü
  if (!content || content.trim() === '') {
    return {
      isInappropriate: true,
      message: 'Boş mesaj gönderilemez.'
    };
  }
  
  // Türkçe yasaklı kelimeler listesi
  const profanityList = [
    // Yaygın Türkçe küfürler (sansürlü)
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
  const isProfane = profanityList.some(word => normalizedContent.includes(word));
  
  if (isProfane) {
    return {
      isInappropriate: true,
      message: 'Mesajınızda uygunsuz ifadeler tespit edildi. Lütfen dilinize dikkat ediniz.'
    };
  }
  
  // İçeriğin uygun olduğunu belirt
  return {
    isInappropriate: false,
    message: 'İçerik uygun'
  };
};

/**
 * İçeriği daha detaylı analiz eder
 * @param {string} content - Analiz edilecek metin içeriği 
 * @returns {Promise<Object>} - Analiz sonucu
 */
const analyzeContent = async (content) => {
  // Temel analiz (şimdilik checkInappropriateContent ile aynı)
  const basicCheck = await checkInappropriateContent(content);
  
  // Analiz sonuçlarını genişlet
  return {
    ...basicCheck,
    contentLength: content ? content.length : 0,
    timestamp: new Date(),
    toxicityScore: basicCheck.isInappropriate ? 0.8 : 0.1, // 0-1 arası, yüksek değer daha toksik
    categories: {
      profanity: basicCheck.isInappropriate,
      harassment: false,
      hate: false,
      selfHarm: false,
      sexual: false,
      violence: false
    }
  };
};

/**
 * Moderasyon hatası mesajlarını formatlar
 * @param {string} error - Hata mesajı
 * @returns {string} - Formatlanmış mesaj
 */
const formatError = (error) => {
  return `Moderasyon hatası: ${error}`;
};

module.exports = {
  checkInappropriateContent,
  analyzeContent,
  formatError
}; 