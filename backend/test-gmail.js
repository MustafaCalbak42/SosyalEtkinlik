// Gmail SMTP bağlantı testi
const nodemailer = require('nodemailer');

async function testGmailConnection() {
  try {
    console.log('Gmail SMTP bağlantısı test ediliyor...');
    
    const transporterConfig = {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'sosyaletkinlikapp@gmail.com',
        pass: 'vfucmesemwrbrjkl' // App Password
      },
      debug: true // Debug modunu açalım
    };
    
    console.log('Transporter oluşturuluyor...');
    const transporter = nodemailer.createTransport(transporterConfig);
    
    console.log('SMTP bağlantısı doğrulanıyor...');
    await transporter.verify();
    console.log('✅ SMTP bağlantısı başarılı!');
    
    console.log('Test e-postası gönderiliyor...');
    const info = await transporter.sendMail({
      from: 'Sosyal Etkinlik <sosyaletkinlikapp@gmail.com>',
      to: 'sosyaletkinlikapp@gmail.com', // Kendi adresinize gönderin
      subject: 'Test Email',
      html: '<p>Bu bir test e-postasıdır. Bu e-postayı görebiliyorsanız, e-posta gönderimi çalışıyor demektir.</p>'
    });
    
    console.log('✅ E-posta gönderildi!');
    console.log('Mesaj ID:', info.messageId);
    console.log('Kabul edilen alıcılar:', info.accepted);
    
    return true;
  } catch (error) {
    console.error('❌ HATA:', error);
    console.error('Hata mesajı:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('🔑 Kimlik doğrulama hatası! Gmail App Password\'ü kontrol edin.');
      console.error('📝 App Password oluşturmak için: https://myaccount.google.com/apppasswords');
    } else if (error.code === 'ESOCKET') {
      console.error('🔄 Bağlantı hatası! İnternet bağlantınızı veya güvenlik duvarı ayarlarını kontrol edin.');
    } else if (error.code === 'EENVELOPE') {
      console.error('✉️ Zarf hatası! Gönderen veya alıcı e-posta adreslerini kontrol edin.');
    }
    
    return false;
  }
}

// Testi çalıştır
testGmailConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ Gmail SMTP testi başarılı!');
    } else {
      console.log('\n❌ Gmail SMTP testi başarısız!');
    }
  })
  .catch(err => {
    console.error('Test sırasında beklenmeyen bir hata oluştu:', err);
  }); 