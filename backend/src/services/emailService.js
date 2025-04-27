const nodemailer = require('nodemailer');

/**
 * Email servisi konfigürasyonu
 * Nodemailer kullanarak email gönderimi sağlar
 */

// Hafızada doğrudan sıfırlama kodlarını tutar
let emailCache = {};

// Email transport konfigürasyonu
const createTransporter = async () => {
  try {
    console.log('Gmail SMTP transporter oluşturuluyor...');
    
    // Çevre değişkenlerini kontrol et
    const emailUser = process.env.EMAIL_USERNAME || 'sosyaletkinlikapp@gmail.com';
    const emailPass = process.env.EMAIL_PASSWORD;
    
    if (!emailPass || emailPass === 'your_app_password_here') {
      console.error('❌ E-posta şifresi geçerli değil veya ayarlanmamış!');
      console.log('Lütfen .env dosyasında EMAIL_PASSWORD değerini ayarlayın.');
      return null;
    }
    
    console.log('E-posta kullanıcı adı:', emailUser);
    console.log('E-posta şifresi uzunluğu:', emailPass.length);
    
    // Gmail SMTP yapılandırması - OAuth2 kullanmak daha güvenli
    const transporterConfig = {
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true: 465 portu için, false: diğer portlar için
      auth: {
        user: emailUser,
        pass: emailPass
      },
      tls: {
        rejectUnauthorized: false // Sertifika hatalarını yoksay - geçici olarak
      },
      debug: true, // Debug bilgilerini göster
      logger: true // Log bilgilerini göster
    };
    
    console.log('SMTP ayarları yapılandırıldı:');
    console.log('- Servis:', transporterConfig.service);
    console.log('- Host:', transporterConfig.host);
    console.log('- Port:', transporterConfig.port);
    
    const transporter = nodemailer.createTransport(transporterConfig);
    
    // SMTP bağlantısını test et
    console.log('SMTP bağlantısı doğrulanıyor...');
    await transporter.verify();
    console.log('✅ Gmail SMTP sunucusuna bağlantı başarılı! E-posta gönderimi hazır.');
    return transporter;
  } catch (error) {
    console.error('❌ SMTP bağlantı hatası:', error);
    console.log('SMTP şu hata mesajını döndürdü:', error.message);
    
    // Hataya göre özel mesajlar
    if (error.message.includes('Invalid login')) {
      console.log('💡 Geçersiz giriş bilgileri. Lütfen Gmail hesabınızda:');
      console.log('1. 2 Adımlı Doğrulamayı etkinleştirin');
      console.log('2. Bir "Uygulama Şifresi" oluşturun: https://myaccount.google.com/apppasswords');
      console.log('3. Oluşturduğunuz şifreyi .env dosyanıza ekleyin (boşluksuz)');
    } else if (error.message.includes('Username and Password not accepted')) {
      console.log('💡 Kullanıcı adı ve şifre kabul edilmedi:');
      console.log('1. Şifrenin doğru olduğundan emin olun');
      console.log('2. Normal Gmail şifrenizi değil, Uygulama Şifresini kullanın');
    }
    
    return null;
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
    
    if (!transporter) {
      console.log('⚠️ E-posta transporter oluşturulamadı!');
      // Artık hata fırlat, başarılı gibi davranma
      throw new Error('SMTP bağlantısı kurulamadı. E-posta gönderilemedi.');
    }
    
    // Email içeriği
    const mailOptions = {
      from: 'Sosyal Etkinlik <sosyaletkinlikapp@gmail.com>',
      to: options.to,
      subject: options.subject,
      html: options.html
    };

    console.log('Mail gönderiliyor:', {
      kime: options.to,
      konu: options.subject
    });

    // Email'i gönder
    console.log('SMTP ile e-posta gönderiliyor...');
    const info = await transporter.sendMail(mailOptions);
    
    // Gerçek e-posta gönderimi raporu
    console.log('✅ E-posta başarıyla gönderildi!');
    console.log('Alıcı:', options.to);
    console.log('Mesaj ID:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('❌ Email gönderme hatası:', error);
    console.log('Hata detayları:', error.message);
    
    // Artık hata döndür, başarılı gibi davranma
    return {
      success: false, 
      error: error.message
    };
  }
};

// Önbellek için doğrulama kodları ve şifre sıfırlama kodları
const verificationStore = {
  resetCodes: {}, // resetCodes[email] = { code, expires, name }
};

// Cache olarak şifre sıfırlama kodunu saklama
const cacheResetCode = (email, code, name, expiresIn = 15) => {
  verificationStore.resetCodes[email] = {
    code,
    expires: new Date(Date.now() + expiresIn * 60 * 1000), // dakika cinsinden
    name
  };
  
  // Ayrıca global emailCache'e de ekleyelim
  emailCache[email] = code;
  
  console.log('Şifre sıfırlama kodu önbelleğe alındı:', email);
  console.log('Kod:', code);
  console.log('Geçerlilik süresi:', expiresIn, 'dakika');
};

// Önbellekteki şifre sıfırlama kodunu kontrol et
const verifyResetCode = (email, code) => {
  const storedData = verificationStore.resetCodes[email];
  
  if (!storedData) {
    console.log('Bu e-posta için kayıtlı bir kod bulunamadı:', email);
    return { valid: false, message: 'Geçersiz kod' };
  }
  
  if (new Date() > storedData.expires) {
    console.log('Kodun süresi dolmuş:', email);
    delete verificationStore.resetCodes[email]; // Süresi dolmuş kodu temizle
    return { valid: false, message: 'Kodun süresi dolmuş' };
  }
  
  if (storedData.code !== code) {
    console.log('Kod eşleşmedi:', email);
    return { valid: false, message: 'Geçersiz kod' };
  }
  
  console.log('Kod doğrulandı:', email);
  // Doğrulama başarılı olduğunda kullanıcı adını da döndür
  return { 
    valid: true, 
    message: 'Kod doğrulandı',
    name: storedData.name 
  };
};

/**
 * Şifre sıfırlama e-postası gönderir
 * @param {string} email - Kullanıcı e-posta adresi
 * @param {string} resetToken - Şifre sıfırlama token'ı (artık kullanılmıyor)
 * @param {string} name - Kullanıcı adı
 * @returns {Promise<Object>} E-posta gönderim sonucu
 */
const sendPasswordResetEmail = async (email, resetToken, name) => {
  try {
    console.log(`${email} adresine şifre sıfırlama e-postası gönderme işlemi başlatıldı.`);
    
    // 6 haneli rastgele kod oluştur
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Kodu önbelleğe al
    cacheResetCode(email, resetCode, name);
    
    // E-posta içeriği
    const mailOptions = {
      to: email,
      subject: 'Şifre Sıfırlama Kodu - Sosyal Etkinlik',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #333;">Şifre Sıfırlama</h2>
          <p>Merhaba ${name || 'Değerli Kullanıcımız'},</p>
          <p>Hesabınız için şifre sıfırlama talebinde bulundunuz. Şifre sıfırlama işleminizi tamamlamak için aşağıdaki kodu kullanın:</p>
          <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px; text-align: center;">
            <h3 style="font-size: 24px; letter-spacing: 5px; margin: 0;">${resetCode}</h3>
          </div>
          <p>Bu kod 15 dakika süreyle geçerlidir.</p>
          <p>Eğer bu talebi siz gerçekleştirmediyseniz, lütfen hesabınızın güvenliğini kontrol edin ve bu e-postayı dikkate almayın.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">Bu otomatik bir e-postadır, lütfen cevaplamayın.</p>
        </div>
      `
    };
    
    // E-postayı gönder
    const emailResult = await sendEmail(mailOptions);
    
    if (!emailResult.success) {
      console.error(`Şifre sıfırlama e-postası gönderimi başarısız: ${emailResult.error}`);
      return {
        success: false,
        error: emailResult.error || 'E-posta gönderilemedi'
      };
    }
    
    console.log(`Şifre sıfırlama e-postası başarıyla gönderildi: ${email}`);
    
    // Yanıt olarak resetCode'u da döndür
    return {
      success: true,
      messageId: emailResult.messageId,
      resetCode: resetCode // Geliştirme ortamında göstermek için
    };
  } catch (error) {
    console.error('❌ Şifre sıfırlama e-postası gönderim hatası:', error);
    
    // Hatayı doğru şekilde raporla
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
    // 6 haneli doğrulama kodu oluştur
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Kodu önbelleğe al
    cacheResetCode(email, verificationCode, name, 60); // 60 dakika geçerli
    
    console.log('Oluşturulan doğrulama kodu:', verificationCode);
    
    // E-posta içeriği
    const mailOptions = {
      to: email,
      subject: 'E-posta Adresinizi Doğrulayın - Sosyal Etkinlik',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #333;">E-posta Doğrulama</h2>
          <p>Merhaba ${name || 'Değerli Kullanıcımız'},</p>
          <p>Sosyal Etkinlik platformuna kaydolduğunuz için teşekkür ederiz. Hesabınızı etkinleştirmek için aşağıdaki doğrulama kodunu kullanın:</p>
          <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px; text-align: center;">
            <h3 style="font-size: 24px; letter-spacing: 5px; margin: 0;">${verificationCode}</h3>
          </div>
          <p>Bu kod 60 dakika süreyle geçerlidir.</p>
          <p>Eğer bu hesabı siz oluşturmadıysanız, lütfen bu e-postayı dikkate almayın.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">Bu otomatik bir e-postadır, lütfen cevaplamayın.</p>
        </div>
      `
    };
    
    // E-postayı gönder
    const emailResult = await sendEmail(mailOptions);
    
    if (!emailResult.success) {
      console.error(`E-posta doğrulama kodu gönderimi başarısız: ${emailResult.error}`);
      return {
        success: false,
        error: emailResult.error || 'E-posta gönderilemedi'
      };
    }
    
    console.log(`E-posta doğrulama kodu başarıyla gönderildi: ${email}`);
    
    // Geliştirme modunda her zaman kodu içeren bir yanıt döndür
    return {
      success: true,
      messageId: emailResult.messageId,
      verificationCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined
    };
  } catch (error) {
    console.error('❌ E-posta doğrulama kodu gönderim hatası:', error);
    
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
  isValidEmail,
  verifyResetCode
}; 