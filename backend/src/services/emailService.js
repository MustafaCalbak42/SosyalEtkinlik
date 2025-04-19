const nodemailer = require('nodemailer');

/**
 * Email servisi konfigürasyonu
 * Nodemailer kullanarak email gönderimi sağlar
 */

// Email transport konfigürasyonu
const createTransporter = async () => {
  // Geliştirme ortamında Ethereal.email kullanılır (ETHEREAL_EMAIL=true ise)
  if (process.env.ETHEREAL_EMAIL === 'true') {
    console.log('Ethereal Test E-posta hesabı oluşturuluyor...');
    try {
      // Test hesabı oluştur
      const testAccount = await nodemailer.createTestAccount();
      console.log('Test Mail Hesabı:', testAccount.user);
      
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
    } catch (error) {
      console.error('Ethereal hesabı oluşturma hatası:', error);
      throw new Error('Test e-posta ayarlarında sorun: ' + error.message);
    }
  } 
  
  // Gmail için SMTP ayarları
  console.log('Gmail SMTP sunucusu kullanılıyor:', process.env.EMAIL_HOST);
  
  // Gmail özel ayarları
  const transporterConfig = {
    service: 'gmail',  // 'gmail' servisi otomatik olarak doğru host ve port'u kullanır
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD // Gmail App Password kullanılmalı
    }
  };
  
  // Debug bilgisi için
  console.log('Gmail yapılandırması:');
  console.log('- Kullanıcı:', process.env.EMAIL_USER);
  console.log('- Şifre uzunluğu:', process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 0);
  
  const transporter = nodemailer.createTransport(transporterConfig);
  
  // SMTP bağlantısını test et
  try {
    await transporter.verify();
    console.log('✅ Gmail SMTP sunucusuna bağlantı başarılı! E-posta gönderimi hazır.');
    return transporter;
  } catch (error) {
    console.error('❌ Gmail SMTP sunucusuna bağlantı hatası:', error);
    console.log('Gmail şu hata mesajını döndürdü:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('🔑 Gmail kimlik bilgilerinizi kontrol edin. App Password kullandığınızdan emin olun!');
      console.log('📝 App Password oluşturmak için: https://myaccount.google.com/apppasswords');
    }
    
    if (error.message.includes('Less secure app')) {
      console.log('⚠️ Gmail artık "daha az güvenli uygulamalara erişim" özelliğini desteklemiyor.');
      console.log('📝 Bunun yerine App Password kullanmalısınız: https://myaccount.google.com/apppasswords');
    }
    
    throw new Error('Gmail SMTP bağlantı hatası: ' + error.message);
  }
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
      from: `${process.env.FROM_NAME || 'Sosyal Etkinlik'} <${process.env.FROM_EMAIL || process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html
    };

    console.log('Mail gönderiliyor:', {
      kime: options.to,
      konu: options.subject
    });

    // Email'i gönder
    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.ETHEREAL_EMAIL === 'true') {
      // Geliştirme ortamında test URL'sini yazdır
      console.log('Test email gönderildi!');
      console.log('Mail içeriği:', options.subject);
      console.log('Gönderi sonucu:', info.response);
      console.log('Test mail görüntüleme URL:', nodemailer.getTestMessageUrl(info));
      
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info)
      };
    } else {
      // Gerçek e-posta gönderimi için
      console.log('✅ E-posta başarıyla gönderildi!');
      console.log('Mail içeriği:', options.subject);
      console.log('Alıcı:', options.to);
      console.log('Mesaj ID:', info.messageId);
      console.log('Gmail yanıtı:', info.response);
      
      return {
        success: true,
        messageId: info.messageId
      };
    }
  } catch (error) {
    console.error('❌ Email gönderme hatası:', error);
    console.log('Hata detayları:', error.message);
    
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
    // Web yada mobil uygulama için uygun URL
    const clientUrl = process.env.CLIENT_URL_WEB || 'http://localhost:3000';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;
    
    // E-posta içeriği
    const mailOptions = {
      to: email,
      subject: 'Şifre Sıfırlama İsteği - Sosyal Etkinlik',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #333;">Şifre Sıfırlama</h2>
          <p>Merhaba ${name || 'Değerli Kullanıcımız'},</p>
          <p>Hesabınız için bir şifre sıfırlama isteği aldık. Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
          <p style="margin: 20px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Şifremi Sıfırla</a>
          </p>
          <p>Veya bu URL'yi tarayıcınızda açın:</p>
          <p>${resetUrl}</p>
          <p>Bu bağlantı 1 saat süreyle geçerlidir.</p>
          <p>Eğer bir şifre sıfırlama talebinde bulunmadıysanız, bu e-postayı dikkate almayın.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">Bu otomatik bir e-postadır, lütfen cevaplamayın.</p>
        </div>
      `
    };
    
    console.log('Şifre sıfırlama e-postası hazırlanıyor...');
    console.log('Alıcı:', email);
    
    // E-postayı gönder
    const emailResult = await sendEmail(mailOptions);
    
    if (emailResult.success) {
      console.log('Şifre sıfırlama e-postası gönderildi!');
      return emailResult;
    } else {
      throw new Error(emailResult.error || 'E-posta gönderim hatası');
    }
  } catch (error) {
    console.error('❌ Şifre sıfırlama e-postası gönderim hatası:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * E-posta doğrulama e-postası gönderir
 * @param {string} email - Kullanıcı e-posta adresi
 * @param {string} verificationToken - E-posta doğrulama token'ı
 * @param {string} name - Kullanıcı adı
 * @returns {Promise<Object>} E-posta gönderim sonucu
 */
const sendVerificationEmail = async (email, verificationToken, name) => {
  try {
    // Web yada mobil uygulama için uygun URL
    const clientUrl = process.env.CLIENT_URL_WEB || 'http://localhost:3000';
    const verificationUrl = `${clientUrl}/verify-email/${verificationToken}`;
    
    // E-posta içeriği
    const mailOptions = {
      to: email,
      subject: 'E-posta Adresinizi Doğrulayın - Sosyal Etkinlik',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #333;">E-posta Doğrulama</h2>
          <p>Merhaba ${name || 'Değerli Kullanıcımız'},</p>
          <p>Sosyal Etkinlik platformuna hoş geldiniz! Hesabınızı aktifleştirmek için lütfen aşağıdaki bağlantıya tıklayarak e-posta adresinizi doğrulayın:</p>
          <p style="margin: 20px 0;">
            <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">E-posta Adresimi Doğrula</a>
          </p>
          <p>Veya bu URL'yi tarayıcınızda açın:</p>
          <p>${verificationUrl}</p>
          <p>Bu bağlantı 24 saat süreyle geçerlidir.</p>
          <p>Eğer bu hesabı siz oluşturmadıysanız, bu e-postayı dikkate almayın.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">Bu otomatik bir e-postadır, lütfen cevaplamayın.</p>
        </div>
      `
    };
    
    console.log('E-posta doğrulama e-postası hazırlanıyor...');
    console.log('Alıcı:', email);
    
    // E-postayı gönder
    const emailResult = await sendEmail(mailOptions);
    
    if (emailResult.success) {
      console.log('E-posta doğrulama bağlantısı gönderildi!');
      return emailResult;
    } else {
      throw new Error(emailResult.error || 'E-posta gönderim hatası');
    }
  } catch (error) {
    console.error('❌ E-posta doğrulama e-postası gönderim hatası:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * E-posta adresinin geçerli olup olmadığını kontrol eden fonksiyon
 * @param {string} email - Kontrol edilecek e-posta adresi
 * @returns {boolean} - E-posta geçerli mi değil mi
 */
const isValidEmail = (email) => {
  // Basit bir e-posta regexp kontrolü
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  // Domain kontrolü - popüler e-posta sağlayıcıları
  const validDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 
    'aol.com', 'mail.com', 'protonmail.com', 'yandex.com', 'zoho.com',
    'gmx.com', 'live.com', 'msn.com', 'ymail.com', 'me.com'
  ];
  
  // Önce regex kontrolü yap
  if (!emailRegex.test(email)) {
    console.log('E-posta regex kontrolünden geçemedi:', email);
    return false;
  }
  
  // Domain kontrolü yap
  const domain = email.split('@')[1].toLowerCase();
  // Eğer domain validDomains listesinde varsa veya .edu uzantılı bir akademik e-posta ise geçerli
  const isValidDomain = validDomains.includes(domain) || domain.endsWith('.edu') || domain.endsWith('.edu.tr');
  
  console.log(`E-posta domain kontrolü: ${email} - ${isValidDomain ? 'Geçerli' : 'Geçersiz'}`);
  return isValidDomain;
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  isValidEmail
}; 