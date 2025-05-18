const Event = require('../models/Event');
const Hobby = require('../models/Hobby');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const cleanupService = require('../services/cleanupService');

// @desc    Yeni etkinlik oluştur
// @route   POST /api/events
// @access  Private
const createEvent = async (req, res) => {
  console.log('Etkinlik oluşturma isteği alındı:', {
    headers: req.headers,
    body: req.body,
    userId: req.user?.id
  });
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('Validasyon hataları:', errors.array());
    return res.status(400).json({ 
      success: false,
      message: 'Geçersiz form verileri',
      errors: errors.array() 
    });
  }

  try {
    const {
      title,
      description,
      hobby,
      location,
      startDate,
      endDate,
      maxParticipants,
      tags,
      price,
      requirements
    } = req.body;
    
    console.log('İşlenecek etkinlik verileri:', {
      title, hobby, 
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      organizer: req.user.id
    });

    // Organizatör bilgilerini kontrol et
    if (!req.user || !req.user.id) {
      console.error('Kullanıcı kimliği bulunamadı');
      return res.status(401).json({ 
        success: false,
        message: 'Kullanıcı kimliği doğrulanamadı' 
      });
    }

    // Hobi ID'sinin geçerli olup olmadığını kontrol et
    try {
      const hobbyExists = await Hobby.findById(hobby);
      if (!hobbyExists) {
        console.error('Hobi bulunamadı, ID:', hobby);
        return res.status(404).json({
          success: false,
          message: 'Geçersiz hobi ID\'si'
        });
      }
      console.log('Hobi doğrulandı:', hobbyExists.name);
    } catch (hobbyError) {
      console.error('Hobi kontrolü sırasında hata:', hobbyError);
      return res.status(400).json({
        success: false,
        message: 'Hobi ID\'si geçersiz format'
      });
    }

    // Tarih formatları kontrolü
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      console.error('Geçersiz tarih formatı:', { startDate, endDate });
      return res.status(400).json({
        success: false,
        message: 'Geçersiz tarih formatı'
      });
    }

    // Etkinlik oluştur
    const event = new Event({
      title,
      description,
      organizer: req.user.id,
      hobby,
      location,
      startDate: startDateObj,
      endDate: endDateObj,
      maxParticipants: parseInt(maxParticipants) || 10,
      tags: tags || [],
      price: parseFloat(price) || 0,
      requirements: requirements || []
    });

    console.log('Oluşturulacak etkinlik modeli:', event);

    // Etkinliği kaydet
    const createdEvent = await event.save();
    console.log('Etkinlik başarıyla oluşturuldu, ID:', createdEvent._id);

    // Hobi modelinde etkinliği kaydet
    await Hobby.findByIdAndUpdate(hobby, {
      $push: { events: createdEvent._id }
    });
    console.log('Etkinlik hobiye eklendi');

    // Organizatörün etkinliklerini güncelle
    await User.findByIdAndUpdate(req.user.id, {
      $push: { events: createdEvent._id }
    });
    console.log('Etkinlik organizatörün etkinlik listesine eklendi');

    // Yeni etkinlik oluşturulduğunda, süresi dolmuş etkinlikleri temizle
    // Arka planda asenkron olarak çalıştır, işlemin tamamlanmasını bekleme
    cleanupService.cleanupExpiredEvents().catch(error => {
      console.error('Etkinlik oluşturma sonrası temizleme hatası:', error);
    });

    // Standart API yanıt formatını kullan
    res.status(201).json({
      success: true,
      message: 'Etkinlik başarıyla oluşturuldu',
      data: createdEvent
    });
  } catch (error) {
    console.error('Etkinlik oluşturma hatası:', error);
    console.error('Hata detayı:', error.stack);
    
    return res.status(500).json({ 
      success: false,
      message: 'Etkinlik oluşturulurken bir hata oluştu',
      error: process.env.NODE_ENV === 'development' ? error.message : 'SERVER_ERROR'
    });
  }
};

