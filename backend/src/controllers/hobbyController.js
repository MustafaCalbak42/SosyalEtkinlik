const Hobby = require('../models/Hobby');
const User = require('../models/User');
const Event = require('../models/Event');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// @desc    Yeni hobi oluştur
// @route   POST /api/hobbies
// @access  Private/Admin
const createHobby = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description, category } = req.body;

    // Hobi zaten var mı kontrol et
    const hobbyExists = await Hobby.findOne({ name });
    if (hobbyExists) {
      return res.status(400).json({ message: 'Bu hobi zaten mevcut' });
    }

    const hobby = new Hobby({
      name,
      description,
      category
    });

    const createdHobby = await hobby.save();
    res.status(201).json(createdHobby);
  } catch (error) {
    console.error('Hobi oluşturma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Tüm hobileri getir
// @route   GET /api/hobbies
// @access  Public
const getHobbies = async (req, res) => {
  // İstek yapan client'ın kökenini (origin) ve header'larını logla
  console.log('Hobi isteği origin:', req.headers.origin || 'origin bilgisi yok');
  console.log('Hobi isteği referrer:', req.headers.referer || 'referrer bilgisi yok');
  console.log('Hobi isteği user-agent:', req.headers['user-agent']);
  
  // Global veritabanı bağlantı durumunu kontrol et
  if (global.dbStatus && !global.dbStatus.connected) {
    console.error('Veritabanı bağlantısı yok! Hobiler getirilemez.');
    return res.status(503).json({
      success: false,
      message: 'Veritabanı bağlantısı kurulamadı, servis geçici olarak kullanılamıyor.',
      error: 'DB_CONNECTION_UNAVAILABLE',
      dbStatus: global.dbStatus
    });
  }
  
  try {
    console.log('Hobiler getiriliyor...');
    
    // MongoDB bağlantısını kontrol et
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB bağlantısı kurulmamış! ReadyState:', mongoose.connection.readyState);
      return res.status(500).json({ 
        success: false,
        message: 'Veritabanı bağlantısı kurulmamış',
        error: 'DB_CONNECTION_ERROR'
      });
    }
    
    // Boş bir dizi döndürmeye hazır olalım
    let hobbies = [];

    try {
      console.log('Hobby.find() çağrılıyor...');
      hobbies = await Hobby.find({}).sort({ category: 1, name: 1 });
      console.log('Hobby.find() tamamlandı, bulunan hobi sayısı:', hobbies.length);
    } catch (findError) {
      console.error('Hobby.find() sırasında hata:', findError);
      return res.status(500).json({ 
        success: false,
        message: 'Hobiler alınırken veritabanında bir hata oluştu',
        error: 'DB_QUERY_ERROR'
      });
    }
    
    // Hobiler bulunamasa bile boş array dön
    if (!hobbies || hobbies.length === 0) {
      console.log('Hobi bulunamadı, boş dizi döndürülüyor.');
      return res.json({
        success: true,
        message: 'Kayıtlı hobi bulunamadı',
        data: []
      });
    }
    
    console.log(`${hobbies.length} adet hobi başarıyla getirildi`);
    
    // Hobilerden ilk 2 tanesinin içeriğini göster (debug için)
    if (hobbies.length > 0) {
      console.log('İlk hobi örneği:', JSON.stringify(hobbies[0]));
      if (hobbies.length > 1) {
        console.log('İkinci hobi örneği:', JSON.stringify(hobbies[1]));
      }
    }
    
    // Standart API yanıt formatını kullan
    return res.json({
      success: true,
      message: 'Hobiler başarıyla getirildi',
      data: hobbies
    });
  } catch (error) {
    console.error('Hobileri getirme hatası:', error);
    console.error('Hata detayı:', error.stack);
    console.error('Hata ismi:', error.name);
    console.error('Hata mesajı:', error.message);
    
    // Özel hata türleri için
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      console.error('MongoDB hatası kodu:', error.code);
      return res.status(500).json({
        success: false,
        message: 'Veritabanı hatası: ' + error.message,
        error: 'DB_ERROR'
      });
    }
    
    // Genel durum için
    return res.status(500).json({ 
      success: false,
      message: 'Hobiler alınırken bir hata oluştu',
      error: process.env.NODE_ENV === 'development' ? error.message : 'SERVER_ERROR'
    });
  }
};

