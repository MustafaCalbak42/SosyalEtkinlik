const User = require('../models/User');
const { validationResult } = require('express-validator');
const { generateToken, generateRefreshToken } = require('../config/jwt');
const { sendPasswordResetEmail, sendVerificationEmail, isValidEmail, verifyResetCode } = require('../services/emailService');
const crypto = require('crypto');
const emailService = require('../services/emailService');

// Geliştirme ortamını zorlayalım
process.env.NODE_ENV = 'development';

/**
 * @desc    Kullanıcı kaydı
 * @route   POST /api/users/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  // Validasyon hatalarını kontrol et
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }

  console.log('Kayıt isteği alındı, body:', req.body);
  console.log('Yüklenen dosya:', req.file);
  
  // JSON string olarak gelen verileri parse et
  let hobbies = [];
  let location = null;
  let interests = [];
  
  if (req.body.hobbies) {
    try {
      hobbies = typeof req.body.hobbies === 'string' ? JSON.parse(req.body.hobbies) : req.body.hobbies;
      console.log('Parse edilen hobiler:', hobbies);
    } catch (error) {
      console.error('Hobi parse hatası:', error);
      hobbies = [];
    }
  }
  
  if (req.body.location) {
    try {
      location = typeof req.body.location === 'string' ? JSON.parse(req.body.location) : req.body.location;
      console.log('Parse edilen konum:', location);
    } catch (error) {
      console.error('Konum parse hatası:', error);
      location = null;
    }
  }
  
  if (req.body.interests) {
    try {
      interests = typeof req.body.interests === 'string' ? JSON.parse(req.body.interests) : req.body.interests;
      console.log('Parse edilen ilgi alanları:', interests);
    } catch (error) {
      console.error('İlgi alanları parse hatası:', error);
      interests = [];
    }
  }

  const { username, email, password, fullName } = req.body;

  try {
    console.log(`Yeni kullanıcı kaydı işleniyor: ${email}`);
    
    // E-posta geçerlilik kontrolü
    if (!isValidEmail(email)) {
      console.log(`Geçersiz email formatı: ${email}`);
      return res.status(400).json({
        success: false,
        message: 'Geçersiz e-posta adresi. Lütfen geçerli bir e-posta adresi girin.'
      });
    }

    // Email veya kullanıcı adı zaten var mı kontrolü
    let userExists = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (userExists) {
      console.log(`Kullanıcı zaten var: ${email} veya ${username}`);
      return res.status(400).json({ 
        success: false,
        message: 'Kullanıcı zaten var - bu email veya kullanıcı adı kullanılıyor' 
      });
    }

    // E-posta doğrulama token'ı oluştur
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Token'ı hashle
    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    // Yeni kullanıcı oluştur
    console.log(`Yeni kullanıcı oluşturuluyor: ${username}, ${email}`);
    
    // Location verisini kontrol et ve düzenle
    let finalLocation = {
      type: 'Point',
      coordinates: [0, 0],
      address: ''
    };
    
    if (location) {
      console.log('Parse edilen konum bilgisi:', location);
      finalLocation = {
        type: location.type || 'Point',
        coordinates: location.coordinates || [0, 0],
        address: location.address || ''
      };
    } else if (req.body.city) {
      // Eski istemciler için city alanını kontrol et
      finalLocation.address = req.body.city;
    }
    
    console.log('Kullanıcı için ayarlanan konum:', finalLocation);
    
    // Profil fotoğrafı yolu
    let profilePicturePath = '';
    if (req.file) {
      profilePicturePath = req.file.path.replace(/\\/g, '/').replace('public/', '');
      console.log('Profil fotoğrafı yüklendi:', profilePicturePath);
    }
    
    const user = new User({
      username,
      email,
      password, // Model içinde hash edilecek
      fullName,
      lastActive: new Date(),
      emailVerified: false,
      verificationToken: hashedToken,
      verificationTokenExpire: Date.now() + 60 * 60 * 1000, // 60 dakika
      
      // Diğer kullanıcı verilerini ekleyelim
      bio: req.body.bio || '',
      hobbies: hobbies || [],
      interests: interests || [],
      location: finalLocation,
      profilePicture: profilePicturePath
    });
    
    console.log('Kullanıcı oluşturuldu, hobiler:', hobbies);

    try {
      await user.save();
      console.log(`Kullanıcı veritabanına kaydedildi: ${user._id}`);
      
      // Eğer profil fotoğrafı yüklendiyse, dosya adını kullanıcı ID'si ile güncelle
      if (req.file && user._id) {
        const fs = require('fs');
        const path = require('path');
        
        const oldPath = req.file.path;
        const fileExtension = path.extname(req.file.originalname);
        const newFileName = `profile-${user._id}-${Date.now()}${fileExtension}`;
        const newPath = path.join('public/uploads/profiles', newFileName);
        
        try {
          // Dosyayı yeni isimle taşı
          fs.renameSync(oldPath, newPath);
          
          // Kullanıcının profil fotoğrafı yolunu güncelle
          const updatedProfilePicturePath = newPath.replace(/\\/g, '/').replace('public/', '');
          user.profilePicture = updatedProfilePicturePath;
          await user.save();
          
          console.log('Profil fotoğrafı dosya adı güncellendi:', updatedProfilePicturePath);
        } catch (fileError) {
          console.error('Profil fotoğrafı dosya adı güncellenirken hata:', fileError);
          // Dosya hatası kayıt işlemini etkilemez
        }
      }
    } catch (mongoError) {
      console.error('MongoDB kayıt hatası:', mongoError);
      return res.status(500).json({ 
        success: false,
        message: 'Kullanıcı kaydedilirken bir hata oluştu',
        error: process.env.NODE_ENV === 'development' ? mongoError.message : undefined
      });
    }

    // Doğrulama e-postası gönder
    let emailResult;
    try {
      console.log(`Doğrulama e-postası gönderiliyor: ${user.email}`);
      emailResult = await sendVerificationEmail(
        user.email,
        verificationToken,
        user.fullName
      );
      console.log('Email gönderim sonucu:', emailResult);
      
      // E-posta gönderimi başarısız olduysa
      if (!emailResult.success) {
        console.error('E-posta gönderilirken hata:', emailResult.error);
        // Bu noktada kullanıcı zaten veritabanına kaydedildi,
        // ancak doğrulama e-postası gönderilemedi.
        return res.status(201).json({
          success: true,
          message: 'Kullanıcı kaydedildi, ancak doğrulama e-postası gönderilemedi. Lütfen daha sonra yeniden doğrulama isteyin.',
          data: {
            _id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            profilePicture: user.profilePicture,
            emailVerified: user.emailVerified
          },
          emailSent: false,
          error: emailResult.error
        });
      }
    } catch (emailError) {
      console.error('E-posta gönderim hatası:', emailError);
      // E-posta hatası olsa bile devam et
      emailResult = { 
        success: false, 
        error: emailError.message || 'E-posta gönderilemedi'
      };
    }

    // E-posta doğrulama talimatlarıyla cevap ver
    const responseData = {
      success: true,
      message: emailResult.success
        ? 'Kayıt başarılı! E-posta adresinize gönderilen doğrulama kodu ile hesabınızı aktifleştirin.'
        : 'Kayıt başarılı, fakat doğrulama e-postası gönderilirken bir hata oluştu. Lütfen daha sonra yeniden doğrulama kodu isteyin.',
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        profilePicture: user.profilePicture,
        emailVerified: user.emailVerified
      },
      emailSent: emailResult.success,
      platform: req.headers['user-agent'] && req.headers['user-agent'].includes('Expo') ? 'mobile' : 'web'
    };

    // Sadece geliştirme modunda geliştirici bilgisini ekle
    if (process.env.NODE_ENV === 'development') {
      const developerInfo = {
        note: 'Doğrulama kodu bilgisi'
      };

      // Doğrulama kodunu sadece geliştirme modunda göster
      if (emailResult.verificationCode) {
        developerInfo.verificationCode = emailResult.verificationCode;
      }

      responseData.developerInfo = developerInfo;
    }

    // Yanıt ekranında görüntülenecek ek bilgiler
    responseData.uiMessage = {
      title: emailResult.success ? 'Kayıt Başarılı!' : 'Kayıt Tamamlandı',
      body: emailResult.success
        ? `${user.email} adresine bir doğrulama kodu gönderdik. Lütfen e-posta kutunuzu kontrol edin ve doğrulama kodunu girerek hesabınızı doğrulayın.`
        : 'Hesabınız oluşturuldu ancak doğrulama e-postası gönderilemedi. Giriş yaptıktan sonra yeni bir doğrulama kodu isteyebilirsiniz.',
      type: emailResult.success ? 'success' : 'warning'
    };

    res.status(201).json(responseData);
  } catch (error) {
    console.error('Kullanıcı kaydı hatası:', error);
    res.status(500).json({ 
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Kullanıcı girişi
 * @route   POST /api/users/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  // Validasyon hatalarını kontrol et
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }

  const { email, password } = req.body;

  try {
    // Kullanıcıyı bul
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Geçersiz email veya şifre' 
      });
    }

    // E-posta doğrulanmış mı kontrol et
    if (!user.emailVerified) {
      // Kullanıcıya yeni doğrulama e-postası gönderip göndermeme kontrolü
      // Son doğrulama isteği üzerinden 24 saat geçtiyse yeni doğrulama göndereceğiz
      const lastTokenTime = user.verificationTokenExpire ? new Date(user.verificationTokenExpire) : null;
      const shouldResendVerification = !lastTokenTime || (new Date() - lastTokenTime > 24 * 60 * 60 * 1000);
      
      if (shouldResendVerification) {
        // Yeni doğrulama tokeni oluştur
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
        
        // Kullanıcı bilgilerini güncelle
        user.verificationToken = hashedToken;
        user.verificationTokenExpire = Date.now() + 5 * 60 * 1000; // 5 dakika
        await user.save();
        
        // Doğrulama e-postası gönder
        await sendVerificationEmail(
          user.email,
          verificationToken,
          user.fullName
        );
        
        return res.status(401).json({ 
          success: false,
          message: 'Lütfen önce e-posta adresinizi doğrulayın. Yeni doğrulama bağlantısı e-posta adresinize gönderildi.' 
        });
      }
      
      return res.status(401).json({ 
        success: false,
        message: 'Lütfen önce e-posta adresinizi doğrulayın. Doğrulama bağlantısı e-posta adresinize gönderildi.' 
      });
    }

    // Şifreyi kontrol et
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Geçersiz email veya şifre' 
      });
    }

    // Son aktivite zamanını güncelle
    user.lastActive = new Date();
    await user.save();

    // JWT token'ları oluştur
    const accessToken = generateToken({ id: user._id });
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        profilePicture: user.profilePicture,
        token: accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({ 
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Token yenileme
 * @route   POST /api/users/refresh-token
 * @access  Public
 */
