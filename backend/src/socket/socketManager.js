/**
 * Socket.io bağlantı yönetimi
 * Web ve Mobil istemcilerden gelen socket bağlantılarını yönetir
 */

const socketManager = (io) => {
  // Bağlantı olayını dinle
  io.on('connection', (socket) => {
    console.log(`Yeni socket bağlantısı: ${socket.id}`);
    
    // Kullanıcı bilgilerini sakla
    let currentUser = null;
    
    // Kullanıcı kimlik doğrulama
    socket.on('authenticate', (userData) => {
      // Gerçek uygulamada bu token doğrulaması ile yapılmalı
      currentUser = {
        userId: userData.userId,
        username: userData.username,
        socketId: socket.id
      };
      
      console.log(`Kullanıcı kimliği doğrulandı: ${currentUser.username}`);
      
      // Kullanıcıya özel bir odaya katılma
      socket.join(`user:${currentUser.userId}`);
      
      // Kullanıcıya başarılı kimlik doğrulama bildirimi
      socket.emit('authenticated', { success: true });
    });
    
    // Sohbet odasına katılma
    socket.on('join_room', (roomId) => {
      if (!currentUser) {
        socket.emit('error', { message: 'Önce kimlik doğrulaması yapmalısınız' });
        return;
      }
      
      socket.join(roomId);
      console.log(`Kullanıcı ${currentUser.username} odaya katıldı: ${roomId}`);
      
      // Odadaki diğer kullanıcılara bildirim
      socket.to(roomId).emit('user_joined', {
        userId: currentUser.userId,
        username: currentUser.username
      });
    });
    
    // Mesaj gönderme
    socket.on('send_message', (data) => {
      if (!currentUser) {
        socket.emit('error', { message: 'Önce kimlik doğrulaması yapmalısınız' });
        return;
      }
      
      console.log(`Mesaj alındı [${data.roomId}]: ${data.message}`);
      
      // Gönderilen mesaj bilgilerini zenginleştirme
      const messageData = {
        ...data,
        sender: {
          userId: currentUser.userId,
          username: currentUser.username
        },
        timestamp: new Date()
      };
      
      // Odadaki tüm kullanıcılara mesajı gönder (gönderen dahil)
      io.to(data.roomId).emit('receive_message', messageData);
    });
    
    // Yazıyor bildirimi
    socket.on('typing', (data) => {
      if (!currentUser) return;
      
      // Odadaki diğer kullanıcılara yazıyor bildirimini gönder (gönderen hariç)
      socket.to(data.roomId).emit('user_typing', {
        userId: currentUser.userId,
        username: currentUser.username,
        isTyping: data.isTyping
      });
    });
    
    // Etkinlik bildirimlerini dinleme
    socket.on('event_notification', (data) => {
      if (!currentUser) return;
      
      // Etkinliğe katılan kullanıcılara bildirim gönder
      if (data.participants && Array.isArray(data.participants)) {
        data.participants.forEach(userId => {
          io.to(`user:${userId}`).emit('notification', {
            type: 'event',
            title: data.title,
            message: data.message,
            eventId: data.eventId,
            timestamp: new Date()
          });
        });
      }
    });
    
    // Bağlantı koptuğunda
    socket.on('disconnect', () => {
      if (currentUser) {
        console.log(`Kullanıcı bağlantısı koptu: ${currentUser.username}`);
        // Gerekli temizlik işlemleri...
      } else {
        console.log(`Anonim bağlantı koptu: ${socket.id}`);
      }
    });
  });
};

module.exports = socketManager; 