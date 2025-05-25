const Message = require('../models/Message');
const User = require('../models/User');
const Event = require('../models/Event');
const mongoose = require('mongoose');

/**
 * Özel mesaj gönder
 * @route POST /api/messages/private
 */
exports.sendPrivateMessage = async (req, res) => {
  try {
    const { recipientId, content, attachments } = req.body;
    const senderId = req.user.id;

    // Alıcı kullanıcıyı kontrol et
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Alıcı kullanıcı bulunamadı' });
    }

    // Mesajı oluştur
    const message = await Message.create({
      content,
      messageType: 'private',
      sender: senderId,
      recipient: recipientId,
      attachments: attachments || []
    });

    // Detaylı mesaj bilgisini getir
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username fullName profilePicture')
      .populate('recipient', 'username fullName profilePicture');

    res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    console.error('Mesaj gönderme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Mesaj gönderilemedi',
      error: error.message
    });
  }
};

/**
 * Etkinlik mesajı gönder
 * @route POST /api/messages/event
 */
exports.sendEventMessage = async (req, res) => {
  try {
    const { eventId, content, attachments } = req.body;
    const senderId = req.user.id;

    // Etkinliği kontrol et
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Etkinlik bulunamadı' });
    }

    // Kullanıcının etkinlik katılımcısı olup olmadığını kontrol et
    const isParticipant = event.participants.some(p => p.user.toString() === senderId) || 
                         event.organizer.toString() === senderId;

    if (!isParticipant) {
      return res.status(403).json({ message: 'Bu etkinliğe mesaj göndermek için katılımcı olmalısınız' });
    }

    // Mesajı oluştur
    const message = await Message.create({
      content,
      messageType: 'event',
      sender: senderId,
      event: eventId,
      attachments: attachments || []
    });

    // Detaylı mesaj bilgisini getir
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username fullName profilePicture')
      .populate('event', 'title');

    res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    console.error('Etkinlik mesajı gönderme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Etkinlik mesajı gönderilemedi',
      error: error.message
    });
  }
};

