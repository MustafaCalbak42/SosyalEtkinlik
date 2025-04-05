const Event = require('../models/Event');
const Hobby = require('../models/Hobby');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Yeni etkinlik oluştur
// @route   POST /api/events
// @access  Private
const createEvent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
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

    // Hobi ID'sinin geçerli olup olmadığını kontrol et
    const hobbyExists = await Hobby.findById(hobby);
    if (!hobbyExists) {
      return res.status(404).json({ message: 'Geçersiz hobi ID\'si' });
    }

    // Etkinlik oluştur
    const event = new Event({
      title,
      description,
      organizer: req.user.id,
      hobby,
      location,
      startDate,
      endDate,
      maxParticipants,
      tags: tags || [],
      price: price || 0,
      requirements: requirements || []
    });

    // Etkinliği kaydet
    const createdEvent = await event.save();

    // Hobi modelinde etkinliği kaydet
    await Hobby.findByIdAndUpdate(hobby, {
      $push: { events: createdEvent._id }
    });

    // Organizatörün etkinliklerini güncelle
    await User.findByIdAndUpdate(req.user.id, {
      $push: { events: createdEvent._id }
    });

    res.status(201).json(createdEvent);
  } catch (error) {
    console.error('Etkinlik oluşturma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Tüm etkinlikleri getir
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
  try {
    const events = await Event.find({})
      .populate('organizer', 'username fullName profilePicture')
      .populate('hobby', 'name category')
      .sort({ startDate: 1 });
    
    res.json(events);
  } catch (error) {
    console.error('Etkinlikleri getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
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
  getEventsByHobby
}; 