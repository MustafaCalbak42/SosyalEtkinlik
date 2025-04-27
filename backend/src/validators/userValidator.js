const { check } = require('express-validator');

// Kullanıcı kaydı doğrulama kuralları
const registerValidation = [
  check('username')
    .trim()
    .notEmpty().withMessage('Kullanıcı adı zorunludur')
    .isLength({ min: 3 }).withMessage('Kullanıcı adı en az 3 karakter olmalıdır')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir'),
  
  check('email')
    .trim()
    .notEmpty().withMessage('Email adresi zorunludur')
    .isEmail().withMessage('Geçerli bir email adresi giriniz')
    .normalizeEmail(),
  
  check('password')
    .trim()
    .notEmpty().withMessage('Şifre zorunludur')
    .isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalıdır')
    .matches(/\d/).withMessage('Şifre en az bir rakam içermelidir')
    .matches(/[a-z]/).withMessage('Şifre en az bir küçük harf içermelidir')
    .matches(/[A-Z]/).withMessage('Şifre en az bir büyük harf içermelidir'),
  
  check('fullName')
    .trim()
    .notEmpty().withMessage('Ad Soyad zorunludur')
    .isLength({ min: 3 }).withMessage('Ad Soyad en az 3 karakter olmalıdır')
];

// Kullanıcı girişi doğrulama kuralları
const loginValidation = [
  check('email')
    .trim()
    .notEmpty().withMessage('Email adresi zorunludur')
    .isEmail().withMessage('Geçerli bir email adresi giriniz')
    .normalizeEmail(),
  
  check('password')
    .trim()
    .notEmpty().withMessage('Şifre zorunludur')
];

// Profil güncelleme doğrulama kuralları
const updateProfileValidation = [
  check('fullName')
    .optional()
    .trim()
    .isLength({ min: 3 }).withMessage('Ad Soyad en az 3 karakter olmalıdır'),
  
  check('bio')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Biyografi en fazla 500 karakter olabilir'),
  
  check('interests')
    .optional()
    .isArray().withMessage('İlgi alanları bir dizi olmalıdır')
];

// Şifre değiştirme doğrulama kuralları
const changePasswordValidation = [
  check('currentPassword')
    .trim()
    .notEmpty().withMessage('Mevcut şifre zorunludur'),
  
  check('newPassword')
    .trim()
    .notEmpty().withMessage('Yeni şifre zorunludur')
    .isLength({ min: 6 }).withMessage('Yeni şifre en az 6 karakter olmalıdır')
    .matches(/\d/).withMessage('Yeni şifre en az bir rakam içermelidir')
    .matches(/[a-z]/).withMessage('Yeni şifre en az bir küçük harf içermelidir')
    .matches(/[A-Z]/).withMessage('Yeni şifre en az bir büyük harf içermelidir')
];

// Şifre sıfırlama isteği doğrulama kuralları
const forgotPasswordValidation = [
  check('email')
    .trim()
    .notEmpty().withMessage('Email adresi zorunludur')
    .isEmail().withMessage('Geçerli bir email adresi giriniz')
    .normalizeEmail()
];

// Şifre sıfırlama doğrulama kuralları
const resetPasswordValidation = [
  check('email')
    .trim()
    .notEmpty().withMessage('Email adresi zorunludur')
    .isEmail().withMessage('Geçerli bir email adresi giriniz')
    .normalizeEmail(),
    
  check('code')
    .optional()
    .trim()
    .isLength({ min: 6, max: 6 }).withMessage('Doğrulama kodu 6 haneli olmalıdır')
    .isNumeric().withMessage('Doğrulama kodu sadece rakamlardan oluşmalıdır'),
    
  check('verificationId')
    .optional()
    .trim()
    .notEmpty().withMessage('Doğrulama ID gereklidir'),
    
  check('password')
    .trim()
    .notEmpty().withMessage('Yeni şifre zorunludur')
    .isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalıdır')
    .matches(/\d/).withMessage('Şifre en az bir rakam içermelidir')
    .matches(/[a-z]/).withMessage('Şifre en az bir küçük harf içermelidir')
    .matches(/[A-Z]/).withMessage('Şifre en az bir büyük harf içermelidir')
];

module.exports = {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation
}; 