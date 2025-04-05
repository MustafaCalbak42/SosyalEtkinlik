const nodemailer = require('nodemailer');

/**
 * Email servisi konfigürasyonu
 * Nodemailer kullanarak email gönderimi sağlar
 */

// Email transport konfigürasyonu
const createTransporter = async () => {
  // Geliştirme ortamında ethereal.email kullanılır
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    // Test hesabı oluştur
    const testAccount = await nodemailer.createTestAccount();
    
    // Geçici transporter oluştur
    return nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  } 
  
  // Üretim ortamında gerçek e-posta servisi kullanılır
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

/**
 * Email gönderme fonksiyonu
 * @param {Object} options - Email gönderimi için gerekli bilgiler
 * @returns {Promise} - Email gönderimi sonucu
 */
const sendEmail = async (options) => {
  try {
    const transporter = await createTransporter();
    
    // Email içeriği
    const mailOptions = {
      from: `${process.env.FROM_NAME || 'Sosyal Etkinlik'} <${process.env.FROM_EMAIL || process.env.EMAIL_USER || 'noreply@sosyaletkinlik.com'}>`,
      to: options.to,
      subject: options.subject,
      html: options.html
    };

    // Email'i gönder
    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      // Geliştirme ortamında test URL'sini yazdır
      console.log('Test email URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Email gönderme hatası:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Şifre sıfırlama e-postası gönderir
 * @param {string} email - Kullanıcı e-posta adresi
 * @param {string} resetToken - Şifre sıfırlama token'ı
 * @param {string} name - Kullanıcı adı
 * @returns {Promise<Object>} E-posta gönderim sonucu
 */
const sendPasswordResetEmail = async (email, resetToken, name) => {
  try {
    // Transporter oluştur
    const transporter = await createTransporter();
    
    // Web yada mobil uygulama için uygun URL
    const clientUrl = process.env.CLIENT_URL_WEB || 'http://localhost:3000';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;
    
    // E-posta içeriği
    const mailOptions = {
      from: `${process.env.FROM_NAME || 'Sosyal Etkinlik'} <${process.env.FROM_EMAIL || 'noreply@sosyaletkinlik.com'}>`,
      to: email,
      subject: 'Şifre Sıfırlama İsteği',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #333;">Şifre Sıfırlama</h2>
          <p>Merhaba ${name},</p>
          <p>Hesabınız için bir şifre sıfırlama isteği aldık. Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
          <p style="margin: 20px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Şifremi Sıfırla</a>
          </p>
          <p>Bu bağlantı 10 dakika süreyle geçerlidir.</p>
          <p>Eğer bir şifre sıfırlama talebinde bulunmadıysanız, bu e-postayı dikkate almayın.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">Bu otomatik bir e-postadır, lütfen cevaplamayın.</p>
        </div>
      `
    };
    
    // E-postayı gönder
    const info = await transporter.sendMail(mailOptions);
    
    // Test ortamında ise e-posta URL'sini göster
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      console.log('Test E-posta URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('E-posta gönderme hatası:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail
}; 