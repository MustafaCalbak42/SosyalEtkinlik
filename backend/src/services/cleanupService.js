const Event = require('../models/Event');
const User = require('../models/User');
const Hobby = require('../models/Hobby');

/**
 * Süresi dolmuş etkinlikleri otomatik temizleme servisi
 * @module cleanupService
 */

/**
 * Bitiş tarihi geçmiş etkinlikleri temizler
 * @async
 * @returns {Promise<{success: boolean, deletedCount: number, error: string|null}>} - İşlem sonucu
 */
const cleanupExpiredEvents = async () => {
  const now = new Date();
  
  try {
    console.log('🧹 Süresi dolmuş etkinlikler temizleniyor...');
    console.log(`🕒 Referans zaman: ${now.toISOString()}`);
    
    // Bitiş tarihi geçmiş etkinlikleri bul
    const expiredEvents = await Event.find({
      endDate: { $lt: now },
      status: { $ne: 'completed' } // Zaten tamamlanmış olarak işaretlenmemişse
    });
    
    if (expiredEvents.length === 0) {
      console.log('✅ Temizlenecek etkinlik bulunamadı');
      return { success: true, deletedCount: 0, error: null };
    }
    
    console.log(`🔍 ${expiredEvents.length} adet süresi dolmuş etkinlik bulundu`);
    
    let deletedCount = 0;
    let errorEvents = [];
    
    // Her bir etkinlik için temizleme işlemi yap
    for (const event of expiredEvents) {
      try {
        // Etkinliği silerken ilişkili verilerdeki referansları da temizle
        
        // 1. Etkinliğin organizatöründen bu etkinliği kaldır
        await User.findByIdAndUpdate(event.organizer, {
          $pull: { events: event._id }
        });
        
        // 2. Katılımcıların listesinden bu etkinliği kaldır
        for (const participant of event.participants) {
          await User.findByIdAndUpdate(participant.user, {
            $pull: { participatedEvents: event._id }
          });
        }
        
        // 3. Bağlı olduğu hobiden bu etkinliği kaldır
        await Hobby.findByIdAndUpdate(event.hobby, {
          $pull: { events: event._id }
        });
        
        // 4. Etkinliği sil
        await Event.deleteOne({ _id: event._id });
        
        console.log(`✅ Etkinlik silindi: ${event.title} (ID: ${event._id})`);
        deletedCount++;
      } catch (eventError) {
        console.error(`❌ Etkinlik silinemedi: ${event.title} (ID: ${event._id})`, eventError);
        errorEvents.push({
          eventId: event._id,
          eventTitle: event.title,
          error: eventError.message
        });
      }
    }
    
    console.log(`🧹 Temizleme tamamlandı. ${deletedCount} etkinlik silindi, ${errorEvents.length} etkinlik silinemedi.`);
    
    return {
      success: true,
      deletedCount,
      errors: errorEvents.length > 0 ? errorEvents : null
    };
  } catch (error) {
    console.error('❌ Etkinlik temizleme hatası:', error);
    return {
      success: false,
      deletedCount: 0,
      error: error.message
    };
  }
};

/**
 * Belirli aralıklarla temizlik yapmayı başlatır
 * @param {number} intervalMinutes - Kaç dakikada bir temizlik yapılacağı
 * @returns {NodeJS.Timeout} - Interval zamanlayıcısı
 */
const startCleanupSchedule = (intervalMinutes = 60) => {
  console.log(`🔄 Etkinlik temizleme zamanlayıcısı başlatıldı. Her ${intervalMinutes} dakikada bir çalışacak.`);
  
  // İlk temizliği hemen yap
  cleanupExpiredEvents();
  
  // Belirtilen aralıkta düzenli olarak temizlik yap
  const intervalMs = intervalMinutes * 60 * 1000;
  const timer = setInterval(cleanupExpiredEvents, intervalMs);
  
  return timer;
};

module.exports = {
  cleanupExpiredEvents,
  startCleanupSchedule
}; 