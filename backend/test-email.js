// E-posta gönderim testi
require('dotenv').config();
const emailService = require('./src/services/emailService');

async function testEmail() {
  try {
    console.log('E-posta testi başlatılıyor...');
    
    const result = await emailService.sendEmail({
      to: 'test@example.com',
      subject: 'Test E-posta',
      html: '<p>Bu bir test e-postasıdır. Bu e-postayı görebiliyorsanız, e-posta gönderimi çalışıyor demektir.</p>'
    });
    
    console.log('Test sonucu:', result);
  } catch (error) {
    console.error('Hata:', error);
  }
}

testEmail(); 