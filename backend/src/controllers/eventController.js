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

    // Konum bilgisini kontrol et ve doğru format olduğundan emin ol
    let validatedLocation = location;
    
    // Eğer konum bilgisi düzgün formatta değilse, düzenle
    if (!location || typeof location !== 'object') {
      console.error('Geçersiz konum formatı:', location);
      return res.status(400).json({
        success: false,
        message: 'Geçersiz konum formatı'
      });
    }
    
    // GeoJSON Point formatında olduğundan emin ol
    if (location.type !== 'Point') {
      console.log('Konum tipi "Point" değil, düzeltiliyor:', location.type);
      validatedLocation.type = 'Point';
    }
    
    // Koordinatları kontrol et
    if (!location.coordinates || 
        !Array.isArray(location.coordinates) || 
        location.coordinates.length !== 2 ||
        typeof location.coordinates[0] !== 'number' ||
        typeof location.coordinates[1] !== 'number') {
      console.error('Geçersiz koordinat formatı:', location.coordinates);
      return res.status(400).json({
        success: false,
        message: 'Geçersiz koordinat formatı - [longitude, latitude] dizi olmalı'
      });
    }
    
    // Koordinatların geçerli aralıkta olup olmadığını kontrol et
    const [longitude, latitude] = location.coordinates;
    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      console.error('Koordinatlar geçerli aralık dışında:', location.coordinates);
      return res.status(400).json({
        success: false,
        message: 'Koordinatlar geçerli aralık dışında'
      });
    }
    
    console.log('Doğrulanmış konum bilgisi:', validatedLocation);

    // Etkinlik oluştur
    const event = new Event({
      title,
      description,
      organizer: req.user.id,
      hobby,
      location: validatedLocation,
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
    console.log(`[eventController] Etkinlik detayları getiriliyor, ID: ${req.params.id}`);
    
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'username fullName profilePicture bio')
      .populate('hobby', 'name description category')
      .populate('participants.user', 'username fullName profilePicture');
    
    if (!event) {
      console.log(`[eventController] Etkinlik bulunamadı: ${req.params.id}`);
      return res.status(404).json({ 
        success: false,
        message: 'Etkinlik bulunamadı' 
      });
    }
    
    // Sadece katılımcı bilgilerini düzenli bir şekilde sunmak için veri işleme
    const formattedEvent = event.toObject();
    
    // Katılımcıları daha erişilebilir bir formatta sun
    formattedEvent.formattedParticipants = event.participants.map(participant => {
      if (participant.user) {
        return {
          _id: participant.user._id,
          username: participant.user.username,
          fullName: participant.user.fullName,
          profilePicture: participant.user.profilePicture,
          joinedAt: participant.joinedAt
        };
      }
      return { _id: participant.user, joinedAt: participant.joinedAt };
    });
    
    console.log(`[eventController] Etkinlik detayları başarıyla getirildi, ${formattedEvent.formattedParticipants.length} katılımcı var`);
    
    res.json({
      success: true,
      data: formattedEvent
    });
  } catch (error) {
    console.error('Etkinlik detaylarını getirme hatası:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ 
        success: false,
        message: 'Etkinlik bulunamadı' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Sunucu hatası' 
    });
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
    // Sayfalama parametrelerini al
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Konum ve mesafe parametreleri
    const { lat, lng, maxDistance = 20 } = req.query; // maxDistance km cinsinden (varsayılan 20km)
    
    console.log(`[eventController] Yakındaki etkinlikler getiriliyor - koordinatlar: [${lat}, ${lng}], maksimum mesafe: ${maxDistance}km`);
    
    if (!lat || !lng) {
      console.error('[eventController] Konum bilgisi eksik:', { lat, lng });
      return res.status(400).json({ 
        success: false,
        message: 'Konum bilgisi (lat, lng) gerekli' 
      });
    }
    
    // Konum ve maksimum mesafe ile sorgu oluştur
    // MongoDB'de $geoNear kullanalım, 2dsphere index ile daha etkili çalışır
    const events = await Event.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)] // MongoDB GeoJSON formatı: [longitude, latitude]
          },
          distanceField: 'distance', // Mesafe bilgisi bu alanda tutulacak
          maxDistance: parseFloat(maxDistance) * 1000, // Km'yi metreye çevir
          spherical: true,
          query: { status: 'active' } // Sadece aktif etkinlikleri getir
        }
      },
      { $skip: skip },
      { $limit: limit }
    ]);
    
    // Toplam etkinlik sayısını bul
    const totalCount = await Event.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          distanceField: 'distance',
          maxDistance: parseFloat(maxDistance) * 1000,
          spherical: true,
          query: { status: 'active' }
        }
      },
      { $count: 'total' }
    ]);
    
    const total = totalCount.length > 0 ? totalCount[0].total : 0;
    console.log(`[eventController] ${total} etkinlik bulundu ${maxDistance}km içinde`);
    
    // Etkinlik listesini zenginleştir (populate işlemi aggregate ile doğrudan yapılamaz)
    // Her etkinlik için organizatör ve hobi bilgilerini getir
    const populatedEvents = await Event.populate(events, [
      { path: 'organizer', select: 'username fullName profilePicture' },
      { path: 'hobby', select: 'name category' }
    ]);
    
    // Kilometre cinsinden mesafe değerini ekle
    const eventsWithDistance = populatedEvents.map(event => {
      // Mesafeyi metre -> km'ye çevir ve 1 ondalık basamağa yuvarla
      const distanceInKm = parseFloat((event.distance / 1000).toFixed(1));
      return {
        ...event,
        distance: distanceInKm
      };
    });
    
    console.log(`[eventController] ${eventsWithDistance.length} etkinlik döndürülüyor`);
    
    // İlk birkaç etkinliğin bilgilerini logla
    if (eventsWithDistance.length > 0) {
      console.log('[eventController] İlk birkaç yakın etkinlik:');
      eventsWithDistance.slice(0, Math.min(3, eventsWithDistance.length)).forEach((event, i) => {
        console.log(`[${i}] ${event.title}: ${event.distance}km uzaklıkta, konum: ${JSON.stringify(event.location)}`);
      });
    }
    
    // Standart API yanıt formatı
    res.json({
      success: true,
      data: eventsWithDistance,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      message: `${maxDistance}km mesafedeki etkinlikler listeleniyor (${eventsWithDistance.length}/${total})`
    });
  } catch (error) {
    console.error('[eventController] Yakındaki etkinlikleri getirme hatası:', error);
    res.status(500).json({ 
      success: false,
      message: 'Yakındaki etkinlikler getirilirken bir hata oluştu',
      error: process.env.NODE_ENV === 'development' ? error.message : 'SERVER_ERROR'
    });
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

// @desc    Kullanıcıya önerilen etkinlikleri getir (Hobi + İl bazlı akıllı filtreleme)
// @route   GET /api/events/recommended
// @access  Private
const getRecommendedEvents = async (req, res) => {
  try {
    // Sayfalandırma parametrelerini al
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const skip = (page - 1) * limit;
    
    console.log(`[eventController] Size özel etkinlikler - kullanıcı: ${req.user.username}, sayfa: ${page}, limit: ${limit}`);
    
    // Kullanıcı bilgilerini al
    const user = await User.findById(req.user.id).populate('hobbies');
    
    if (!user) {
      console.log(`[eventController] Kullanıcı bulunamadı: ${req.user.id}`);
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    // Kullanıcının hobi ve konum bilgilerini al
    const userHobbies = user.hobbies || [];
    const userLocation = user.location;
    
    console.log('[eventController] Kullanıcı hobiler:', userHobbies.map(h => ({
      id: h._id, 
      name: h.name,
      category: h.category
    })));
    
    // İl bilgisini çıkar
    let userCity = '';
    if (userLocation && userLocation.address) {
      const addressParts = userLocation.address.split(',');
      if (addressParts.length > 0) {
        userCity = addressParts[0].trim();
        console.log('[eventController] Kullanıcının ili:', userCity);
      }
    }
    
    // Query'den city parametresi varsa onu kullan (frontend'den gelebilir)
    if (!userCity && req.query.city) {
      userCity = req.query.city.trim();
      console.log('[eventController] Query parametresinden il:', userCity);
    }
    
    // Kullanıcı profil durumunu analiz et
    const hasCity = !!userCity;
    const hasHobbies = userHobbies.length > 0;
    
    console.log('[eventController] Profil durumu:', { hasCity, hasHobbies, city: userCity, hobbiesCount: userHobbies.length });
    
    // 3 aşamalı öncelik sistemi:
    // 1. Öncelik: İl + Hobi eşleşmesi (en yüksek öncelik)
    // 2. Öncelik: Sadece İl eşleşmesi (hobi eşleşmesi bulunamadığında)
    // 3. Öncelik: Sadece Hobi eşleşmesi (il dışındaki etkinlikler)
    
    let finalEvents = [];
    let totalCount = 0;
    let filterType = 'general';
    let appliedFilters = [];
    let responseMessage = '';
    
    // AŞAMA 1: İl + Hobi eşleşmesi (en yüksek öncelik)
    if (hasCity && hasHobbies) {
      console.log('[eventController] AŞAMA 1: İl + Hobi eşleşmesi aranıyor...');
      
      const hobbyIds = userHobbies.map(hobby => hobby._id);
      const hobbyCategories = [...new Set(userHobbies.map(hobby => hobby.category))];
      
      const cityAndHobbyQuery = {
        status: 'active',
        'location.address': { $regex: userCity, $options: 'i' },
        $or: [
          { hobby: { $in: hobbyIds } },
          { 'hobby.category': { $in: hobbyCategories } }
        ]
      };
      
      console.log('[eventController] İl + Hobi sorgusu:', JSON.stringify(cityAndHobbyQuery));
      
      const cityHobbyEvents = await Event.find(cityAndHobbyQuery)
        .populate('organizer', 'username fullName profilePicture')
        .populate('hobby', 'name category')
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(limit);
      
      const cityHobbyTotal = await Event.countDocuments(cityAndHobbyQuery);
      
      console.log(`[eventController] İl + Hobi eşleşmesi: ${cityHobbyTotal} etkinlik bulundu`);
      
      if (cityHobbyEvents.length > 0) {
        finalEvents = cityHobbyEvents;
        totalCount = cityHobbyTotal;
        filterType = 'city-and-hobby';
        appliedFilters = ['city', 'hobby'];
        responseMessage = `${userCity} ilinizdeki hobi alanlarınıza uygun ${cityHobbyEvents.length} etkinlik bulundu`;
        
        console.log('[eventController] ✅ En iyi eşleşme bulundu: İl + Hobi');
        
        return res.json({
          success: true,
          data: finalEvents,
          message: responseMessage,
          filterInfo: {
            userCity,
            userHobbies: userHobbies.map(h => h.name),
            appliedFilters,
            filterType
          },
          userInfo: {
            hasCity,
            hasHobbies,
            city: userCity,
            hobbies: userHobbies.map(h => h.name)
          },
          pagination: {
            total: totalCount,
            page,
            limit,
            pages: Math.ceil(totalCount / limit)
          }
        });
      }
      
      console.log('[eventController] İl + Hobi eşleşmesi bulunamadı, AŞAMA 2\'ye geçiliyor...');
    }
    
    // AŞAMA 2: Sadece İl eşleşmesi (hobi eşleşmesi bulunamadığında)
    if (hasCity) {
      console.log('[eventController] AŞAMA 2: Sadece İl eşleşmesi aranıyor...');
      
      const cityOnlyQuery = {
        status: 'active',
        'location.address': { $regex: userCity, $options: 'i' }
      };
      
      console.log('[eventController] Sadece İl sorgusu:', JSON.stringify(cityOnlyQuery));
      
      const cityOnlyEvents = await Event.find(cityOnlyQuery)
        .populate('organizer', 'username fullName profilePicture')
        .populate('hobby', 'name category')
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(limit);
      
      const cityOnlyTotal = await Event.countDocuments(cityOnlyQuery);
      
      console.log(`[eventController] Sadece İl eşleşmesi: ${cityOnlyTotal} etkinlik bulundu`);
      
      if (cityOnlyEvents.length > 0) {
        finalEvents = cityOnlyEvents;
        totalCount = cityOnlyTotal;
        filterType = 'city-based';
        appliedFilters = ['city'];
        responseMessage = hasHobbies 
          ? `${userCity} ilinizdeki ${cityOnlyEvents.length} etkinlik bulundu (hobi eşleşmesi bulunamadı)`
          : `${userCity} ilinizdeki ${cityOnlyEvents.length} etkinlik bulundu`;
        
        console.log('[eventController] ✅ İkinci en iyi eşleşme bulundu: Sadece İl');
        
        return res.json({
          success: true,
          data: finalEvents,
          message: responseMessage,
          filterInfo: {
            userCity,
            userHobbies: userHobbies.map(h => h.name),
            appliedFilters,
            filterType
          },
          userInfo: {
            hasCity,
            hasHobbies,
            city: userCity,
            hobbies: userHobbies.map(h => h.name)
          },
          pagination: {
            total: totalCount,
            page,
            limit,
            pages: Math.ceil(totalCount / limit)
          }
        });
      }
      
      console.log('[eventController] İl eşleşmesi bulunamadı, AŞAMA 3\'e geçiliyor...');
    }
    
    // AŞAMA 3: Sadece Hobi eşleşmesi (il dışındaki etkinlikler)
    if (hasHobbies) {
      console.log('[eventController] AŞAMA 3: Sadece Hobi eşleşmesi aranıyor...');
      
      const hobbyIds = userHobbies.map(hobby => hobby._id);
      const hobbyCategories = [...new Set(userHobbies.map(hobby => hobby.category))];
      
      const hobbyOnlyQuery = {
        status: 'active',
        $or: [
          { hobby: { $in: hobbyIds } },
          { 'hobby.category': { $in: hobbyCategories } }
        ]
      };
      
      // Eğer kullanıcının ili varsa, il dışındaki etkinlikleri getir
      if (hasCity) {
        hobbyOnlyQuery['location.address'] = { $not: { $regex: userCity, $options: 'i' } };
      }
      
      console.log('[eventController] Sadece Hobi sorgusu:', JSON.stringify(hobbyOnlyQuery));
      
      const hobbyOnlyEvents = await Event.find(hobbyOnlyQuery)
        .populate('organizer', 'username fullName profilePicture')
        .populate('hobby', 'name category')
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(limit);
      
      const hobbyOnlyTotal = await Event.countDocuments(hobbyOnlyQuery);
      
      console.log(`[eventController] Sadece Hobi eşleşmesi: ${hobbyOnlyTotal} etkinlik bulundu`);
      
      if (hobbyOnlyEvents.length > 0) {
        finalEvents = hobbyOnlyEvents;
        totalCount = hobbyOnlyTotal;
        filterType = 'hobby-based';
        appliedFilters = ['hobby'];
        responseMessage = hasCity 
          ? `${userCity} ili dışında hobi alanlarınıza uygun ${hobbyOnlyEvents.length} etkinlik bulundu`
          : `Hobi alanlarınıza uygun ${hobbyOnlyEvents.length} etkinlik bulundu`;
        
        console.log('[eventController] ✅ Üçüncü en iyi eşleşme bulundu: Sadece Hobi');
        
        return res.json({
          success: true,
          data: finalEvents,
          message: responseMessage,
          filterInfo: {
            userCity,
            userHobbies: userHobbies.map(h => h.name),
            appliedFilters,
            filterType
          },
          userInfo: {
            hasCity,
            hasHobbies,
            city: userCity,
            hobbies: userHobbies.map(h => h.name)
          },
          pagination: {
            total: totalCount,
            page,
            limit,
            pages: Math.ceil(totalCount / limit)
          }
        });
      }
      
      console.log('[eventController] Hobi eşleşmesi de bulunamadı');
    }
    
    // AŞAMA 4: Hiçbir eşleşme bulunamadı - Genel etkinlikler
    console.log('[eventController] AŞAMA 4: Hiçbir eşleşme bulunamadı, genel etkinlikler getiriliyor...');
    
    const generalQuery = { status: 'active' };
    
    const generalEvents = await Event.find(generalQuery)
      .populate('organizer', 'username fullName profilePicture')
      .populate('hobby', 'name category')
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit);
    
    const generalTotal = await Event.countDocuments(generalQuery);
    
    console.log(`[eventController] Genel etkinlikler: ${generalTotal} etkinlik bulundu`);
    
    finalEvents = generalEvents;
    totalCount = generalTotal;
    filterType = 'general';
    appliedFilters = [];
    
    if (!hasCity && !hasHobbies) {
      responseMessage = 'Profil bilgilerinizi tamamlayın, size özel etkinlikler gösterelim';
    } else if (!hasCity) {
      responseMessage = 'İl bilginizi ekleyin, yakınınızdaki etkinlikleri gösterelim';
    } else if (!hasHobbies) {
      responseMessage = 'Hobi bilgilerinizi ekleyin, ilgi alanlarınıza uygun etkinlikleri gösterelim';
    } else {
      responseMessage = 'Kriterlerinize uygun etkinlik bulunamadı, genel etkinlikler gösteriliyor';
    }
    
    console.log('[eventController] ⚠️ Fallback: Genel etkinlikler döndürülüyor');
    
    res.json({
      success: true,
      data: finalEvents,
      message: responseMessage,
      filterInfo: {
        userCity,
        userHobbies: userHobbies.map(h => h.name),
        appliedFilters,
        filterType
      },
      userInfo: {
        hasCity,
        hasHobbies,
        city: userCity,
        hobbies: userHobbies.map(h => h.name)
      },
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Size özel etkinlikleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

// @desc    Yaklaşan etkinlikleri getir (48 saat içinde başlayacak)
// @route   GET /api/events/upcoming
// @access  Private
const getUpcomingEvents = async (req, res) => {
  try {
    console.log('[eventController] Yaklaşan etkinlikler getiriliyor, kullanıcı:', req.user.username);
    
    // Şu anki tarih
    const now = new Date();
    // 48 saat sonrası (2 gün)
    const fortyEightHoursLater = new Date(now.getTime() + (48 * 60 * 60 * 1000));
    
    console.log('[eventController] Tarih aralığı:', {
      now: now.toISOString(),
      fortyEightHoursLater: fortyEightHoursLater.toISOString()
    });
    
    // Kullanıcının katıldığı veya oluşturduğu etkinlikleri bul
    const user = await User.findById(req.user.id).populate({
      path: 'participatedEvents',
      match: {
        status: 'active'
      }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    // Kullanıcının katıldığı etkinlik ID'lerini al
    const participatedEventIds = user.participatedEvents.map(event => event._id);
    
    // Kullanıcının oluşturduğu etkinlikleri bul
    const createdEvents = await Event.find({
      organizer: req.user.id,
      status: 'active'
    });
    
    const createdEventIds = createdEvents.map(event => event._id);
    
    // Tüm kullanıcı etkinliklerini birleştir (katıldığı ve oluşturduğu)
    const allUserEventIds = [...new Set([...participatedEventIds, ...createdEventIds])];
    
    console.log('[eventController] Kullanıcının toplam etkinlik sayısı:', allUserEventIds.length);
    
    // 48 saat içinde başlayacak ve kullanıcının ilişkili olduğu etkinlikleri getir
    const upcomingEvents = await Event.find({
      _id: { $in: allUserEventIds },
      startDate: {
        $gte: now,
        $lte: fortyEightHoursLater
      },
      status: 'active'
    })
    .populate('organizer', 'username fullName profilePicture')
    .populate('hobby', 'name category')
    .sort({ startDate: 1 });
    
    console.log(`[eventController] ${upcomingEvents.length} yaklaşan etkinlik bulundu`);
    
    // Her etkinlik için kullanıcının rolünü belirle
    const eventsWithUserRole = upcomingEvents.map(event => {
      const eventObj = event.toObject();
      
      if (event.organizer._id.toString() === req.user.id) {
        eventObj.userRole = 'organizer';
      } else {
        eventObj.userRole = 'participant';
      }
      
      // Etkinliğe kalan süreyi hesapla
      const eventStartDate = new Date(event.startDate);
      const hoursUntil = Math.floor((eventStartDate - now) / (1000 * 60 * 60));
      const minutesUntil = Math.floor(((eventStartDate - now) / (1000 * 60)) % 60);
      
      eventObj.timeUntilStart = {
        hours: hoursUntil,
        minutes: minutesUntil
      };
      
      return eventObj;
    });
    
    // Etkinlik bilgilerini logla
    if (eventsWithUserRole.length > 0) {
      console.log('[eventController] Yaklaşan etkinlikler:', eventsWithUserRole.map(e => ({
        id: e._id,
        title: e.title,
        startDate: e.startDate,
        location: e.location?.address || 'Konum belirtilmemiş',
        role: e.userRole,
        timeUntil: `${e.timeUntilStart.hours} saat ${e.timeUntilStart.minutes} dakika`
      })));
    }
    
    res.json({
      success: true,
      data: eventsWithUserRole,
      message: eventsWithUserRole.length > 0 
        ? `${eventsWithUserRole.length} yaklaşan etkinliğiniz var` 
        : 'Önümüzdeki 48 saat içinde etkinliğiniz bulunmuyor'
    });
  } catch (error) {
    console.error('Yaklaşan etkinlikleri getirme hatası:', error);
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
  getUpcomingEvents,
  cleanupExpiredEvents
}; 