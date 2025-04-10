const User = require('../models/User');
const { validationResult } = require('express-validator');
const { generateToken, generateRefreshToken } = require('../config/jwt');
const { sendPasswordResetEmail } = require('../services/emailService');
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
    // Email veya kullanıcı adı zaten var mı kontrolü
    let userExists = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (userExists) {
      return res.status(400).json({ 
        success: false,
        message: 'Kullanıcı zaten var - bu email veya kullanıcı adı kullanılıyor' 
      });
    }

    // Yeni kullanıcı oluştur
    const user = new User({
      username,
      email,
      password, // Model içinde hash edilecek
      fullName,
      lastActive: new Date()
    });

    await user.save();

    // JWT token'ları oluştur
    const accessToken = generateToken({ id: user._id });
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
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
  // Validasyon hatalarını kontrol et
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }

  const { email } = req.body;

  try {
    // Kullanıcıyı bul
    const user = await User.findOne({ email });
    
    // Kullanıcı bulunamadıysa bile güvenlik nedeniyle başarılı mesajı döndür
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'Şifre sıfırlama talimatları email adresinize gönderildi'
      });
    }

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

    // Şifre sıfırlama email'ini gönder
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
        message: 'Email gönderimi sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Şifre sıfırlama talimatları email adresinize gönderildi'
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
  getUserByUsername
}; 