const User = require('../models/User');
const { validationResult } = require('express-validator');
const { generateToken, generateRefreshToken } = require('../config/jwt');
const { sendPasswordResetEmail, sendVerificationEmail, isValidEmail } = require('../services/emailService');
const crypto = require('crypto');

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
    const user = new User({
      username,
      email,
      password, // Model içinde hash edilecek
      fullName,
      lastActive: new Date(),
      emailVerified: false,
      verificationToken: hashedToken,
      verificationTokenExpire: Date.now() + 24 * 60 * 60 * 1000 // 24 saat
    });

    try {
      await user.save();
      console.log(`Kullanıcı veritabanına kaydedildi: ${user._id}`);
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
        ? 'Kayıt başarılı! E-posta adresinize gönderilen doğrulama bağlantısına tıklayarak hesabınızı aktifleştirin.'
        : 'Kayıt başarılı, fakat doğrulama e-postası gönderilirken bir hata oluştu. Lütfen daha sonra yeniden doğrulama bağlantısı isteyin.',
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

    // Tüm durumlarda geliştirici bilgisini ekle - mobil için önemli
    const developerInfo = {
      note: 'Doğrulama bağlantısı bilgisi',
      verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined,
      emailSendingType: process.env.ETHEREAL_EMAIL === 'true' ? 'test' : 'real'
    };

    // Eğer test e-posta URL'si varsa, onu da ekle
    if (emailResult.previewUrl) {
      console.log('Test doğrulama e-postası URL\'si:', emailResult.previewUrl);
      developerInfo.emailPreviewUrl = emailResult.previewUrl;
      responseData.emailPreviewUrl = emailResult.previewUrl; // Hem developerInfo'da hem ana objede
    }

    // Geliştirici bilgilerini ekle
    responseData.developerInfo = developerInfo;

    // Yanıt ekranında görüntülenecek ek bilgiler
    responseData.uiMessage = {
      title: emailResult.success ? 'Kayıt Başarılı!' : 'Kayıt Tamamlandı',
      body: emailResult.success
        ? `${user.email} adresine bir doğrulama bağlantısı gönderdik. Lütfen e-posta kutunuzu kontrol edin ve bağlantıya tıklayarak hesabınızı doğrulayın.`
        : 'Hesabınız oluşturuldu ancak doğrulama e-postası gönderilemedi. Giriş yaptıktan sonra yeni bir doğrulama e-postası isteyebilirsiniz.',
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
        user.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 saat
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
      .populate('hobbies', 'name category description');

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
    if (location && location.coordinates && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      user.location = {
        type: 'Point',
        coordinates: location.coordinates
      };
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

      console.log('Kullanıcı bulundu, şifre sıfırlama token oluşturuluyor');
      
      // Şifre sıfırlama token'ı oluştur
      const resetToken = crypto.randomBytes(32).toString('hex');

      // Token'ı hashle
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      // Kullanıcı için token'ı sakla
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 saat
      await user.save();
      console.log('Kullanıcı için reset token kaydedildi');

      try {
        // Şifre sıfırlama email'ini gönder
        console.log('Şifre sıfırlama e-postası gönderiliyor...');
        const emailResult = await sendPasswordResetEmail(
          user.email,
          resetToken,
          user.fullName
        );

        // Email gönderimi başarısız ise
        if (!emailResult.success) {
          console.error('Şifre sıfırlama email gönderimi başarısız:', emailResult.error);
          
          // Token bilgilerini temizle
          user.resetPasswordToken = undefined;
          user.resetPasswordExpire = undefined;
          await user.save();
          
          return res.status(500).json({
            success: false,
            message: 'Email gönderimi sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
            error: emailResult.error
          });
        }

        // Geliştirme ortamında test e-posta URL'sini de gönderelim
        const responseData = {
          success: true,
          message: 'Şifre sıfırlama talimatları email adresinize gönderildi'
        };

        // Geliştirme ortamında ise test mail URL'sini de ekle
        if ((process.env.NODE_ENV === 'development' || process.env.ETHEREAL_EMAIL === 'true') && emailResult.previewUrl) {
          console.log('Test e-posta URL\'si:', emailResult.previewUrl);
          responseData.developerInfo = {
            note: 'Bu bilgi sadece geliştirme ortamında görünür.',
            resetToken: resetToken,
            emailPreviewUrl: emailResult.previewUrl
          };
        }

        console.log('Şifre sıfırlama e-postası başarıyla gönderildi');
        return res.status(200).json(responseData);
      } catch (emailError) {
        console.error('E-posta gönderimi sırasında hata:', emailError);
        
        // Token bilgilerini temizle
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        
        return res.status(500).json({
          success: false,
          message: 'E-posta gönderimi sırasında bir hata oluştu',
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
    // Token'ı hashle
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.body.token)
      .digest('hex');

    // Token'a sahip ve süresi dolmamış kullanıcıyı bul
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veya süresi dolmuş token. Lütfen yeniden şifre sıfırlama isteği oluşturun.'
      });
    }

    // Yeni şifreyi ayarla
    user.password = req.body.password;
    
    // Token bilgilerini temizle
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    // Otomatik giriş yapması için token oluştur (isteğe bağlı)
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
      .populate('hobbies', 'name category description');

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
 * @route   GET /api/users/verify-email/:token
 * @access  Public
 */
const verifyEmail = async (req, res) => {
  console.log('E-posta doğrulama isteği alındı. Token:', req.params.token);
  
  try {
    // Token kontrolü
    if (!req.params.token) {
      console.error('Doğrulama hatası: Token parametre olarak sağlanmadı.');
      return res.status(400).json({
        success: false,
        message: 'Geçersiz doğrulama bağlantısı. Token bulunamadı.'
      });
    }
    
    // Token'ı hashle
    const verificationToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');
    
    console.log('Hash\'lenen token:', verificationToken);

    // Token'a sahip ve süresi dolmamış kullanıcıyı bul
    const user = await User.findOne({
      verificationToken,
      verificationTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
      console.error('Doğrulama hatası: Verilen token için kullanıcı bulunamadı veya süresi dolmuş.');
      
      // Genel Token kontrolü - sadece token var mı, süresi geçmiş mi
      const expiredUser = await User.findOne({
        verificationToken
      });
      
      if (expiredUser) {
        console.log('Süresi dolmuş token bulundu. Kullanıcı:', expiredUser.email);
        
        // Yeni doğrulama tokeni oluştur
        const newVerificationToken = crypto.randomBytes(32).toString('hex');
        const newHashedToken = crypto.createHash('sha256').update(newVerificationToken).digest('hex');
        
        // Kullanıcı bilgilerini güncelle
        expiredUser.verificationToken = newHashedToken;
        expiredUser.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 saat
        await expiredUser.save();
        
        // Yeni doğrulama e-postası gönder
        await sendVerificationEmail(
          expiredUser.email,
          newVerificationToken,
          expiredUser.fullName
        );
        
        return res.status(400).json({
          success: false,
          message: 'Doğrulama linkinin süresi dolmuş. Yeni bir doğrulama e-postası adresinize gönderildi.'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veya süresi dolmuş doğrulama bağlantısı. Lütfen tekrar kayıt olun veya yeni doğrulama bağlantısı isteyin.'
      });
    }

    console.log('Kullanıcı bulundu, doğrulama yapılıyor:', user.email);

    // Kullanıcıyı doğrulanmış olarak işaretle
    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    
    await user.save();
    console.log('Kullanıcı doğrulandı ve kaydedildi');

    // JWT token'ları oluştur (otomatik giriş için)
    const accessToken = generateToken({ id: user._id });
    const refreshToken = generateRefreshToken(user._id);

    // İstek doğrudan API'den mi geldi kontrol edelim 
    // Content-Type veya Accept header'ına göre JSON yanıt isteğini belirleyelim
    const acceptJson = req.headers.accept && req.headers.accept.includes('application/json');
    const isApiRequest = acceptJson || req.xhr;
    
    console.log('İstek tipi kontrolü:', { acceptJson, isApiRequest, accept: req.headers.accept });
    
    // API isteği ise JSON yanıt döndür
    if (isApiRequest) {
      console.log('API isteği tespit edildi, JSON yanıtı döndürülüyor');
      return res.status(200).json({
        success: true,
        message: 'E-posta adresiniz başarıyla doğrulandı.',
        token: accessToken,
        refreshToken: refreshToken
      });
    }
    
    // Web veya mobil uygulama belirle
    const userAgent = req.headers['user-agent'];
    const isMobile = userAgent && (userAgent.includes('Mobile') || userAgent.includes('Expo'));
    
    console.log('User-Agent kontrolü:', { isMobile, userAgent });
    
    if (isMobile) {
      // Mobil uygulama için deep link ile dönüş
      const mobileRedirectUrl = `sosyaletkinlik://email-verified?success=true&token=${accessToken}&refreshToken=${refreshToken}`;
      console.log('Mobil yönlendirme:', mobileRedirectUrl);
      return res.redirect(mobileRedirectUrl);
    } else {
      // Web uygulamasına yönlendirme parametreleriyle
      const clientUrl = process.env.CLIENT_URL_WEB || 'http://localhost:3000';
      const redirectUrl = `${clientUrl}/email-verified?success=true&token=${accessToken}&refreshToken=${refreshToken}`;
      console.log('Web yönlendirme:', redirectUrl);
      return res.redirect(redirectUrl);
    }
  } catch (error) {
    console.error('E-posta doğrulama hatası:', error);
    
    // Hata tipi ve içeriğini logla
    console.error('Hata detayları:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // JSON isteği mi kontrol et
    const acceptJson = req.headers.accept && req.headers.accept.includes('application/json');
    if (acceptJson || req.xhr) {
      return res.status(500).json({
        success: false,
        message: 'Doğrulama işlemi sırasında bir hata oluştu.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // Web için hata yönlendirmesi
    const clientUrl = process.env.CLIENT_URL_WEB || 'http://localhost:3000';
    return res.redirect(`${clientUrl}/email-verified?success=false&error=${encodeURIComponent('Doğrulama işlemi sırasında bir hata oluştu.')}`);
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

    // Yeni doğrulama token'ı oluştur
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Token'ı hashle
    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    // Kullanıcı bilgilerini güncelle
    user.verificationToken = hashedToken;
    user.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 saat
    await user.save();

    // Doğrulama e-postası gönder
    const emailResult = await sendVerificationEmail(
      user.email,
      verificationToken,
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
      note: 'Doğrulama bağlantısı bilgisi',
      verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined
    };

    // Eğer test e-posta URL'si varsa, onu da ekle
    if (emailResult.previewUrl) {
      console.log('Test doğrulama e-postası URL\'si:', emailResult.previewUrl);
      developerInfo.emailPreviewUrl = emailResult.previewUrl;
      responseData.emailPreviewUrl = emailResult.previewUrl; // Hem developerInfo'da hem ana objede
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
  resendVerificationEmail
}; 