/**
 * Özel mesaj konuşmalarını getir
 * @route GET /api/messages/conversations
 */
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // MongoDB aggregation kullanarak konuşmaları grupla
    const conversations = await Message.aggregate([
      {
        // Kullanıcının gönderdiği veya aldığı mesajları bul
        $match: {
          messageType: 'private',
          $or: [
            { sender: mongoose.Types.ObjectId(userId) },
            { recipient: mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        // Mesajları konuşmalara göre grupla (diğer kullanıcıya göre)
        $group: {
          _id: {
            $cond: {
              if: { $eq: ['$sender', mongoose.Types.ObjectId(userId)] },
              then: '$recipient',
              else: '$sender'
            }
          },
          lastMessage: { $last: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$recipient', mongoose.Types.ObjectId(userId)] },
                  { $eq: ['$isRead', false] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      {
        // Konuşma bilgilerini getir
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$userDetails'
      },
      {
        // Sonuç şemasını düzenle
        $project: {
          _id: 1,
          userId: '$_id',
          username: '$userDetails.username',
          fullName: '$userDetails.fullName',
          profilePicture: '$userDetails.profilePicture',
          lastMessage: '$lastMessage.content',
          lastMessageDate: '$lastMessage.createdAt',
          unreadCount: 1
        }
      },
      {
        // Son mesaja göre sırala
        $sort: { lastMessageDate: -1 }
      }
    ]);

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Konuşma listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Konuşma listesi alınamadı',
      error: error.message
    });
  }
};

/**
 * Etkinlik konuşmalarını getir
 * @route GET /api/messages/events
 */
exports.getEventConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`[messageController] getEventConversations - Kullanıcı ID: ${userId}`);

    // Kullanıcı bilgilerini participatedEvents alanıyla birlikte getir
    const user = await User.findById(userId).select('participatedEvents');
    
    if (!user) {
      console.log(`[messageController] Kullanıcı bulunamadı - ID: ${userId}`);
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    // Kullanıcının katıldığı etkinlikleri kontrol et
    const participatedEventIds = user.participatedEvents || [];
    console.log(`[messageController] Kullanıcının katıldığı etkinlik sayısı: ${participatedEventIds.length}`);
    
    if (participatedEventIds.length === 0) {
      console.log(`[messageController] Kullanıcı henüz bir etkinliğe katılmamış - ID: ${userId}`);
      return res.json({
        success: true,
        data: [],
        message: 'Kullanıcı henüz bir etkinliğe katılmamış'
      });
    }

    // Kullanıcının katıldığı etkinlikleri bul
    const userEvents = await Event.find({
      $or: [
        { organizer: userId },
        { _id: { $in: participatedEventIds } },
        { 'participants.user': userId }
      ]
    }).select('_id title');
    
    console.log(`[messageController] Bulunan etkinlik sayısı: ${userEvents.length}`);
    
    if (userEvents.length === 0) {
      console.log(`[messageController] Kullanıcının katıldığı etkinlik bulunamadı - ID: ${userId}`);
      return res.json({
        success: true,
        data: [],
        message: 'Etkinlik bulunamadı'
      });
    }

    // Her etkinlik için son mesajı ve okunmamış mesaj sayısını bul
    const eventIds = userEvents.map(event => event._id);
    console.log(`[messageController] İşlenecek etkinlik ID'leri:`, eventIds);
    
    const eventConversations = await Promise.all(
      eventIds.map(async (eventId) => {
        // Son mesajı bul
        const lastMessage = await Message.findOne({ 
          event: eventId,
          messageType: 'event'
        })
        .sort({ createdAt: -1 })
        .populate('sender', 'username fullName profilePicture');
        
        // Okunmamış mesaj sayısını bul
        const unreadCount = await Message.countDocuments({
          event: eventId,
          messageType: 'event',
          sender: { $ne: userId },
          isRead: false
        });
        
        // Etkinlik bilgilerini bul
        const event = userEvents.find(e => e._id.toString() === eventId.toString());
        
        return {
          eventId,
          title: event.title,
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            sender: lastMessage.sender,
            createdAt: lastMessage.createdAt
          } : null,
          unreadCount
        };
      })
    );
    
    // Son mesaj tarihine göre sırala
    eventConversations.sort((a, b) => {
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
    });

    console.log(`[messageController] Etkinlik konuşmaları başarıyla getirildi - ${eventConversations.length} konuşma`);
    res.json({
      success: true,
      data: eventConversations
    });
  } catch (error) {
    console.error('[messageController] Etkinlik konuşmaları hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Etkinlik konuşmaları alınamadı',
      error: error.message
    });
  }
};

/**
 * Bir kullanıcı ile olan özel mesajları getir
 * @route GET /api/messages/private/:userId
 */
exports.getPrivateMessages = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;
    
    // Kullanıcıyı kontrol et
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    // İki kullanıcı arasındaki mesajları getir
    const messages = await Message.find({
      messageType: 'private',
      $or: [
        { sender: currentUserId, recipient: otherUserId },
        { sender: otherUserId, recipient: currentUserId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'username fullName profilePicture');
    
    // Okunmamış mesajları işaretle
    await Message.updateMany(
      {
        messageType: 'private',
        sender: otherUserId,
        recipient: currentUserId,
        isRead: false
      },
      { isRead: true }
    );
    
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Özel mesajlar hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Özel mesajlar alınamadı',
      error: error.message
    });
  }
};

/**
 * Bir etkinliğin mesajlarını getir
 * @route GET /api/messages/event/:eventId
 */
exports.getEventMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const eventId = req.params.eventId;
    
    // Etkinliği kontrol et
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Etkinlik bulunamadı' });
    }
    
    // Kullanıcının etkinlik katılımcısı olup olmadığını kontrol et
    const isParticipant = event.participants.some(p => p.user.toString() === userId) || 
                         event.organizer.toString() === userId;

    if (!isParticipant) {
      return res.status(403).json({ message: 'Bu etkinliğin mesajlarını görmek için katılımcı olmalısınız' });
    }
    
    // Etkinlik mesajlarını getir
    const messages = await Message.find({
      messageType: 'event',
      event: eventId
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'username fullName profilePicture');
    
    // Okunmamış mesajları işaretle
    await Message.updateMany(
      {
        messageType: 'event',
        event: eventId,
        sender: { $ne: userId },
        isRead: false
      },
      { isRead: true }
    );
    
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Etkinlik mesajları hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Etkinlik mesajları alınamadı',
      error: error.message
    });
  }
}; 