const refreshToken = async (req, res) => {
  const { refreshToken: requestToken } = req.body;

  if (!requestToken) {
    return res.status(400).json({
      success: false,
      message: 'Yenileme token\'ı gereklidir'
    });
  }

  try {
    // Refresh token doğrulama işlemini burada yapıyoruz
    const { verifyRefreshToken } = require('../config/jwt');
    const decoded = verifyRefreshToken(requestToken);

    if (!decoded.success) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz yenileme token\'ı'
      });
    }

    // Kullanıcıyı kontrol et
    const user = await User.findById(decoded.data.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Kullanıcının aktif olup olmadığını kontrol et
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Hesabınız devre dışı bırakılmış'
      });
    }

    // Yeni access token oluştur
    const accessToken = generateToken({ id: user._id });

    return res.json({
      success: true,
      data: {
        token: accessToken
      }
    });

  } catch (error) {
    console.error('Token yenileme hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Token yenileme işlemi sırasında bir hata oluştu'
    });
  }
};

// @desc    Kullanıcı profili getir
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('hobbies', 'name category description')
      .populate({
        path: 'participatedEvents',
        populate: [
          { path: 'organizer', select: 'username fullName profilePicture' },
          { path: 'hobby', select: 'name category' }
        ]
      })
      .populate({
        path: 'events',
        populate: [
          { path: 'organizer', select: 'username fullName profilePicture' },
          { path: 'hobby', select: 'name category' }
        ]
      });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Kullanıcı bulunamadı' 
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Profil getirme hatası:', error);
    res.status(500).json({ 
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Kullanıcı profilini güncelle
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  // Validasyon hatalarını kontrol et
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Kullanıcı bulunamadı' 
      });
    }

    const { fullName, bio, interests, location } = req.body;

    if (fullName) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;
    if (interests) user.interests = interests;
    
    // Konum bilgisi varsa güncelle
    if (location) {
      console.log('Profil güncellemede gelen konum bilgisi:', location);
      
      // Konum nesnesinin yapısını kontrol et
      if (typeof location === 'string') {
        // Eğer location bir string ise, adres olarak kullan
        user.location = {
          type: 'Point',
          coordinates: [0, 0],
          address: location
        };
      } else if (typeof location === 'object') {
        // Location bir nesne ise
        const locationUpdate = {
          type: location.type || 'Point',
          coordinates: (location.coordinates && Array.isArray(location.coordinates) && location.coordinates.length === 2) 
            ? location.coordinates 
            : [0, 0],
          address: location.address || ''
        };
        
        user.location = locationUpdate;
        console.log('Güncellenen konum bilgisi:', locationUpdate);
      }
    }

    // Son aktivite zamanını güncelle
    user.lastActive = new Date();
    
    const updatedUser = await user.save();

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    res.status(500).json({ 
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Hobiye göre kullanıcıları getir
// @route   GET /api/users/hobby/:hobbyId
// @access  Private
const getUsersByHobby = async (req, res) => {
  try {
    const users = await User.find({
      hobbies: req.params.hobbyId
    }).select('-password');

    res.json(users);
  } catch (error) {
    console.error('Hobi kullanıcılarını getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Kullanıcıyı takip et
// @route   PUT /api/users/follow/:userId
// @access  Private
const followUser = async (req, res) => {
  try {
    // Kendini takip etmeye çalışıyor mu kontrol et
    if (req.user.id === req.params.userId) {
      return res.status(400).json({ message: 'Kendinizi takip edemezsiniz' });
    }

    const userToFollow = await User.findById(req.params.userId);
    if (!userToFollow) {
      return res.status(404).json({ message: 'Takip edilecek kullanıcı bulunamadı' });
    }

    const currentUser = await User.findById(req.user.id);

    // Zaten takip ediyor mu kontrol et
    if (currentUser.following.includes(req.params.userId)) {
      return res.status(400).json({ message: 'Bu kullanıcıyı zaten takip ediyorsunuz' });
    }

    // Takip et
    await User.findByIdAndUpdate(req.user.id, {
      $push: { following: req.params.userId }
    });

    // Takip edilenin takipçilerine ekle
    await User.findByIdAndUpdate(req.params.userId, {
      $push: { followers: req.user.id }
    });

    res.json({ message: 'Kullanıcı takip edildi' });
  } catch (error) {
    console.error('Takip etme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Kullanıcıyı takipten çık
// @route   PUT /api/users/unfollow/:userId
// @access  Private
const unfollowUser = async (req, res) => {
  try {
    if (req.user.id === req.params.userId) {
      return res.status(400).json({ message: 'Kendinizi takipten çıkaramazsınız' });
    }

    const userToUnfollow = await User.findById(req.params.userId);
    if (!userToUnfollow) {
      return res.status(404).json({ message: 'Takipten çıkılacak kullanıcı bulunamadı' });
    }

    const currentUser = await User.findById(req.user.id);

    // Takip ediyor mu kontrol et
    if (!currentUser.following.includes(req.params.userId)) {
      return res.status(400).json({ message: 'Bu kullanıcıyı takip etmiyorsunuz' });
    }

    // Takipten çık
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { following: req.params.userId }
    });

    // Takip edilenin takipçilerinden çıkar
    await User.findByIdAndUpdate(req.params.userId, {
      $pull: { followers: req.user.id }
    });

    res.json({ message: 'Kullanıcı takipten çıkarıldı' });
  } catch (error) {
    console.error('Takipten çıkma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Şifre değiştir
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = async (req, res) => {
  // Validasyon hatalarını kontrol et
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }

  try {
    const { currentPassword, newPassword } = req.body;

    // Kullanıcıyı şifresiyle birlikte bul
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Kullanıcı bulunamadı' 
      });
    }

    // Mevcut şifreyi kontrol et
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Mevcut şifre yanlış' 
      });
    }

    // Yeni şifreyi ayarla
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Şifre başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Şifre değiştirme hatası:', error);
    res.status(500).json({ 
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Şifre sıfırlama isteği oluştur
 * @route   POST /api/users/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  try {
    // Validasyon hatalarını kontrol et
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validasyon hataları:', errors.array());
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { email } = req.body;
    console.log('Şifre sıfırlama isteği alındı:', email);

    if (!email) {
      console.log('Email adresi bulunamadı');
      return res.status(400).json({
        success: false,
        message: 'Email adresi gereklidir'
      });
    }

    try {
      // Kullanıcıyı bul
      const user = await User.findOne({ email });
      
      // Kullanıcı bulunamadıysa bile güvenlik nedeniyle başarılı mesajı döndür
      if (!user) {
        console.log('Kullanıcı bulunamadı ama güvenlik için başarılı mesajı döndürülüyor');
        return res.status(200).json({
          success: true,
          message: 'Şifre sıfırlama talimatları email adresinize gönderildi'
        });
      }

      console.log('Kullanıcı bulundu, şifre sıfırlama kodu gönderiliyor');
      
      try {
        // Şifre sıfırlama email'ini gönder
        console.log('Şifre sıfırlama e-postası gönderiliyor...');
        const emailResult = await sendPasswordResetEmail(
          user.email,
          null, // Token parametresi kullanılmıyor
          user.fullName
        );

        // E-posta gönderimi başarısız olduysa, hatayı göster
        if (!emailResult.success) {
          console.error('E-posta gönderimi başarısız:', emailResult.error);
          return res.status(500).json({
            success: false,
            message: 'E-posta gönderilirken bir hata oluştu: ' + emailResult.error,
            error: emailResult.error
          });
        }

        // E-posta gönderimi başarılıysa, yanıt döndür
        const responseData = {
          success: true,
          message: 'Şifre sıfırlama talimatları email adresinize gönderildi'
        };

        console.log('Şifre sıfırlama kodu:', emailResult.resetCode);
        
        // UI'da göstermek için developerInfo'ya da ekle - sadece geliştirme modunda
        if (process.env.NODE_ENV === 'development') {
          responseData.developerInfo = { 
            note: 'Şifre sıfırlama kodunuz:',
            resetCode: emailResult.resetCode
          };
        }

        console.log('Şifre sıfırlama işlemi başarıyla tamamlandı');
        return res.status(200).json(responseData);
      } catch (emailError) {
        console.error('E-posta gönderimi sırasında hata oluştu:', emailError);
        return res.status(500).json({
          success: false,
          message: 'E-posta gönderilirken bir hata oluştu',
          error: emailError.message || 'Bilinmeyen e-posta hatası'
        });
      }
    } catch (userError) {
      console.error('Kullanıcı işlemleri sırasında hata:', userError);
      return res.status(500).json({ 
        success: false,
        message: 'Kullanıcı işlemleri sırasında hata oluştu',
        error: userError.message || 'Bilinmeyen kullanıcı hatası'
      });
    }
  } catch (error) {
    console.error('Şifre sıfırlama genel hatası:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Bir hata oluştu'
    });
  }
};

/**
 * @desc    Şifre sıfırlama işlemini tamamla
 * @route   POST /api/users/reset-password
 * @access  Public
 */
const resetPassword = async (req, res) => {
  // Validasyon hatalarını kontrol et
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }

  try {
    const { email, code, verificationId, password } = req.body;

    if (!email || (!code && !verificationId) || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, doğrulama bilgisi (kod veya verificationId) ve yeni şifre gereklidir'
      });
    }

    // Eğer verificationId değil code kullanılıyorsa kod doğrulaması yap
    if (code) {
      // Email servisi içindeki verifyResetCode fonksiyonu ile kodu doğrula
      const verificationResult = verifyResetCode(email, code);

      if (!verificationResult.valid) {
        return res.status(400).json({
          success: false,
          message: verificationResult.message || 'Geçersiz veya süresi dolmuş kod. Lütfen yeniden şifre sıfırlama isteği oluşturun.'
        });
      }
    }
    // verificationId kullanılıyorsa, önceki adımda doğrulama yapılmış kabul edilir
    // NOT: Gerçek bir uygulamada, verificationId'yi de doğrulamak için bir mekanizma gerekir
    // Şu anda bu basit örnekte, verificationId varsa doğrulama yapılmış kabul ediyoruz

    // Kullanıcıyı email ile bul
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Yeni şifreyi ayarla (pre-save hook ile otomatik hashlenecek)
    user.password = password;
    await user.save();

    // Otomatik giriş yapması için token oluştur
    const accessToken = generateToken({ id: user._id });
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      message: 'Şifreniz başarıyla sıfırlandı',
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        profilePicture: user.profilePicture,
        token: accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Şifre sıfırlama hatası:', error);
    res.status(500).json({ 
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Şifre sıfırlama token'ını doğrula
 * @route   GET /api/users/validate-reset-token/:token
 * @access  Public
 */
const validateResetToken = async (req, res) => {
  try {
    // Token'ı hashle
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // Token'a sahip ve süresi dolmamış kullanıcıyı bul
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veya süresi dolmuş token'
      });
    }

    res.json({
      success: true,
      message: 'Token geçerli'
    });
  } catch (error) {
    console.error('Token doğrulama hatası:', error);
    res.status(500).json({ 
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Profil fotoğrafı yükle
 * @route   POST /api/users/upload-profile-picture
 * @access  Private
 */
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen bir resim dosyası yükleyin.'
      });
    }

    // Dosya yolu oluştur
    const profilePicturePath = req.file.path.replace(/\\/g, '/').replace('public/', '');

    // Kullanıcı bilgisini güncelle
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Eski profil resmini silmek için gerekli işlemler burada yapılabilir
    // (Mevcut resim default değilse ve sunucuda depolanıyorsa)

    // Profil resmini güncelle
    user.profilePicture = profilePicturePath;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profil fotoğrafı başarıyla güncellendi',
      data: user
    });
  } catch (error) {
    console.error('Profil fotoğrafı yükleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Kullanıcı adına göre profil getir
 * @route   GET /api/users/profile/:username
 * @access  Private
 */
const getUserByUsername = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password')
      .populate('hobbies', 'name category description')
      .populate({
        path: 'participatedEvents',
        populate: [
          { path: 'organizer', select: 'username fullName profilePicture' },
          { path: 'hobby', select: 'name category' }
        ]
      })
      .populate({
        path: 'events',
        populate: [
          { path: 'organizer', select: 'username fullName profilePicture' },
          { path: 'hobby', select: 'name category' }
        ]
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Kullanıcı profili getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    E-posta doğrulama işlemi
 * @route   POST /api/users/verify-email
 * @access  Public
 */
const verifyEmail = async (req, res) => {
  console.log('E-posta doğrulama isteği alındı');
  
  try {
    const { email, code } = req.body;
    
    // Email ve kod kontrolü
    if (!email || !code) {
      console.error('Doğrulama hatası: Email veya doğrulama kodu eksik');
      return res.status(400).json({
        success: false,
        message: 'E-posta adresi ve doğrulama kodu gereklidir'
      });
    }
    
    console.log(`Doğrulama isteği: ${email} için kod: ${code}`);

    // E-posta doğrulama kodunu kontrol et
    const verificationResult = emailService.verifyResetCode(email, code);
    
    if (!verificationResult.valid) {
      console.error(`Doğrulama hatası: ${email} için kod geçersiz veya süresi dolmuş`);
      return res.status(400).json({
        success: false,
        message: verificationResult.message || 'Geçersiz doğrulama kodu'
      });
    }

    // Kullanıcıyı bul
    const user = await User.findOne({ email });
    
    // Kullanıcı bulunamadıysa
    if (!user) {
      console.error(`Doğrulama hatası: ${email} için kullanıcı bulunamadı`);
      return res.status(400).json({
        success: false,
        message: 'Bu e-posta adresine sahip kullanıcı bulunamadı'
      });
    }

    // Kullanıcı zaten doğrulanmış mı kontrol et
    if (user.emailVerified) {
      console.log('Kullanıcı zaten doğrulanmış:', user.email);
      
      // JWT token'ları oluştur (otomatik giriş için)
      const accessToken = generateToken({ id: user._id });
      const refreshToken = generateRefreshToken(user._id);
      
      return res.status(200).json({
        success: true,
        message: 'E-posta adresiniz zaten doğrulanmış',
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          profilePicture: user.profilePicture,
          emailVerified: user.emailVerified
        },
        accessToken,
        refreshToken
      });
    }

    console.log('Kullanıcı e-postası doğrulanıyor:', user.email);

    // Kullanıcıyı doğrula
    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();

    console.log('Kullanıcı e-postası başarıyla doğrulandı:', user.email);

    // JWT token'ları oluştur (otomatik giriş için)
    const accessToken = generateToken({ id: user._id });
    const refreshToken = generateRefreshToken(user._id);

    // Başarılı yanıt
    return res.status(200).json({
      success: true,
      message: 'E-posta adresiniz başarıyla doğrulandı',
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        profilePicture: user.profilePicture,
        emailVerified: user.emailVerified
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('E-posta doğrulama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Yeni doğrulama e-postası gönder
 * @route   POST /api/users/resend-verification
 * @access  Public
 */
const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'E-posta adresi gereklidir'
    });
  }

  try {
    // Kullanıcıyı bul
    const user = await User.findOne({ email });
    
    // Kullanıcı yoksa bile güvenlik nedeniyle başarılı mesajı döndür
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'Doğrulama e-postası gönderildi. Lütfen e-posta kutunuzu kontrol edin.'
      });
    }

    // Kullanıcı zaten doğrulanmış mı kontrol et
    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'E-posta adresiniz zaten doğrulanmış. Giriş yapabilirsiniz.'
      });
    }

    // Doğrulama e-postası gönder - artık token değil kod gönderiyoruz
    const emailResult = await sendVerificationEmail(
      user.email,
      null, // token yerine null gönderiyoruz, kod serviste oluşturuluyor
      user.fullName
    );

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'E-posta gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
      });
    }

    const responseData = {
      success: true,
      message: 'Doğrulama e-postası gönderildi. Lütfen e-posta kutunuzu kontrol edin.',
      platform: req.headers['user-agent'] && req.headers['user-agent'].includes('Expo') ? 'mobile' : 'web'
    };

    // Tüm durumlarda geliştirici bilgisini ekle - mobil için önemli
    const developerInfo = {
      note: 'Doğrulama kodu bilgisi'
    };

    // Geliştirme modunda doğrulama kodunu göster
    if (process.env.NODE_ENV === 'development' && emailResult.verificationCode) {
      developerInfo.verificationCode = emailResult.verificationCode;
    }

    // Geliştirici bilgilerini ekle
    responseData.developerInfo = developerInfo;

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Doğrulama e-postası gönderme hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Kullanıcının katıldığı etkinlikleri getir
 * @route   GET /api/users/participated-events
 * @access  Private
 */