// @desc    Tüm etkinlikleri getir
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
  try {
    // Sayfalandırma parametrelerini al
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const category = req.query.category || null;
    
    console.log(`[eventController] Etkinlikler getiriliyor - sayfa: ${page}, limit: ${limit}, kategori: ${category}`);
    
    // Filtreleme için sorgu oluştur
    let query = {
      status: 'active' // Sadece aktif etkinlikleri getir
    };
    
    // Kategori filtresi
    if (category && category !== 'Tümü') {
      // Kategori değerini normalize et (büyük-küçük harf duyarsız olması için)
      const normalizedCategory = category.trim();
      console.log(`[eventController] Kategori filtresi uygulanıyor: ${normalizedCategory}`);
      
      // İki aşamalı bir yaklaşım: 
      // 1. Hobi kategorisine göre doğrudan filtrele
      const hobbiesByCategory = await Hobby.find({ 
        category: { $regex: new RegExp(normalizedCategory, 'i') } 
      });
      
      // 2. Hobi adına göre de filtrele
      const hobbiesByName = await Hobby.find({ 
        name: { $regex: new RegExp(normalizedCategory, 'i') } 
      });
      
      // Tüm eşleşen hobileri birleştir
      const allHobbies = [...hobbiesByCategory, ...hobbiesByName];
      const uniqueHobbyIds = [...new Set(allHobbies.map(hobby => hobby._id))];
      
      console.log(`[eventController] '${normalizedCategory}' kategorisi için ${uniqueHobbyIds.length} hobi bulundu`);
      
      // Eğer eşleşen hobiler varsa, bunlara göre filtrele
      if (uniqueHobbyIds.length > 0) {
        query.hobby = { $in: uniqueHobbyIds };
      } else {
        // Eşleşen hobi yoksa, kullanıcı direkt kategori adı aramış olabilir
        // category alanı direkt olarak kullanılıyorsa
        query.$or = [
          { 'hobby.category': { $regex: new RegExp(normalizedCategory, 'i') } },
          { 'hobby.name': { $regex: new RegExp(normalizedCategory, 'i') } },
          { 'category': { $regex: new RegExp(normalizedCategory, 'i') } }
        ];
      }
    }
    
    console.log('[eventController] Filtre sorgusu:', JSON.stringify(query));
    
    // Toplam etkinlik sayısını bul
    const totalEvents = await Event.countDocuments(query);
    console.log(`[eventController] Toplam ${totalEvents} etkinlik bulundu`);
    
    // Sayfalandırılmış etkinlikleri al
    const events = await Event.find(query)
      .populate('organizer', 'username fullName profilePicture')
      .populate('hobby', 'name category')
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit);
    
    console.log(`[eventController] ${events.length} etkinlik döndürülüyor`);
    
    // İlk birkaç etkinliğin bilgilerini debug için logla
    if (events.length > 0) {
      console.log('[eventController] İlk etkinlik örneği:', {
        id: events[0]._id,
        title: events[0].title,
        hobbyInfo: events[0].hobby ? {
          id: events[0].hobby._id,
          name: events[0].hobby.name,
          category: events[0].hobby.category
        } : null,
        category: events[0].category
      });
    }
    
    res.json({
      success: true,
      data: events,
      pagination: {
        total: totalEvents,
        page,
        limit,
        pages: Math.ceil(totalEvents / limit)
      }
    });
  } catch (error) {
    console.error('Etkinlikleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

// @desc    Etkinlik detaylarını getir
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'username fullName profilePicture bio')
      .populate('hobby', 'name description category')
      .populate('participants.user', 'username fullName profilePicture');
    
    if (!event) {
      return res.status(404).json({ message: 'Etkinlik bulunamadı' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Etkinlik detaylarını getirme hatası:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Etkinlik bulunamadı' });
    }
    
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Etkinliği güncelle
// @route   PUT /api/events/:id
// @access  Private
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Etkinlik bulunamadı' });
    }
    
    // Sadece organizatör güncelleyebilir
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }
    
    const {
      title,
      description,
      location,
      startDate,
      endDate,
      maxParticipants,
      tags,
      price,
      requirements,
      status
    } = req.body;
    
    if (title) event.title = title;
    if (description) event.description = description;
    if (location) event.location = location;
    if (startDate) event.startDate = startDate;
    if (endDate) event.endDate = endDate;
    if (maxParticipants) event.maxParticipants = maxParticipants;
    if (tags) event.tags = tags;
    if (price !== undefined) event.price = price;
    if (requirements) event.requirements = requirements;
    if (status) event.status = status;
    
    const updatedEvent = await event.save();
    
    // Etkinlik güncellendikten sonra, süresi dolmuş etkinlikleri temizle
    // Arka planda asenkron olarak çalıştır, işlemin tamamlanmasını bekleme
    cleanupService.cleanupExpiredEvents().catch(error => {
      console.error('Etkinlik güncelleme sonrası temizleme hatası:', error);
    });
    
    res.json(updatedEvent);
  } catch (error) {
    console.error('Etkinlik güncelleme hatası:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Etkinlik bulunamadı' });
    }
    
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Etkinliği sil
// @route   DELETE /api/events/:id
// @access  Private
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Etkinlik bulunamadı' });
    }
    
    // Sadece organizatör silebilir
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }
    
    // Etkinliği sil
    await Event.deleteOne({ _id: req.params.id });
    
    // Hobi modelinden etkinliği kaldır
    await Hobby.findByIdAndUpdate(event.hobby, {
      $pull: { events: event._id }
    });
    
    // Organizatörün etkinliklerinden kaldır
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { events: event._id }
    });
    
    // Katılımcıların listelerinden kaldır
    for (const participant of event.participants) {
      await User.findByIdAndUpdate(participant.user, {
        $pull: { participatedEvents: event._id }
      });
    }
    
    // Etkinlik silindikten sonra, süresi dolmuş diğer etkinlikleri temizle
    // Arka planda asenkron olarak çalıştır, işlemin tamamlanmasını bekleme
    cleanupService.cleanupExpiredEvents().catch(error => {
      console.error('Etkinlik silme sonrası temizleme hatası:', error);
    });
    
    res.json({ message: 'Etkinlik silindi' });
  } catch (error) {
    console.error('Etkinlik silme hatası:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Etkinlik bulunamadı' });
    }
    
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Etkinliğe katıl
// @route   PUT /api/events/:id/join
// @access  Private
const joinEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Etkinlik bulunamadı' });
    }
    
    // Etkinlik aktif mi kontrol et
    if (event.status !== 'active') {
      return res.status(400).json({ message: 'Bu etkinliğe artık katılamazsınız' });
    }
    
    // Etkinlik doluysa kontrol et
    if (event.currentParticipants >= event.maxParticipants) {
      event.status = 'full';
      await event.save();
      return res.status(400).json({ message: 'Etkinlik dolu' });
    }
    
    // Kullanıcı zaten katılımcı mı kontrol et
    const isParticipant = event.participants.some(
      p => p.user.toString() === req.user.id
    );
    
    if (isParticipant) {
      return res.status(400).json({ message: 'Zaten bu etkinliğe katıldınız' });
    }
    
    // Etkinliğe katıl
    event.participants.push({
      user: req.user.id,
      joinedAt: Date.now()
    });
    
    event.currentParticipants += 1;
    
    // Etkinlik doldu mu kontrol et
    if (event.currentParticipants >= event.maxParticipants) {
      event.status = 'full';
    }
    
    await event.save();
    
    // Kullanıcının katıldığı etkinlikler listesine ekle
    await User.findByIdAndUpdate(req.user.id, {
      $push: { participatedEvents: event._id }
    });
    
    // Etkinliğe katılım sonrası, süresi dolmuş etkinlikleri temizle
    // Arka planda asenkron olarak çalıştır, işlemin tamamlanmasını bekleme
    cleanupService.cleanupExpiredEvents().catch(error => {
      console.error('Etkinliğe katılım sonrası temizleme hatası:', error);
    });
    
    res.json({ message: 'Etkinliğe katıldınız' });
  } catch (error) {
    console.error('Etkinliğe katılma hatası:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Etkinlik bulunamadı' });
    }
    
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Etkinlikten ayrıl
// @route   PUT /api/events/:id/leave
// @access  Private
const leaveEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Etkinlik bulunamadı' });
    }
    
    // Kullanıcı katılımcı mı kontrol et
    const participantIndex = event.participants.findIndex(
      p => p.user.toString() === req.user.id
    );
    
    if (participantIndex === -1) {
      return res.status(400).json({ message: 'Bu etkinliğe katılmadınız' });
    }
    
    // Organizatör ayrılamaz
    if (event.organizer.toString() === req.user.id) {
      return res.status(400).json({ message: 'Organizatör etkinlikten ayrılamaz' });
    }
    
    // Etkinlikten ayrıl
    event.participants.splice(participantIndex, 1);
    event.currentParticipants -= 1;
    
    // Etkinlik dolu statüsünden aktif'e geçir
    if (event.status === 'full') {
      event.status = 'active';
    }
    
    await event.save();
    
    // Kullanıcının katıldığı etkinlikler listesinden kaldır
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { participatedEvents: event._id }
    });
    
    // Etkinlikten ayrılma sonrası, süresi dolmuş etkinlikleri temizle
    // Arka planda asenkron olarak çalıştır, işlemin tamamlanmasını bekleme
    cleanupService.cleanupExpiredEvents().catch(error => {
      console.error('Etkinlikten ayrılma sonrası temizleme hatası:', error);
    });
    
    res.json({ message: 'Etkinlikten ayrıldınız' });
  } catch (error) {
    console.error('Etkinlikten ayrılma hatası:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Etkinlik bulunamadı' });
    }
    
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Etkinlik katılımcılarını getir
// @route   GET /api/events/:id/participants
// @access  Public
const getEventParticipants = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .select('participants')
      .populate('participants.user', 'username fullName profilePicture');
    
    if (!event) {
      return res.status(404).json({ message: 'Etkinlik bulunamadı' });
    }
    
    res.json(event.participants);
  } catch (error) {
    console.error('Etkinlik katılımcılarını getirme hatası:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Etkinlik bulunamadı' });
    }
    
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Yakındaki etkinlikleri getir
// @route   GET /api/events/nearby
// @access  Public
const getNearbyEvents = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 10000 } = req.query; // maxDistance metre cinsinden
    
    if (!longitude || !latitude) {
      return res.status(400).json({ message: 'Konum bilgisi gerekli' });
    }
    
    const events = await Event.find({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      },
      status: 'active'
    })
      .populate('organizer', 'username fullName')
      .populate('hobby', 'name category');
    
    res.json(events);
  } catch (error) {
    console.error('Yakındaki etkinlikleri getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Hobiye göre etkinlikleri getir
// @route   GET /api/events/hobby/:hobbyId
// @access  Public
const getEventsByHobby = async (req, res) => {
  try {
    const events = await Event.find({
      hobby: req.params.hobbyId,
      status: 'active'
    })
      .populate('organizer', 'username fullName')
      .populate('hobby', 'name category')
      .sort({ startDate: 1 });
    
    res.json(events);
  } catch (error) {
    console.error('Hobiye göre etkinlikleri getirme hatası:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Geçersiz hobi ID\'si' });
    }
    
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Kullanıcıya önerilen etkinlikleri getir (Hobilerine göre)
// @route   GET /api/events/recommended
// @access  Private
const getRecommendedEvents = async (req, res) => {
  try {
    // Sayfalandırma parametrelerini al
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;
    const skip = (page - 1) * limit;
    
    console.log(`[eventController] Recommended events request - user: ${req.user.id}, page: ${page}, limit: ${limit}`);
    
    // Kullanıcı bilgilerini al
    const user = await User.findById(req.user.id).populate('hobbies');
    
    if (!user) {
      console.log(`[eventController] User not found: ${req.user.id}`);
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    // Kullanıcının hobi ve konum bilgilerini ayrıntılı olarak logla
    const userHobbies = user.hobbies || [];
    console.log('[eventController] User hobbies:', userHobbies.map(h => ({
      id: h._id, 
      name: h.name,
      category: h.category
    })));
    
    const userLocation = user.location;
    console.log('[eventController] User location:', JSON.stringify(userLocation));
    
    // İl bilgisini çıkar
    let userProvince = '';
    if (userLocation && userLocation.address) {
      const addressParts = userLocation.address.split(',');
      // İl bilgisini alırken daha doğru bir yaklaşım uygulayalım
      if (addressParts.length > 0) {
        // İlk parça il olabilir - Türkiye address formatına göre
        userProvince = addressParts[0].trim();
        console.log('[eventController] User province:', userProvince);
      }
    }
    
    // İl bilgisi yoksa ve query'den city parametresi varsa onu kullan
    if (!userProvince && req.query.city) {
      userProvince = req.query.city.trim();
      console.log('[eventController] Using city from query param:', userProvince);
    }
    
    // Konum filtreleme için sorgu hazırla
    let locationFilter = {};
    
    if (userProvince) {
      locationFilter = {
        'location.address': { $regex: userProvince, $options: 'i' }
      };
      console.log('[eventController] Using location filter:', JSON.stringify(locationFilter));
    }
    
    // Kullanıcı hobilerini kontrol et
    if (!userHobbies || userHobbies.length === 0) {
      console.log('[eventController] User has no hobbies, looking for location-based events only');
      
      // Hobi yoksa ve konum varsa, sadece il bazlı etkinlikleri getir
      let provinceQuery = { status: 'active' };
      
      if (userProvince) {
        provinceQuery = {
          ...provinceQuery,
          ...locationFilter
        };
        console.log('[eventController] Filtering by location only:', JSON.stringify(provinceQuery));
      }
      
      // İl bilgisine göre etkinlikleri getir
      const events = await Event.find(provinceQuery)
        .populate('organizer', 'username fullName profilePicture')
        .populate('hobby', 'name category')
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(limit);
      
      const totalEvents = await Event.countDocuments(provinceQuery);
      console.log(`[eventController] Found ${totalEvents} province-based events`);
      
      return res.json({
        success: true,
        data: events,
        message: userProvince 
          ? `${userProvince} ilinizdeki etkinlikler listeleniyor` 
          : 'İl ve hobi tercihiniz olmadığı için tüm etkinlikler listeleniyor',
        pagination: {
          total: totalEvents,
          page,
          limit,
          pages: Math.ceil(totalEvents / limit)
        }
      });
    }
    
    // Kullanıcının hobilerinden ID'leri ve kategori bilgilerini çıkar
    const hobbyIds = userHobbies.map(hobby => hobby._id);
    const hobbyCategories = [...new Set(userHobbies.map(hobby => hobby.category))];
    
    console.log('[eventController] User hobby IDs:', hobbyIds);
    console.log('[eventController] User hobby categories:', hobbyCategories);
    
    // Ana sorguyu oluştur: 
    // 1. İl filtresini öncelikli uygula
    // 2. Hobi ID'si veya kategorilere göre filtrele
    
    // İl bilgisi ve hobi bilgisi var ise ilk önce ildeki etkinlikleri getir
    if (userProvince) {
      // Önce sadece il bazlı etkinlikleri getir
      const query = {
        status: 'active',
        ...locationFilter
      };
      
      console.log('[eventController] Province based query:', JSON.stringify(query));
      
      // İldeki toplam etkinlik sayısını bul
      const totalEvents = await Event.countDocuments(query);
      console.log(`[eventController] Found ${totalEvents} events in user's province`);
      
      // İldeki etkinlikleri getir
      const events = await Event.find(query)
        .populate('organizer', 'username fullName profilePicture')
        .populate('hobby', 'name category')
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(limit);
      
      console.log(`[eventController] Returning ${events.length} events for user ${user.username} in province ${userProvince}`);
      
      // İlk birkaç etkinliğin bilgilerini göster
      if (events.length > 0) {
        console.log('[eventController] Sample events:', events.slice(0, Math.min(3, events.length)).map(e => ({
          id: e._id,
          title: e.title,
          hobby: e.hobby?.name || 'No hobby',
          category: e.hobby?.category || 'No category',
          location: e.location?.address || 'No location'
        })));
      }
      
      // İl bazlı etkinlikler varsa onları döndür
      if (events.length > 0) {
        return res.json({
          success: true,
          data: events,
          message: `${userProvince} ilinizdeki etkinlikler listeleniyor`,
          pagination: {
            total: totalEvents,
            page,
            limit,
            pages: Math.ceil(totalEvents / limit)
          }
        });
      }
      
      // İl bazlı etkinlik bulunamadıysa, hobi bazlı etkinliklere devam et
      console.log(`[eventController] No events found in province ${userProvince}, falling back to hobby recommendations`);
    }
    
    // İl bazlı etkinlik yoksa veya il bilgisi yoksa, hobi bazlı önerilere devam et
    const hobbyQuery = {
      $or: [
        { hobby: { $in: hobbyIds } }, // Doğrudan hobi eşleşmesi
        { 'hobby.category': { $in: hobbyCategories } } // Kategori eşleşmesi
      ],
      status: 'active'
    };
    
    console.log('[eventController] Hobby based query:', JSON.stringify(hobbyQuery));
    
    // Toplam hobi bazlı etkinlik sayısını bul
    const totalHobbyEvents = await Event.countDocuments(hobbyQuery);
    console.log(`[eventController] Found ${totalHobbyEvents} matching hobby-based events`);
    
    // Hobi bazlı etkinlikleri getir
    const hobbyEvents = await Event.find(hobbyQuery)
      .populate('organizer', 'username fullName profilePicture')
      .populate('hobby', 'name category')
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit);
    
    console.log(`[eventController] Returning ${hobbyEvents.length} hobby-based events for user ${user.username}`);
    
    // İlk birkaç etkinliğin bilgilerini göster
    if (hobbyEvents.length > 0) {
      console.log('[eventController] Sample hobby events:', hobbyEvents.slice(0, Math.min(3, hobbyEvents.length)).map(e => ({
        id: e._id,
        title: e.title,
        hobby: e.hobby?.name || 'No hobby',
        category: e.hobby?.category || 'No category',
        location: e.location?.address || 'No location'
      })));
    }
    
    // Uygun mesajla birlikte yanıt ver
    let responseMessage = 'Hobileriniz ile eşleşen etkinlikler listeleniyor';
    
    res.json({
      success: true,
      data: hobbyEvents,
      message: responseMessage,
      pagination: {
        total: totalHobbyEvents,
        page,
        limit,
        pages: Math.ceil(totalHobbyEvents / limit)
      }
    });
  } catch (error) {
    console.error('Önerilen etkinlikleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

// @desc    Süresi dolmuş etkinlikleri temizle (Admin endpoint)
// @route   POST /api/events/cleanup
// @access  Private/Admin
const cleanupExpiredEvents = async (req, res) => {
  try {
    console.log('Manuel etkinlik temizleme isteği alındı');
    
    // Admin yetkisi kontrolü
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlemi gerçekleştirmek için admin yetkisi gereklidir'
      });
    }
    
    // Temizleme işlemini başlat
    const cleanupResult = await cleanupService.cleanupExpiredEvents();
    
    return res.status(200).json({
      success: true,
      message: `Etkinlik temizleme işlemi tamamlandı. ${cleanupResult.deletedCount} etkinlik silindi.`,
      data: cleanupResult
    });
  } catch (error) {
    console.error('Manuel etkinlik temizleme hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Etkinlik temizleme işlemi sırasında bir hata oluştu',
      error: process.env.NODE_ENV === 'development' ? error.message : 'SERVER_ERROR'
    });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  joinEvent,
  leaveEvent,
  getEventParticipants,
  getNearbyEvents,
  getEventsByHobby,
  getRecommendedEvents,
  cleanupExpiredEvents
}; 