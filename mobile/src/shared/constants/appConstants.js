/**
 * Uygulama Sabitleri
 * Web ve mobil uygulamalar için ortak sabit değerler
 */

// Etkinlik durumları
export const EVENT_STATUS = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  FULL: 'full'
};

// Etkinlik durumu renk eşleşmeleri
export const EVENT_STATUS_COLORS = {
  [EVENT_STATUS.ACTIVE]: 'success',
  [EVENT_STATUS.CANCELLED]: 'error',
  [EVENT_STATUS.COMPLETED]: 'info',
  [EVENT_STATUS.FULL]: 'warning'
};

// Hobi kategorileri
export const HOBBY_CATEGORIES = [
  'Spor',
  'Sanat',
  'Müzik',
  'Dans',
  'Yemek',
  'Seyahat',
  'Eğitim',
  'Teknoloji',
  'Doğa',
  'Diğer'
];

// Bildirim tipleri
export const NOTIFICATION_TYPES = {
  EVENT_INVITE: 'event_invite',
  EVENT_REMINDER: 'event_reminder',
  NEW_FOLLOWER: 'new_follower',
  EVENT_CANCELLED: 'event_cancelled',
  EVENT_UPDATED: 'event_updated',
  NEW_MESSAGE: 'new_message'
};

// Etkinlik filtreleri
export const EVENT_FILTERS = {
  ALL: 'all',
  UPCOMING: 'upcoming',
  PAST: 'past',
  PARTICIPATING: 'participating',
  ORGANIZING: 'organizing'
};

// Harita sabitleri
export const MAP_CONFIG = {
  DEFAULT_CENTER: { lat: 41.0082, lng: 28.9784 }, // İstanbul
  DEFAULT_ZOOM: 13,
  MAX_ZOOM: 18,
  MIN_ZOOM: 5
};

// Zamansal sabitler
export const TIME_CONSTANTS = {
  DAY_IN_MS: 86400000, // 24 saat
  HOUR_IN_MS: 3600000, // 60 dakika
  MINUTE_IN_MS: 60000 // 60 saniye
};

// Bildirim süreleri
export const NOTIFICATION_TIMING = {
  EVENT_REMINDER_HOURS: 24, // Etkinlikten 24 saat önce hatırlatma
};

// Kullanıcı ayarları anahtarları
export const USER_SETTINGS_KEYS = {
  THEME: 'theme',
  NOTIFICATIONS: 'notifications',
  LANGUAGE: 'language',
  PRIVACY: 'privacy'
};

// Uygulama dilleri
export const APP_LANGUAGES = {
  TR: 'tr',
  EN: 'en'
};

// Sayfalama için varsayılan boyutlar
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  EVENTS_PER_PAGE: 12,
  USERS_PER_PAGE: 20
};

// Local storage anahtarları
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  LANGUAGE: 'language',
  THEME: 'theme' 
};

// Varsayılan API endpointleri
export const API_ENDPOINTS = {
  AUTH: '/users',
  EVENTS: '/events',
  HOBBIES: '/hobbies',
  USERS: '/users'
};

// API hata kodları
export const API_ERROR_CODES = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  INTERNAL_SERVER_ERROR: 500
}; 