/**
 * Socket.io bağlantı yönetimi
 * Web ve Mobil istemcilerden gelen socket bağlantılarını yönetir
 */

const Message = require('../models/Message');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const moderationService = require('../services/moderationService'); // Moderasyon servisi eklendi

const socketManager = (io) => {
  // Bağlı kullanıcıları izlemek için
  const connectedUsers = new Map();
  
  // Kimlik doğrulama middleware'i
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Kimlik doğrulama gerekli'));
      }
      
      // Token doğrulama
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (!decoded) {
        return next(new Error('Geçersiz token'));
      }
      
      // Kullanıcı bilgilerini ekle
      socket.userId = decoded.id;
      socket.username = decoded.username;
      
      next();
    } catch (error) {
      return next(new Error('Kimlik doğrulama hatası: ' + error.message));
    }
  });

  // Bağlantı olayını dinle
  io.on('connection', async (socket) => {
    console.log(`Yeni socket bağlantısı: ${socket.id} (${socket.username || 'Anonim'})`);
    
    try {
      // Kullanıcı bilgilerini al
      const user = await User.findById(socket.userId);
      
      if (user) {
        // Kullanıcıyı bağlı kullanıcılar listesine ekle
        connectedUsers.set(socket.userId, { socketId: socket.id, username: user.username });
        
        // Kullanıcıya özel bir odaya katılma
        socket.join(`user:${socket.userId}`);
        
        // Kullanıcının aktif olduğunu belirt
        io.emit('user_status', {
          userId: socket.userId,
          username: user.username,
          status: 'online'
        });
        
        console.log(`Kullanıcı bağlandı: ${user.username}`);
      }
    } catch (error) {
      console.error('Kullanıcı bilgileri alınırken hata:', error);
    }
    
    // Özel mesaj gönderme
    socket.on('private_message', async (data) => {
      try {
        const { recipientId, content, attachments, tempId } = data;
        
        // Moderasyon kontrolü
        console.log('Socket - Özel mesaj moderasyon kontrolü yapılıyor:', content);
        const moderationResult = await moderationService.checkInappropriateContent(content);
        
        if (moderationResult.isInappropriate) {
          console.log('Socket - Uygunsuz içerik tespit edildi, mesaj engellendi');
          // Kullanıcıya hata mesajı gönder
          socket.emit('error', { 
            message: moderationResult.message || 'Bu içerik uygunsuz ifadeler içeriyor. Lütfen dilinize dikkat ediniz.',
            tempId // Geçici ID'yi geri gönder, böylece istemci hangi mesajı kaldıracağını bilir
          });
          return; // İşlemi sonlandır
        }
        
        // Veritabanına mesajı kaydet
        const message = await Message.create({
          content,
          messageType: 'private',
          sender: socket.userId,
          recipient: recipientId,
          attachments: attachments || []
        });
        
        // Mesaj detaylarını getir
        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'username fullName profilePicture')
          .populate('recipient', 'username fullName profilePicture');
        
        // Geçici ID'yi ekle (istemcinin geçici mesajı güncelleyebilmesi için)
        const messageWithTempId = {
          ...populatedMessage.toObject(),
          tempId: tempId
        };
        
        // Gönderene mesajı ilet
        socket.emit('private_message', messageWithTempId);
        
        // Alıcı bağlı ise mesajı ilet
        if (connectedUsers.has(recipientId)) {
          io.to(`user:${recipientId}`).emit('private_message', populatedMessage);
        }
        
        console.log(`Özel mesaj gönderildi: ${socket.username} -> Alıcı: ${recipientId}`);
      } catch (error) {
        console.error('Özel mesaj gönderme hatası:', error);
        socket.emit('error', { 
          message: 'Mesaj gönderilemedi: ' + error.message,
          tempId: data.tempId // Hata durumunda geçici ID'yi geri gönder
        });
      }
    });
    
    // Etkinlik mesajı gönderme
    socket.on('event_message', async (data) => {
      try {
        const { eventId, content, attachments, tempId } = data;
        
        // Moderasyon kontrolü
        console.log('Socket - Etkinlik mesajı moderasyon kontrolü yapılıyor:', content);
        const moderationResult = await moderationService.checkInappropriateContent(content);
        
        if (moderationResult.isInappropriate) {
          console.log('Socket - Uygunsuz içerik tespit edildi, mesaj engellendi');
          // Kullanıcıya hata mesajı gönder
          socket.emit('error', { 
            message: moderationResult.message || 'Bu içerik uygunsuz ifadeler içeriyor. Lütfen dilinize dikkat ediniz.',
            tempId // Geçici ID'yi geri gönder
          });
          return; // İşlemi sonlandır
        }
        
        // Veritabanına mesajı kaydet
        const message = await Message.create({
          content,
          messageType: 'event',
          sender: socket.userId,
          event: eventId,
          attachments: attachments || []
        });
        
        // Mesaj detaylarını getir
        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'username fullName profilePicture')
          .populate('event', 'title');
        
        // Geçici ID'yi ekle (istemcinin geçici mesajı güncelleyebilmesi için)
        const messageWithTempId = {
          ...populatedMessage.toObject(),
          tempId: tempId
        };
        
        // Önce gönderene başarıyla kaydedildiğini bildir
        socket.emit('event_message', messageWithTempId);
        
        // Sonra etkinlik odasına mesajı ilet (gönderen hariç)
        socket.to(`event:${eventId}`).emit('event_message', populatedMessage);
        
        console.log(`Etkinlik mesajı gönderildi: ${socket.username} -> Etkinlik: ${eventId}`);
      } catch (error) {
        console.error('Etkinlik mesajı gönderme hatası:', error);
        socket.emit('error', { 
          message: 'Mesaj gönderilemedi: ' + error.message,
          tempId: data.tempId // Hata durumunda geçici ID'yi geri gönder
        });
      }
    });
    
    // Etkinlik odasına katılma
    socket.on('join_event', (eventId) => {
      socket.join(`event:${eventId}`);
      console.log(`Kullanıcı ${socket.username} etkinlik odasına katıldı: ${eventId}`);
    });
    
    // Etkinlik odasından ayrılma
    socket.on('leave_event', (eventId) => {
      socket.leave(`event:${eventId}`);
      console.log(`Kullanıcı ${socket.username} etkinlik odasından ayrıldı: ${eventId}`);
    });
    
    // Yazıyor bildirimi (özel mesaj)
    socket.on('typing_private', (data) => {
      const { recipientId, isTyping } = data;
      
      if (connectedUsers.has(recipientId)) {
        io.to(`user:${recipientId}`).emit('typing_private', {
          senderId: socket.userId,
          username: socket.username,
          isTyping
        });
      }
    });
    
    // Yazıyor bildirimi (etkinlik)
    socket.on('typing_event', (data) => {
      const { eventId, isTyping } = data;
      
      socket.to(`event:${eventId}`).emit('typing_event', {
        senderId: socket.userId,
        username: socket.username,
        isTyping
      });
    });
    
    // Bağlantı koptuğunda
    socket.on('disconnect', () => {
      // Kullanıcıyı bağlı kullanıcılar listesinden çıkar
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        
        // Kullanıcının çevrimdışı olduğunu bildir
        io.emit('user_status', {
          userId: socket.userId,
          username: socket.username,
          status: 'offline'
        });
        
        console.log(`Kullanıcı bağlantısı koptu: ${socket.username}`);
      } else {
        console.log(`Anonim bağlantı koptu: ${socket.id}`);
      }
    });
  });
};

module.exports = socketManager; 