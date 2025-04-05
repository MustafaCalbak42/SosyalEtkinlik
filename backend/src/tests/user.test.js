const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server'); // Express app
const User = require('../models/User');

// Test veritabanı
let mongoServer;

// Test öncesi ayarlar
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

// Test sonrası temizlik
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

// Her test sonrası veritabanını temizle
afterEach(async () => {
  await User.deleteMany({});
});

describe('Kullanıcı API', () => {
  describe('POST /api/users/register', () => {
    it('Geçerli bilgilerle kullanıcı kaydı yapabilmeli', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test1234',
        fullName: 'Test User'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      // Yanıt kontrolü
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.username).toBe(userData.username);
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data.fullName).toBe(userData.fullName);
      expect(response.body.data).not.toHaveProperty('password');

      // Veritabanı kontrolü
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user.username).toBe(userData.username);
    });

    it('Eksik alanlarla kayıt yapılmamalı', async () => {
      const userData = {
        username: 'testuser',
        // email eksik
        password: 'Test1234',
        fullName: 'Test User'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeTruthy();
      
      // Kullanıcı oluşturulmadığını kontrol et
      const userCount = await User.countDocuments();
      expect(userCount).toBe(0);
    });

    it('Zayıf şifre ile kayıt yapılmamalı', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: '123456', // Sadece rakam içeriyor
        fullName: 'Test User'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeTruthy();
      // Şifre hatasını kontrol et
      expect(response.body.errors.some(err => 
        err.param === 'password' && err.msg.includes('harf')
      )).toBe(true);
    });

    it('Var olan email ile kayıt yapılmamalı', async () => {
      // Önce bir kullanıcı oluştur
      const user = new User({
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'Existing1234',
        fullName: 'Existing User'
      });
      await user.save();

      // Aynı email ile kayıt dene
      const userData = {
        username: 'testuser',
        email: 'existing@example.com', // Var olan email
        password: 'Test1234',
        fullName: 'Test User'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Kullanıcı zaten var');
    });
  });

  describe('POST /api/users/login', () => {
    it('Geçerli kimlik bilgileriyle giriş yapabilmeli', async () => {
      // Kullanıcı oluştur
      const user = new User({
        username: 'loginuser',
        email: 'login@example.com',
        password: 'Login1234',
        fullName: 'Login User'
      });
      await user.save();

      // Giriş yap
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'login@example.com',
          password: 'Login1234'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.username).toBe('loginuser');
    });

    it('Yanlış şifre ile giriş yapılmamalı', async () => {
      // Kullanıcı oluştur
      const user = new User({
        username: 'wrongpassuser',
        email: 'wrong@example.com',
        password: 'Correct1234',
        fullName: 'Wrong Pass User'
      });
      await user.save();

      // Yanlış şifre ile giriş dene
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'wrong@example.com',
          password: 'Wrong1234'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Geçersiz email veya şifre');
    });

    it('Var olmayan kullanıcı ile giriş yapılmamalı', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test1234'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Geçersiz email veya şifre');
    });
  });
}); 