// @desc    Kategoriye göre hobileri getir
// @route   GET /api/hobbies/category/:category
// @access  Public
const getHobbiesByCategory = async (req, res) => {
  try {
    const hobbies = await Hobby.find({ category: req.params.category });
    res.json(hobbies);
  } catch (error) {
    console.error('Kategori hobilerini getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Hobi detayını getir
// @route   GET /api/hobbies/:id
// @access  Public
const getHobbyById = async (req, res) => {
  try {
    const hobby = await Hobby.findById(req.params.id);
    
    if (!hobby) {
      return res.status(404).json({ message: 'Hobi bulunamadı' });
    }
    
    res.json(hobby);
  } catch (error) {
    console.error('Hobi detayı getirme hatası:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Hobi bulunamadı' });
    }
    
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Hobi güncelle
// @route   PUT /api/hobbies/:id
// @access  Private/Admin
const updateHobby = async (req, res) => {
  try {
    const { name, description, category, isActive } = req.body;
    
    const hobby = await Hobby.findById(req.params.id);
    
    if (!hobby) {
      return res.status(404).json({ message: 'Hobi bulunamadı' });
    }
    
    hobby.name = name || hobby.name;
    hobby.description = description || hobby.description;
    hobby.category = category || hobby.category;
    
    if (isActive !== undefined) {
      hobby.isActive = isActive;
    }
    
    const updatedHobby = await hobby.save();
    res.json(updatedHobby);
  } catch (error) {
    console.error('Hobi güncelleme hatası:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Hobi bulunamadı' });
    }
    
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Kullanıcıyı hobiye ekle
// @route   PUT /api/hobbies/:id/user
// @access  Private
const addUserToHobby = async (req, res) => {
  try {
    const hobby = await Hobby.findById(req.params.id);
    
    if (!hobby) {
      return res.status(404).json({ message: 'Hobi bulunamadı' });
    }
    
    // Kullanıcı zaten bu hobiye sahip mi kontrol et
    if (hobby.users.includes(req.user.id)) {
      return res.status(400).json({ message: 'Kullanıcı zaten bu hobiye sahip' });
    }
    
    // Kullanıcıyı hobiye ekle
    hobby.users.push(req.user.id);
    await hobby.save();
    
    // Kullanıcı modeline de ekleme yapmak için User modelini de güncellemek gerekiyor
    // Bu işlemi userController'da daha detaylı yapabiliriz
    
    res.json({ message: 'Hobi kullanıcıya eklendi' });
  } catch (error) {
    console.error('Kullanıcıyı hobiye ekleme hatası:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Hobi bulunamadı' });
    }
    
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Hobi sil
// @route   DELETE /api/hobbies/:id
// @access  Private/Admin
const deleteHobby = async (req, res) => {
  try {
    const hobby = await Hobby.findById(req.params.id);
    
    if (!hobby) {
      return res.status(404).json({ message: 'Hobi bulunamadı' });
    }
    
    // Hobiye bağlı etkinlikler var mı kontrol et
    const events = await Event.find({ hobby: req.params.id });
    if (events.length > 0) {
      return res.status(400).json({ 
        message: 'Bu hobiye bağlı etkinlikler var, önce etkinlikleri silin veya başka bir hobiye taşıyın' 
      });
    }
    
    // Hobiye bağlı kullanıcılardan hobi referansını kaldır
    for (const userId of hobby.users) {
      await User.findByIdAndUpdate(userId, {
        $pull: { hobbies: hobby._id }
      });
    }
    
    // Hobi kaydını sil
    await Hobby.deleteOne({ _id: req.params.id });
    
    res.json({ message: 'Hobi başarıyla silindi' });
  } catch (error) {
    console.error('Hobi silme hatası:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Hobi bulunamadı' });
    }
    
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Hobideki kullanıcıları getir
// @route   GET /api/hobbies/:id/users
// @access  Public
const getHobbyUsers = async (req, res) => {
  try {
    const hobby = await Hobby.findById(req.params.id);
    
    if (!hobby) {
      return res.status(404).json({ message: 'Hobi bulunamadı' });
    }
    
    const users = await User.find({
      _id: { $in: hobby.users }
    }).select('-password');
    
    res.json(users);
  } catch (error) {
    console.error('Hobi kullanıcılarını getirme hatası:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Hobi bulunamadı' });
    }
    
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Hobideki etkinlikleri getir
// @route   GET /api/hobbies/:id/events
// @access  Public
const getHobbyEvents = async (req, res) => {
  try {
    const hobby = await Hobby.findById(req.params.id);
    
    if (!hobby) {
      return res.status(404).json({ message: 'Hobi bulunamadı' });
    }
    
    const events = await Event.find({
      hobby: req.params.id,
      status: 'active'
    })
      .populate('organizer', 'username fullName profilePicture')
      .sort({ startDate: 1 });
    
    res.json(events);
  } catch (error) {
    console.error('Hobi etkinliklerini getirme hatası:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Hobi bulunamadı' });
    }
    
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

module.exports = {
  createHobby,
  getHobbies,
  getHobbiesByCategory,
  getHobbyById,
  updateHobby,
  addUserToHobby,
  deleteHobby,
  getHobbyUsers,
  getHobbyEvents
}; 