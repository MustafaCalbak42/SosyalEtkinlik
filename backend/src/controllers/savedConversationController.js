const SavedConversation = require('../models/SavedConversation');
const User = require('../models/User');

/**
 * Konuşma kaydet
 * @route POST /api/saved-conversations
 */
exports.saveConversation = async (req, res) => {
  try {
    const { targetUserId, note } = req.body;
    const ownerId = req.user.id;

    // Hedef kullanıcının varlığını kontrol et
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Hedef kullanıcı bulunamadı'
      });
    }

    // Kullanıcının kendisini kaydetmesini engelle
    if (targetUserId === ownerId) {
      return res.status(400).json({
        success: false,
        message: 'Kendinizi konuşma listesine ekleyemezsiniz'
      });
    }

    // Konuşma kaydını oluştur veya güncelle (upsert)
    let savedConversation = await SavedConversation.findOneAndUpdate(
      { owner: ownerId, targetUser: targetUserId },
      { note: note || '', lastMessageDate: new Date() },
      { new: true, upsert: true }
    );

    // Kullanıcı bilgileriyle birlikte döndür
    savedConversation = await SavedConversation.findById(savedConversation._id)
      .populate('targetUser', 'username fullName profilePicture email bio');

    res.status(201).json({
      success: true,
      message: 'Konuşma başarıyla kaydedildi',
      data: savedConversation
    });
  } catch (error) {
    console.error('Konuşma kaydetme hatası:', error);
    
    // Duplicate key hatası kontrolü
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bu kullanıcı zaten konuşma listenizde bulunuyor'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Konuşma kaydedilemedi',
      error: error.message
    });
  }
};

/**
 * Kaydedilmiş konuşmaları listele
 * @route GET /api/saved-conversations
 */
exports.getSavedConversations = async (req, res) => {
  try {
    const ownerId = req.user.id;

    // Kullanıcının tüm kaydedilmiş konuşmalarını getir
    const savedConversations = await SavedConversation.find({ owner: ownerId })
      .populate('targetUser', 'username fullName profilePicture email bio')
      .sort({ lastMessageDate: -1 });

    res.json({
      success: true,
      data: savedConversations
    });
  } catch (error) {
    console.error('Kaydedilmiş konuşmaları getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kaydedilmiş konuşmalar getirilemedi',
      error: error.message
    });
  }
};

/**
 * Kaydedilmiş konuşmayı sil
 * @route DELETE /api/saved-conversations/:id
 */
exports.deleteSavedConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;

    // Kaydedilmiş konuşmayı bul ve sil
    const deletedConversation = await SavedConversation.findOneAndDelete({
      _id: id,
      owner: ownerId
    });

    if (!deletedConversation) {
      return res.status(404).json({
        success: false,
        message: 'Kaydedilmiş konuşma bulunamadı veya bu işlem için yetkiniz yok'
      });
    }

    res.json({
      success: true,
      message: 'Konuşma başarıyla kaldırıldı'
    });
  } catch (error) {
    console.error('Kaydedilmiş konuşmayı silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Konuşma silinemedi',
      error: error.message
    });
  }
}; 