const getUserParticipatedEvents = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'participatedEvents',
        populate: [
          { path: 'organizer', select: 'username fullName profilePicture' },
          { path: 'hobby', select: 'name category' }
        ]
      });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Kullanıcı bulunamadı' 
      });
    }

    res.json({
      success: true,
      data: user.participatedEvents
    });
  } catch (error) {
    console.error('Katılınan etkinlikleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

/**
 * @desc    Kullanıcının oluşturduğu etkinlikleri getir
 * @route   GET /api/users/created-events
 * @access  Private
 */
const getUserCreatedEvents = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'events',
        populate: [
          { path: 'organizer', select: 'username fullName profilePicture' },
          { path: 'hobby', select: 'name category' }
        ]
      });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Kullanıcı bulunamadı' 
      });
    }

    res.json({
      success: true,
      data: user.events
    });
  } catch (error) {
    console.error('Oluşturulan etkinlikleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

/**
 * @desc    Kullanıcı bilgilerini ID'ye göre getir
 * @route   GET /api/users/:id
 * @access  Public
 */
const getUserById = async (req, res) => {
  try {
    console.log(`[getUserById] Request received for user ID: ${req.params.id}`);
    
    if (!req.params.id) {
      console.log('[getUserById] No ID parameter found in request');
      return res.status(400).json({
        success: false,
        message: 'ID parametresi gereklidir'
      });
    }

    // Check for valid ObjectId format
    const mongoose = require('mongoose');
    const isValidObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    console.log(`[getUserById] ID validation: ${isValidObjectId ? 'Valid' : 'Invalid'} ObjectId format`);

    let user = null;
    
    // First try to find by ObjectId if it's a valid ObjectId
    if (isValidObjectId) {
      console.log(`[getUserById] Searching by ObjectId: ${req.params.id}`);
      // Print all users in the database to check if this ID exists
      const allUsers = await User.find({}, '_id username fullName').limit(5);
      console.log('[getUserById] Sample users in database:', 
        allUsers.map(u => ({ id: u._id.toString(), username: u.username, name: u.fullName }))
      );
      
      user = await User.findById(req.params.id)
        .select('-password')
        .populate('hobbies', 'name category description')
        .populate({
          path: 'participatedEvents',
          populate: [
            { path: 'organizer', select: 'username fullName profilePicture' },
            { path: 'hobby', select: 'name category' }
          ]
        })
        .populate({
          path: 'events',
          populate: [
            { path: 'organizer', select: 'username fullName profilePicture' },
            { path: 'hobby', select: 'name category' }
          ]
        });
      
      console.log(`[getUserById] FindById result: ${user ? 'Found' : 'Not found'}`);
    }
    
    // If not found by ObjectId or invalid ObjectId format, try other methods
    if (!user) {
      console.log('[getUserById] Not found by ObjectId, trying username or custom ID');
      
      // Try finding by username
      user = await User.findOne({ username: req.params.id })
        .select('-password')
        .populate('hobbies', 'name category description')
        .populate({
          path: 'participatedEvents',
          populate: [
            { path: 'organizer', select: 'username fullName profilePicture' },
            { path: 'hobby', select: 'name category' }
          ]
        })
        .populate({
          path: 'events',
          populate: [
            { path: 'organizer', select: 'username fullName profilePicture' },
            { path: 'hobby', select: 'name category' }
          ]
        });
      
      console.log(`[getUserById] FindOne by username result: ${user ? 'Found' : 'Not found'}`);
      
      if (!user) {
        // Try any custom ID field you might be using
        user = await User.findOne({ customId: req.params.id })
          .select('-password')
          .populate('hobbies', 'name category description')
          .populate({
            path: 'participatedEvents',
            populate: [
              { path: 'organizer', select: 'username fullName profilePicture' },
              { path: 'hobby', select: 'name category' }
            ]
          })
          .populate({
            path: 'events',
            populate: [
              { path: 'organizer', select: 'username fullName profilePicture' },
              { path: 'hobby', select: 'name category' }
            ]
          });
        
        console.log(`[getUserById] FindOne by customId result: ${user ? 'Found' : 'Not found'}`);
      }
    }

    console.log(`[getUserById] User found: ${!!user}`);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('[getUserById] Error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Geçersiz kullanıcı ID\'si'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Benzer hobilere sahip kullanıcıları getir
 * @route   GET /api/users/similar
 * @access  Private
 */
const getSimilarUsers = async (req, res) => {
  try {
    console.log(`[userController] Similar users request - user: ${req.user.id}`);
    
    // Sayfalama parametrelerini al
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    
    // Mevcut kullanıcının bilgilerini al
    const currentUser = await User.findById(req.user.id).populate('hobbies');
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    const userHobbies = currentUser.hobbies || [];
    console.log(`[userController] Current user has ${userHobbies.length} hobbies`);
    
    if (userHobbies.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'Benzer kullanıcıları görmek için lütfen profilinizde hobi bilgilerinizi ekleyin',
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        }
      });
    }
    
    // Kullanıcının hobi ID'lerini al
    const hobbyIds = userHobbies.map(hobby => hobby._id);
    
    // Benzer hobilere sahip kullanıcıları bul
    const similarUsers = await User.aggregate([
      {
        // Kendisi hariç diğer kullanıcıları filtrele
        $match: {
          _id: { $ne: currentUser._id },
          hobbies: { $in: hobbyIds }
        }
      },
      {
        // Ortak hobi sayısını hesapla
        $addFields: {
          commonHobbiesCount: {
            $size: {
              $setIntersection: ['$hobbies', hobbyIds]
            }
          }
        }
      },
      {
        // En çok ortak hobiye sahip olanları önce sırala
        $sort: { commonHobbiesCount: -1, createdAt: -1 }
      },
      {
        // Sayfalama
        $skip: skip
      },
      {
        // Limit
        $limit: limit
      },
      {
        // Gereksiz alanları çıkar
        $project: {
          password: 0,
          verificationToken: 0,
          verificationTokenExpire: 0,
          resetPasswordToken: 0,
          resetPasswordExpire: 0
        }
      }
    ]);
    
    // Hobi bilgilerini populate et
    const populatedUsers = await User.populate(similarUsers, {
      path: 'hobbies',
      select: 'name category'
    });
    
    // Her kullanıcı için ortak hobi bilgilerini ekle
    const usersWithCommonHobbies = populatedUsers.map(user => {
      const userHobbyIds = user.hobbies.map(h => h._id.toString());
      const currentUserHobbyIds = hobbyIds.map(h => h.toString());
      
      // Ortak hobileri bul
      const commonHobbies = user.hobbies.filter(hobby => 
        currentUserHobbyIds.includes(hobby._id.toString())
      );
      
      return {
        ...user,
        commonHobbies: commonHobbies,
        commonHobbiesCount: commonHobbies.length
      };
    });
    
    // Toplam benzer kullanıcı sayısını hesapla
    const totalSimilarUsers = await User.countDocuments({
      _id: { $ne: currentUser._id },
      hobbies: { $in: hobbyIds }
    });
    
    console.log(`[userController] Found ${totalSimilarUsers} similar users, returning ${usersWithCommonHobbies.length}`);
    
    res.json({
      success: true,
      data: usersWithCommonHobbies,
      message: `${userHobbies.length} hobi bilginize göre benzer kullanıcılar`,
      pagination: {
        page,
        limit,
        total: totalSimilarUsers,
        pages: Math.ceil(totalSimilarUsers / limit)
      }
    });
  } catch (error) {
    console.error('Benzer kullanıcıları getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Tüm kullanıcıları getir
 * @route   GET /api/users/all
 * @access  Private
 */
const getAllUsers = async (req, res) => {
  try {
    // Sayfalama için parametreleri al
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Kullanıcıları getir (şifre hariç)
    const users = await User.find()
      .select('-password')
      .select('username fullName profilePicture bio email hobbies')
      .populate('hobbies', 'name category')
      .skip(skip)
      .limit(limit);
      
    // Toplam kullanıcı sayısını al
    const totalUsers = await User.countDocuments();
    
    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit)
      }
    });
  } catch (error) {
    console.error('Tüm kullanıcıları getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshToken,
  getUserProfile,
  updateUserProfile,
  getUsersByHobby,
  followUser,
  unfollowUser,
  changePassword,
  forgotPassword,
  resetPassword,
  validateResetToken,
  uploadProfilePicture,
  getUserByUsername,
  verifyEmail,
  resendVerificationEmail,
  getUserParticipatedEvents,
  getUserCreatedEvents,
  getUserById,
  getAllUsers,
  getSimilarUsers
}; 