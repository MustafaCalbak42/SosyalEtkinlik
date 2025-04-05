const { 
  generateToken, 
  verifyToken, 
  generateRefreshToken, 
  verifyRefreshToken 
} = require('../config/jwt');

// Test ortamı için ortam değişkenlerini ayarla
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';

describe('JWT Kimlik Doğrulama Testleri', () => {
  
  describe('Access Token Testleri', () => {
    it('Token oluşturabilmeli', () => {
      const payload = { id: '123456789012' };
      const token = generateToken(payload);
      
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT 3 parçadan oluşur
    });

    it('Token doğrulayabilmeli', () => {
      const payload = { id: '123456789012' };
      const token = generateToken(payload);
      
      const result = verifyToken(token);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id', payload.id);
      expect(result.data).toHaveProperty('iat'); // Issue At zaman damgası
      expect(result.data).toHaveProperty('exp'); // Expire zaman damgası
    });
    
    it('Geçersiz token doğrulanmamalı', () => {
      const invalidToken = 'invalid.token.string';
      
      const result = verifyToken(invalidToken);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('JsonWebTokenError');
    });
    
    it('Manipüle edilmiş token doğrulanmamalı', () => {
      const payload = { id: '123456789012' };
      const token = generateToken(payload);
      
      // Token'ın ortasını değiştir
      const parts = token.split('.');
      parts[1] = parts[1].replace('a', 'b');
      const manipulatedToken = parts.join('.');
      
      const result = verifyToken(manipulatedToken);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('JsonWebTokenError');
    });
  });
  
  describe('Refresh Token Testleri', () => {
    it('Refresh token oluşturabilmeli', () => {
      const userId = '123456789012';
      const refreshToken = generateRefreshToken(userId);
      
      expect(typeof refreshToken).toBe('string');
      expect(refreshToken.split('.').length).toBe(3);
    });
    
    it('Refresh token doğrulayabilmeli', () => {
      const userId = '123456789012';
      const refreshToken = generateRefreshToken(userId);
      
      const result = verifyRefreshToken(refreshToken);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id', userId);
    });
    
    it('Geçersiz refresh token doğrulanmamalı', () => {
      const invalidToken = 'invalid.refresh.token';
      
      const result = verifyRefreshToken(invalidToken);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('JsonWebTokenError');
    });
  });
}); 