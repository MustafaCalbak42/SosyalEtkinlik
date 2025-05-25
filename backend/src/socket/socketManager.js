/**
 * Socket.io bağlantı yönetimi
 * Web ve Mobil istemcilerden gelen socket bağlantılarını yönetir
 */

const Message = require('../models/Message');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
        const { recipientId, content, attachments } = data;
        
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
        
        // Gönderene mesajı ilet
        socket.emit('private_message', populatedMessage);
        
        // Alıcı bağlı ise mesajı ilet
        if (connectedUsers.has(recipientId)) {
          io.to(`user:${recipientId}`).emit('private_message', populatedMessage);
        }
        
        console.log(`Özel mesaj gönderildi: ${socket.username} -> Alıcı: ${recipientId}`);
      } catch (error) {
        console.error('Özel mesaj gönderme hatası:', error);
        socket.emit('error', { message: 'Mesaj gönderilemedi: ' + error.message });
      }
    });
    
    // Etkinlik mesajı gönderme
    socket.on('event_message', async (data) => {
      try {
        const { eventId, content, attachments } = data;
        
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
        
        // Etkinlik odasına mesajı ilet
        io.to(`event:${eventId}`).emit('event_message', populatedMessage);
        
        console.log(`Etkinlik mesajı gönderildi: ${socket.username} -> Etkinlik: ${eventId}`);
      } catch (error) {
        console.error('Etkinlik mesajı gönderme hatası:', error);
        socket.emit('error', { message: 'Mesaj gönderilemedi: ' + error.message });
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