const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server'); // Express app
const User = require('../models/User');
const crypto = require('crypto');

// Test veritabanı
let mongoServer;
let testUser;
let resetToken;

// Geliştirme için ortam değişkenlerini ayarla
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';

// Jest mock setup - emailService mock
jest.mock('../services/emailService', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'test-id' })
}));

// Test öncesi ayarlar
beforeAll(async () => {
  // MongoMemoryServer'ı test dosyasında kullanmak yerine,
  // mevcut bağlantıyı kullanacağız.
  // NOT: Bu, server.js içinde zaten bağlantı kurulduğu için
});

// Test sonrası temizlik
afterAll(async () => {
  // Bağlantıyı kapatmıyoruz çünkü diğer testler de kullanıyor
});

// Her test öncesi test kullanıcısı oluştur
beforeEach(async () => {
  await User.deleteMany({});
  
  // Test kullanıcısı oluştur
  testUser = await User.create({
    username: 'resetuser',
    email: 'reset@example.com',
    password: 'Reset1234',
    fullName: 'Reset User'
  });
});

describe('Şifre Sıfırlama Akışı Testleri', () => {
  
  it('Şifre sıfırlama isteği başlatılabilmeli', async () => {
    const response = await request(app)
      .post('/api/users/forgot-password')
      .send({ email: testUser.email })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('Şifre sıfırlama talimatları');

    // Kullanıcının güncellenmiş olduğunu kontrol et
    const updatedUser = await User.findById(testUser._id);
    expect(updatedUser.resetPasswordToken).toBeDefined();
    expect(updatedUser.resetPasswordExpire).toBeDefined();
    
    // Token'ı daha sonraki testler için sakla
    resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Kullanıcıyı güncelle (manuel olarak token'ı ayarla)
    await User.findByIdAndUpdate(testUser._id, {
      resetPasswordToken: hashedToken,
      resetPasswordExpire: Date.now() + 10 * 60 * 1000 // 10 dakika
    });
  });

  it('Olmayan kullanıcı için de başarılı cevap döndürmeli (güvenlik)', async () => {
    const response = await request(app)
      .post('/api/users/forgot-password')
      .send({ email: 'nonexistent@example.com' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('Şifre sıfırlama talimatları');
  });

  it('Şifre sıfırlama token\'ı doğrulanabilmeli', async () => {
    // Önce resetToken tanımlanmış mı kontrol et
    if (!resetToken) {
      throw new Error('resetToken tanımlanmamış, önceki testin çalıştığından emin olun');
    }

    const response = await request(app)
      .get(`/api/users/validate-reset-token/${resetToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Token geçerli');
  });

  it('Geçersiz token ile doğrulama yapılamamalı', async () => {
    const invalidToken = 'invalid-token';

    const response = await request(app)
      .get(`/api/users/validate-reset-token/${invalidToken}`)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Geçersiz');
  });

  it('Şifre sıfırlama işlemi tamamlanabilmeli', async () => {
    // Önce resetToken tanımlanmış mı kontrol et
    if (!resetToken) {
      throw new Error('resetToken tanımlanmamış, önceki testin çalıştığından emin olun');
    }

    const newPassword = 'NewPassword123';

    const response = await request(app)
      .post('/api/users/reset-password')
      .send({
        token: resetToken,
        password: newPassword
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('başarıyla sıfırlandı');
    expect(response.body.data).toHaveProperty('token');
    expect(response.body.data).toHaveProperty('refreshToken');

    // Kullanıcının token bilgilerinin silindiğini kontrol et
    const updatedUser = await User.findById(testUser._id);
    expect(updatedUser.resetPasswordToken).toBeUndefined();
    expect(updatedUser.resetPasswordExpire).toBeUndefined();

    // Yeni şifre ile giriş yapabilmeli
    const loginResponse = await request(app)
      .post('/api/users/login')
      .send({
        email: testUser.email,
        password: newPassword
      })
      .expect(200);

    expect(loginResponse.body.success).toBe(true);
    expect(loginResponse.body.data).toHaveProperty('token');
  });

  it('Şifre sıfırlama işlemi geçersiz token ile yapılamamalı', async () => {
    const invalidToken = 'invalid-token';
    const newPassword = 'NewPassword123';

    const response = await request(app)
      .post('/api/users/reset-password')
      .send({
        token: invalidToken,
        password: newPassword
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Geçersiz veya süresi dolmuş token');
  });
}); 