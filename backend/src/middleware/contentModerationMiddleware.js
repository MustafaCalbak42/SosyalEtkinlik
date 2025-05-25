const moderationService = require('../services/moderationService');

/**
 * İçerik moderasyonu yapan middleware
 * Bu middleware, kullanıcı mesajlarında uygunsuz içerik olup olmadığını kontrol eder
 */
const moderateContent = async (req, res, next) => {
  try {
    // İstek içeriği yoksa devam et
    if (!req.body || !req.body.content) {
      return next();
    }

    const content = req.body.content;
    
    // Moderasyon servisini kullanarak içeriği kontrol et
    const moderationResult = await moderationService.checkInappropriateContent(content);
    
    // Uygunsuz içerik tespit edilirse istek engellenir
    if (moderationResult.isInappropriate) {
      return res.status(400).json({
        success: false,
        message: moderationResult.message
      });
    }
    
    // İçerik uygunsa isteğe devam edilir
    next();
  } catch (error) {
    console.error('Moderasyon middleware hatası:', error);
    // Hata durumunda isteğe izin ver (servis hatası kullanıcıyı engellemesin)
    next();
  }
};

/**
 * Detaylı içerik analizi yapan middleware
 * Bu middleware, içeriği analiz eder ve sonucu isteğe ekler
 */
const analyzeContentMiddleware = async (req, res, next) => {
  try {
    // İstek içeriği yoksa devam et
    if (!req.body || !req.body.content) {
      return next();
    }

    const content = req.body.content;
    
    // Moderasyon servisini kullanarak içeriği analiz et
    const analysisResult = await moderationService.analyzeContent(content);
    
    // Analiz sonucunu isteğe ekle
    req.contentAnalysis = analysisResult;
    
    // Uygunsuz içerik tespit edilirse ve sıkı moderasyon isteniyorsa engelle
    if (process.env.STRICT_MODERATION === 'true' && analysisResult.isInappropriate) {
      return res.status(400).json({
        success: false,
        message: 'Bu içerik uygunsuz olarak değerlendirildi',
        analysis: analysisResult
      });
    }
    
    // İsteğe devam et
    next();
  } catch (error) {
    console.error('İçerik analiz middleware hatası:', error);
    // Hata durumunda isteğe izin ver
    next();
  }
};

module.exports = {
  moderateContent,
  analyzeContentMiddleware
}; 