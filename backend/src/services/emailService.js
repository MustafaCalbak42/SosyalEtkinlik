const nodemailer = require('nodemailer');

/**
 * Email servisi konfigürasyonu
 * Nodemailer kullanarak email gönderimi sağlar
 */

// Email transport konfigürasyonu
const createTransporter = async () => {
  // Önce Gmail SMTP kullanarak gerçek e-posta gönderimi dene
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD && process.env.ETHEREAL_EMAIL !== 'true') {
    console.log('Gmail SMTP transporter oluşturuluyor...');
    
    // SMTP ayarları
    const transporterConfig = {
      service: 'gmail',  // Gmail servisi kullanılıyor
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // Gmail App Password kullanılmalı
      }
    };
    
    console.log('SMTP ayarları:');
    console.log('- Kullanıcı:', process.env.EMAIL_USER);
    
    const transporter = nodemailer.createTransport(transporterConfig);
    
    // SMTP bağlantısını test et
    try {
      await transporter.verify();
      console.log('✅ Gmail SMTP sunucusuna bağlantı başarılı! Gerçek e-posta gönderimi hazır.');
      return transporter;
    } catch (error) {
      console.error('❌ Gmail SMTP bağlantı hatası:', error);
      console.log('SMTP şu hata mesajını döndürdü:', error.message);
      
      if (error.message.includes('Invalid login')) {
        console.log('🔑 Gmail kimlik bilgilerinizi kontrol edin. App Password kullandığınızdan emin olun!');
        console.log('📝 App Password oluşturmak için: https://myaccount.google.com/apppasswords');
      }
      
      console.log('⚠️ Gmail SMTP hatası nedeniyle Ethereal test sağlayıcısına geçiliyor...');
    }
  }
  
  // Gmail bağlantısı başarısız olduysa veya geliştirme ortamında isek Ethereal kullan
  console.log('⚠️ Ethereal test SMTP kullanılıyor...');
  
  try {
    // Sahte SMTP sunucusu oluştur
    const testAccount = await nodemailer.createTestAccount();
    
    // Test SMTP ayarları
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    
    console.log('✅ Test SMTP sunucusu yapılandırıldı.');
    console.log('👤 Test kullanıcı:', testAccount.user);
    
    return transporter;
  } catch (error) {
    console.error('❌ Ethereal test hesabı oluşturma hatası:', error);
    throw new Error('SMTP konfigürasyonu başarısız: ' + error.message);
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
      from: `${process.env.FROM_NAME || 'Sosyal Etkinlik'} <${process.env.EMAIL_USER || 'noreply@sosyaletkinlik.com'}>`,
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
    
    // Gerçek e-posta gönderimi raporu
    console.log('✅ E-posta başarıyla gönderildi!');
    console.log('Alıcı:', options.to);
    console.log('Mesaj ID:', info.messageId);
    
    // Ethereal test e-posta URL'si var mı kontrol et
    let previewUrl = null;
    if (info.messageId) {
      if (transporter.options && transporter.options.host === 'smtp.ethereal.email') {
        previewUrl = nodemailer.getTestMessageUrl(info);
      } else if (info.testMessageUrl) {
        previewUrl = info.testMessageUrl;
      }
      
      if (previewUrl) {
        console.log('Test e-posta önizleme URL\'si:', previewUrl);
      }
    }
    
    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl
    };
  } catch (error) {
    console.error('❌ Email gönderme hatası:', error);
    console.log('Hata detayları:', error.message);
    
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
      return emailResult;
    }
    
    console.log(`Şifre sıfırlama e-postası başarıyla gönderildi: ${email}`);
    return {
      ...emailResult,
      resetCode: process.env.NODE_ENV === 'development' ? resetCode : undefined
    };
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
    // API URL - Geliştirme ortamı kontrolü yaparak URL'yi ayarlıyoruz
    const apiUrl = process.env.API_URL || 'http://localhost:5000';
    
    // Doğrudan API URL'si (token parametresi ile)
    const apiVerificationUrl = `${apiUrl}/api/users/verify-email/${verificationToken}`;
    
    // Mobil deep link
    const mobileDeepLink = `sosyaletkinlik://verify-email/${verificationToken}`;
    
    console.log('Oluşturulan doğrulama URL:', apiVerificationUrl);
    console.log('Mobil deep link:', mobileDeepLink);
    
    // E-posta içeriği
    const mailOptions = {
      to: email,
      subject: 'E-posta Adresinizi Doğrulayın - Sosyal Etkinlik',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #333;">E-posta Doğrulama</h2>
          <p>Merhaba ${name || 'Değerli Kullanıcımız'},</p>
          <p>Sosyal Etkinlik platformuna hoş geldiniz! Hesabınızı aktifleştirmek için lütfen aşağıdaki bağlantıya tıklayarak e-posta adresinizi doğrulayın:</p>
          
          <div style="margin: 25px 0; text-align: center;">
            <a href="${apiVerificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">E-POSTA ADRESİMİ DOĞRULA</a>
          </div>
          
          <p><strong>ÖNEMLİ:</strong> Link çalışmazsa, aşağıdaki URL'yi tarayıcınıza kopyalayıp yapıştırın:</p>
          <p style="background: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">${apiVerificationUrl}</p>
          
          <div style="margin: 25px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px; border-left: 4px solid #1976d2;">
            <h4 style="margin-top: 0; color: #333;">Mobil Uygulama Kullanıcıları İçin</h4>
            <p>Mobil uygulama kullanıyorsanız, aşağıdaki butonu kullanın. Bu buton uygulamayı otomatik olarak açacaktır:</p>
            <div style="text-align: center; margin: 15px 0;">
              <a href="${mobileDeepLink}" style="display: inline-block; padding: 12px 24px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">MOBİL UYGULAMADA DOĞRULA</a>
            </div>
          </div>
          
          <p>Bu bağlantı <strong>24 saat</strong> süreyle geçerlidir.</p>
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
      
      // Ethereal test email ise preview URL'yi döndür
      if (emailResult.previewUrl) {
        return {
          success: true,
          messageId: emailResult.messageId,
          previewUrl: emailResult.previewUrl
        };
      }
      
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
  isValidEmail,
  verifyResetCode
}; 