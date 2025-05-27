import React, { useState, useEffect, useRef } from 'react';
import { Box, Container, Grid, Typography, Paper, Button, Tab, Tabs, CircularProgress, Pagination, Divider, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import { LocationOn, Event, People, Category, Whatshot } from '@mui/icons-material';
import MainLayout from '../components/MainLayout';
import EventCard from '../components/Events/EventCard';
import CategoryFilter from '../components/Events/CategoryFilter';
import RecommendedUsers from '../components/Users/RecommendedUsers';
import UpcomingEvents from '../components/Events/UpcomingEvents';
import CreateEventForm from '../components/Events/CreateEventForm';
import { useAuth } from '../context/AuthContext';
import { getAllEvents, getRecommendedEvents, getNearbyEvents, getUpcomingEvents } from '../services/eventService';
import { useNavigate } from 'react-router-dom';

// Mock data for events (fallback only)
const mockEvents = [
  {
    id: 1,
    title: 'İstanbul Kültür Turu',
    description: 'İstanbul\'un tarihi ve kültürel yerlerini keşfedeceğimiz bir şehir turu.',
    image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    date: '2023-06-15T18:00:00',
    location: 'İstanbul, Sultanahmet',
    attendees: 12,
    maxAttendees: 20,
    category: 'Seyahat'
  },
  {
    id: 2,
    title: 'Doğa Yürüyüşü',
    description: 'Belgrad Ormanı\'nda hafta sonu doğa yürüyüşü etkinliği.',
    image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    date: '2023-06-18T09:00:00',
    location: 'İstanbul, Belgrad Ormanı',
    attendees: 8,
    maxAttendees: 15,
    category: 'Doğa'
  },
  {
    id: 3,
    title: 'Müzik Atölyesi',
    description: 'Gitar ve piyano ile müzik atölyesi.',
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    date: '2023-06-20T17:30:00',
    location: 'İstanbul, Kadıköy',
    attendees: 6,
    maxAttendees: 10,
    category: 'Müzik'
  },
  {
    id: 4,
    title: 'Yemek Atölyesi',
    description: 'İtalyan mutfağından seçme tarifleri öğreneceğimiz bir workshop.',
    image: 'https://images.unsplash.com/photo-1505935428862-770b6f24f629?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    date: '2023-06-22T19:00:00',
    location: 'İstanbul, Beşiktaş',
    attendees: 10,
    maxAttendees: 12,
    category: 'Yemek'
  }
];



const HeroSection = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
  color: 'white',
  padding: theme.spacing(8, 0, 6),
  textAlign: 'center',
  marginBottom: theme.spacing(4),
  borderRadius: theme.spacing(2),
}));

function HomePage() {
  const [tabValue, setTabValue] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Sayfalandırma state'leri
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // Sayfa başına gösterilecek etkinlik sayısı
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    page: 1
  });

  // Size Özel Etkinlikler için state'ler
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [errorRecommended, setErrorRecommended] = useState('');
  const [filterInfo, setFilterInfo] = useState(null);
  
  // Yakınımdaki etkinlikler için state'ler
  const [nearbyEvents, setNearbyEvents] = useState([]);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [errorNearby, setErrorNearby] = useState('');
  const [userCoordinates, setUserCoordinates] = useState(null);
  const [showDistanceInfo, setShowDistanceInfo] = useState(false);
  
  // Yaklaşan etkinlikler için state'ler
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const [errorUpcoming, setErrorUpcoming] = useState('');

  // Konum izleme referansı
  const watchIdRef = useRef(null);

  useEffect(() => {
    fetchEvents();
  }, [currentPage, selectedCategory]); // Sayfa değiştiğinde ve kategori değiştiğinde etkinlikleri yeniden yükle

  // Kullanıcı giriş yapmışsa, önerilen etkinlikleri ve yaklaşan etkinlikleri yükle
  useEffect(() => {
    if (isAuthenticated) {
      fetchRecommendedEvents();
      fetchUpcomingEvents();
    }
  }, [isAuthenticated]);

  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log(`[HomePage] Fetching events - page: ${currentPage}, limit: ${itemsPerPage}, category: ${selectedCategory}`);
      const result = await getAllEvents(currentPage, itemsPerPage, selectedCategory);
      
      if (result.success && result.data) {
        console.log('[HomePage] Successfully loaded events:', result.data.length);
        setEvents(result.data);
        if (result.pagination) {
          setPagination(result.pagination);
        }
      } else {
        console.error('[HomePage] Failed to load events:', result.message);
        setError('Etkinlikler yüklenirken bir hata oluştu: ' + result.message);
        // Veri gelmezse mock verileri kullan
        setEvents(mockEvents);
      }
    } catch (error) {
      console.error('[HomePage] Error loading events:', error);
      setError('Etkinlikler yüklenirken bir hata oluştu');
      setEvents(mockEvents);
    } finally {
      setLoading(false);
    }
  };

  // Yaklaşan etkinlikleri yükle (48 saat içinde başlayacak)
  const fetchUpcomingEvents = async () => {
    if (!isAuthenticated) return;

    setLoadingUpcoming(true);
    setErrorUpcoming('');
    
    try {
      const response = await getUpcomingEvents();
      if (response.success) {
        setUpcomingEvents(response.data);
        console.log(`[HomePage] ${response.data.length} yaklaşan etkinlik yüklendi`);
      } else {
        setErrorUpcoming(response.message || 'Yaklaşan etkinlikler yüklenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Yaklaşan etkinlikleri yüklerken hata:', error);
      setErrorUpcoming('Yaklaşan etkinlikler yüklenirken bir hata oluştu');
    } finally {
      setLoadingUpcoming(false);
    }
  };

  // Önerilen etkinlikleri yükle
  const fetchRecommendedEvents = async () => {
    if (!isAuthenticated) return;

    setLoadingRecommended(true);
    setErrorRecommended('');
    
    try {
      // Kullanıcı profilinden il bilgisini çıkar
      let userCity = null;
      if (user && user.location && user.location.address) {
        // Adres bilgisi varsa (il adını çıkarmaya çalış)
        const addressParts = user.location.address.split(',');
        if (addressParts.length > 0) {
          // Türkiye adres formatına göre il ilk parçadadır
          userCity = addressParts[0].trim();
          console.log(`[HomePage] Kullanıcının ili: ${userCity}`);
        }
      }

      // İl bilgisini API'ye gönder
      const response = await getRecommendedEvents(1, 8, userCity); // Daha fazla etkinlik getir
      if (response.success) {
        setRecommendedEvents(response.data);
        
        // Backend'den gelen filtreleme bilgilerini kaydet
        if (response.filterInfo) {
          setFilterInfo(response.filterInfo);
          console.log('[HomePage] Filtreleme bilgileri:', response.filterInfo);
        }
        
        // Backend'den gelen mesajı ve kullanıcı bilgilerini logla
        console.log(`[HomePage] ${response.message}`);
        if (response.userInfo) {
          console.log('[HomePage] Kullanıcı bilgileri:', response.userInfo);
        }
        
        // Eğer hiç etkinlik yoksa hata mesajı göster
        if (response.data.length === 0) {
          const userInfo = response.userInfo || {};
          if (!userInfo.hasCity && !userInfo.hasHobbies) {
            setErrorRecommended('Lütfen profilinizde şehir ve hobi bilgilerinizi güncelleyin.');
          } else if (!userInfo.hasCity) {
            setErrorRecommended('Lütfen profilinizde şehir bilginizi belirtin.');
          } else if (!userInfo.hasHobbies) {
            setErrorRecommended('Lütfen profilinizde hobi ve ilgi alanlarınızı ekleyin.');
          }
        }
      } else {
        setErrorRecommended(response.message || 'Önerilen etkinlikler yüklenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Önerilen etkinlikleri yüklerken hata:', error);
      setErrorRecommended('Önerilen etkinlikler yüklenirken bir hata oluştu');
    } finally {
      setLoadingRecommended(false);
    }
  };

  // Yakınımdaki sekmesine tıklandığında kullanıcının konumunu al
  useEffect(() => {
    if (tabValue === 1) { // Yakınımdaki sekmesi index 1'de
      getUserLocation();
    } else if (watchIdRef.current) {
      // Başka bir sekmeye geçildiğinde konum izlemeyi durdur
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    // Component unmount olduğunda veya tab değiştiğinde konum izlemeyi temizle
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [tabValue]);

  // Kullanıcının konum bilgisini al
  const getUserLocation = () => {
    setLoadingNearby(true);
    setErrorNearby('');
    
    if (navigator.geolocation) {
      // Permissions API kontrolü
      if (navigator.permissions && navigator.permissions.query) {
        // Önce konum izni kontrolü
        navigator.permissions.query({name: 'geolocation'}).then(permissionStatus => {
          console.log("[HomePage] Konum izni durumu:", permissionStatus.state);
          
          if (permissionStatus.state === 'denied') {
            setErrorNearby('Konum erişimine izin verilmedi. Lütfen tarayıcı ayarlarınızdan konum iznini etkinleştirin.');
            setLoadingNearby(false);
            return;
          }
          
          watchPositionWithTimeout();
        }).catch(error => {
          console.error("[HomePage] Konum izni kontrolü sırasında hata:", error);
          // Permissions API hatası durumunda doğrudan konum almayı dene
          watchPositionWithTimeout();
        });
      } else {
        // Permissions API desteklenmiyorsa doğrudan konum al
        console.log("[HomePage] Permissions API desteklenmiyor, doğrudan konum alınıyor");
        watchPositionWithTimeout();
      }
    } else {
      setErrorNearby('Tarayıcınız konum hizmetlerini desteklemiyor. Lütfen başka bir tarayıcı kullanın.');
      setLoadingNearby(false);
    }
  };

  // Zamanaşımı ile konum takibi
  const watchPositionWithTimeout = () => {
    // İlk konum bilgisi alınmadıysa 15 saniye sonra timeout
    const locationTimeout = setTimeout(() => {
      setErrorNearby('Konum alınamadı. Lütfen tekrar deneyin veya manuel olarak bir konum girin.');
      setLoadingNearby(false);
    }, 15000);
    
    // Konumu sürekli izle
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        // İlk konum alındığında timeout'u temizle
        clearTimeout(locationTimeout);
        
        const { latitude, longitude } = position.coords;
        console.log("[HomePage] Konum güncellendi:", latitude, longitude);
        
        // Konum değiştiği için state'i güncelle
        setUserCoordinates([latitude, longitude]);
        
        // Eğer ilk defa konum alınıyorsa veya konum önemli ölçüde değiştiyse etkinlikleri yeniden yükle
        if (!userCoordinates || 
            Math.abs(userCoordinates[0] - latitude) > 0.01 || 
            Math.abs(userCoordinates[1] - longitude) > 0.01) {
          // Yükleme durumunu güncelle ve kullanıcıya bilgi ver
          setLoadingNearby(true);
          // Konum alındıktan sonra yakındaki etkinlikleri getir
          fetchNearbyEvents([latitude, longitude]);
        }
      },
      (error) => {
        clearTimeout(locationTimeout);
        console.error("[HomePage] Konum alınamadı:", error);
        
        let errorMessage = 'Konumunuz alınamadı.';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Konum erişimine izin verilmedi. Lütfen tarayıcı ayarlarınızdan konum iznini etkinleştirin.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Konum bilgisi kullanılamıyor. Lütfen başka bir cihaz veya tarayıcı kullanmayı deneyin.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Konum alınırken zaman aşımı oluştu. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.';
            break;
          default:
            errorMessage = 'Konumunuz alınamadı. Lütfen tekrar deneyin.';
        }
        
        setErrorNearby(errorMessage);
        setLoadingNearby(false);
      },
      { 
        enableHighAccuracy: true, // Daha hassas konum
        timeout: 15000, // 15 saniye timeout
        maximumAge: 30000 // En fazla 30 saniyelik önbelleğe alınmış konum
      }
    );
    
    // watchId'yi ref'e kaydet
    watchIdRef.current = watchId;
  };

  // Yakındaki etkinlikleri getir
  const fetchNearbyEvents = async (coords) => {
    if (!coords) {
      setErrorNearby('Konum bilgisi gerekli. Lütfen konum izni verin.');
      setLoadingNearby(false);
      return;
    }
    
    setLoadingNearby(true);
    setErrorNearby('');
    setShowDistanceInfo(true);
    
    try {
      // Koordinatları ayırarak lat ve lng parametrelerini hazırla
      const [latitude, longitude] = coords;
      
      // 20 km içindeki etkinlikleri getir
      const response = await getNearbyEvents(coords, 20, 1, itemsPerPage * 3);
      
      if (response.success) {
        console.log("[HomePage] Yakındaki etkinlikler:", response.data);
        if (response.data && response.data.length > 0) {
          setNearbyEvents(response.data);
          
          if (response.pagination) {
            setPagination(response.pagination);
          }
          
          // API'den gelen mesajı göster (örn. demo veri bilgisi)
          if (response.message) {
            console.log("[HomePage] API mesajı:", response.message);
          }
        } else {
          setNearbyEvents([]);
          setErrorNearby('Yakınınızda (20 km içinde) etkinlik bulunamadı. Daha farklı bir konumda arama yapmak için bölge değiştirin.');
        }
      } else {
        setErrorNearby(response.message || 'Yakındaki etkinlikler yüklenemedi.');
        setNearbyEvents([]);
      }
    } catch (error) {
      console.error("[HomePage] Yakındaki etkinlikler yüklenirken hata:", error);
      setErrorNearby('Yakındaki etkinlikler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      setNearbyEvents([]);
    } finally {
      setLoadingNearby(false);
    }
  };

  // İki konum arasındaki mesafeyi hesapla (km cinsinden)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    
    const R = 6371; // Dünya yarıçapı (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Kilometre cinsinden mesafe
    
    return distance;
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCreateEventOpen = () => {
    setCreateEventOpen(true);
  };

  const handleCreateEventClose = (refresh = false) => {
    setCreateEventOpen(false);
    if (refresh) {
      fetchEvents();
      // Eğer kullanıcı giriş yapmışsa, önerilen etkinlikleri ve yaklaşan etkinlikleri de yenile
      if (isAuthenticated) {
        fetchRecommendedEvents();
        fetchUpcomingEvents();
      }
    }
  };

  // Filtreleme artık server tarafında yapılacağı için bu fonksiyonu kaldırıyoruz
  // Filtrelenmiş etkinlikleri direkt API'den alıyoruz
  const filteredEvents = events;

  // Event ID veya _id alanına göre key oluştur
  const getEventKey = (event) => {
    return event._id || event.id || Math.random().toString(36).substring(7);
  };

  // Etkinlik konumu için formatla
  const formatEventLocation = (event) => {
    if (event.location) {
      if (typeof event.location === 'string') {
        return event.location;
      }
      if (typeof event.location === 'object' && event.location.address) {
        return event.location.address;
      }
    }
    return 'Konum belirtilmemiş';
  };

  // Katılımcı sayısı ve maksimum sayısını formatla
  const getAttendeeInfo = (event) => {
    // API'den gelen format
    if (event.participants && event.maxParticipants) {
      return {
        attendees: event.participants.length,
        maxAttendees: event.maxParticipants
      };
    }
    // Mock data format
    if (event.attendees !== undefined && event.maxAttendees !== undefined) {
      return {
        attendees: event.attendees,
        maxAttendees: event.maxAttendees
      };
    }
    // Varsayılan
    return {
      attendees: 0,
      maxAttendees: 10
    };
  };

  // Kategori bilgisini formatla
  const getEventCategory = (event) => {
    if (event.hobby && typeof event.hobby === 'object') {
      return event.hobby.category;
    }
    return event.category || 'Diğer';
  };

  // Etkinlik görsel URL'si formatla - İyileştirilmiş versiyon
  const getEventImage = (event) => {
    try {
      // Önce etkinliğin kendi görselini kontrol et
      if (event.image) {
        return event.image;
      }
      
      // Etkinliğin kategorisini al
      const category = getEventCategory(event);
      
      // Etkinlik başlığı ve açıklamasını küçük harfe çevir
      const title = (event.title || '').toLowerCase();
      const description = (event.description || '').toLowerCase();
      const tags = Array.isArray(event.tags) ? event.tags.map(tag => tag.toLowerCase()) : [];
      const hobbyName = event.hobby && typeof event.hobby === 'object' ? (event.hobby.name || '').toLowerCase() : '';
      
      // Tüm içeriği birleştirerek daha güçlü bir arama yap
      const allContent = `${title} ${description} ${tags.join(' ')} ${hobbyName}`;
      
      // Kategori bazlı anahtar kelimeler ve görsel URL'leri - Güncellenmiş ve test edilmiş URL'ler
      const categoryKeywords = {
        // SPOR KATEGORİSİ
        'Spor': {
          'futbol': 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'soccer': 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'football': 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'basketbol': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'basketball': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'basket': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'tenis': 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'tennis': 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'voleybol': 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'volleyball': 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'yüzme': 'https://images.unsplash.com/photo-1530549387789-4c1017266635?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'swimming': 'https://images.unsplash.com/photo-1530549387789-4c1017266635?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'havuz': 'https://images.unsplash.com/photo-1530549387789-4c1017266635?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'koşu': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'running': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'bisiklet': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'cycling': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'bicycle': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'golf': 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'yoga': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'boks': 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'boxing': 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60'
        },
        
        // MÜZİK KATEGORİSİ
        'Müzik': {
          'gitar': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'guitar': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'piyano': 'https://images.unsplash.com/photo-1552422535-c45813c61732?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'piano': 'https://images.unsplash.com/photo-1552422535-c45813c61732?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'keman': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'violin': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'davul': 'https://images.unsplash.com/photo-1571327073757-af4cf4d52b1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'drums': 'https://images.unsplash.com/photo-1571327073757-af4cf4d52b1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'konser': 'https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'concert': 'https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'dj': 'https://images.unsplash.com/photo-1571266028027-a8bbe87a692d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'rock': 'https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'caz': 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'jazz': 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'klasik müzik': 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'classical music': 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60'
        },
        
        // SANAT KATEGORİSİ
        'Sanat': {
          'resim': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'painting': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'heykel': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'sculpture': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'fotoğraf': 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'photography': 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'çizim': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'drawing': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'sergi': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'exhibition': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60'
        },
        
        // DANS KATEGORİSİ
        'Dans': {
          'bale': 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'ballet': 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'salsa': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'tango': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'hip hop': 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'halk dansları': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'folk dance': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'modern dans': 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'modern dance': 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60'
        },
        
        // YEMEK KATEGORİSİ
        'Yemek': {
          'pasta': 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'cake': 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'kahve': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'coffee': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'barbekü': 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'barbecue': 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'bbq': 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'pizza': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'sushi': 'https://images.unsplash.com/photo-1553621042-f6e147245754?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'türk mutfağı': 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'turkish cuisine': 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'italyan': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'italian': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'vegan': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60'
        },
        
        // SEYAHAT KATEGORİSİ
        'Seyahat': {
          'istanbul': 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'kapadokya': 'https://images.unsplash.com/photo-1570856033163-05f258ec9481?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'cappadocia': 'https://images.unsplash.com/photo-1570856033163-05f258ec9481?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'antalya': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'bodrum': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'paris': 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'londra': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'roma': 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'rome': 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'kamp': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'camping': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60'
        },
        
        // TEKNOLOJİ KATEGORİSİ
        'Teknoloji': {
          'yazılım': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'software': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'kod': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'code': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'yapay zeka': 'https://images.unsplash.com/photo-1507146153580-69a1fe6d8aa1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'artificial intelligence': 'https://images.unsplash.com/photo-1507146153580-69a1fe6d8aa1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'ai': 'https://images.unsplash.com/photo-1507146153580-69a1fe6d8aa1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'robotik': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'robotics': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'robot': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'blockchain': 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'bitcoin': 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'siber güvenlik': 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'cyber security': 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60'
        },
        
        // DOĞA KATEGORİSİ
        'Doğa': {
          'dağ': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'mountain': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'göl': 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'lake': 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'deniz': 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'sea': 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'orman': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'forest': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'şelale': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'waterfall': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'mağara': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'cave': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60'
        },
        
        // EĞİTİM KATEGORİSİ
        'Eğitim': {
          'seminer': 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'seminar': 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'konferans': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'conference': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'atölye': 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'workshop': 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'dil': 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'language': 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'kitap': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'book': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          
          'bilim': 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'science': 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60'
        }
      };
      
      // Kategori bazlı varsayılan görseller - Güncellenmiş ve test edilmiş URL'ler
      const categoryImages = {
        'Müzik': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'Spor': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'Sanat': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'Dans': 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'Yemek': 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'Seyahat': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'Teknoloji': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'Doğa': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'Eğitim': 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'Diğer': 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60'
      };
      
      // Kategori bulunamadıysa varsayılan görsel döndür
      if (!category) {
        return categoryImages['Diğer'];
      }
      
      // Kategori alt türleri için anahtar kelimeler varsa kontrol et
      if (categoryKeywords[category]) {
        const keywords = categoryKeywords[category];
        
        // Anahtar kelimeleri ara
        for (const [keyword, imageUrl] of Object.entries(keywords)) {
          if (allContent.includes(keyword)) {
            return imageUrl;
          }
        }
      }
      
      // Alt kategori belirlenemezse ana kategori görseli kullan
      return categoryImages[category] || categoryImages['Diğer'];
    } catch (error) {
      console.error(`[getEventImage] Hata: "${event.title}" için görsel belirlenirken hata oluştu:`, error);
      // Hata durumunda varsayılan olarak genel etkinlik görseli döndür
      return 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60';
    }
  };

  // Sayfa değişikliği
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    window.scrollTo(0, 0); // Sayfa değiştiğinde en üste git
  };

  // Filtreleme türüne göre badge ve açıklama getir
  const getFilterTypeDisplay = (filterInfo) => {
    if (!filterInfo) return null;
    
    const { filterType, userCity, userHobbies } = filterInfo;
    
    switch (filterType) {
      case 'city-and-hobby':
        return {
          badge: 'Şehir + Hobi Bazlı',
          color: 'success',
          icon: '🎯',
          description: `${userCity} ilinizdeki ${userHobbies.join(', ')} hobi alanlarınıza uygun etkinlikler`
        };
      case 'city-based':
        return {
          badge: 'Şehir Bazlı',
          color: 'info',
          icon: '📍',
          description: `${userCity} ilinizdeki etkinlikler (hobi eşleşmesi bulunamadı)`
        };
      case 'hobby-based':
        return {
          badge: 'Hobi Bazlı',
          color: 'warning',
          icon: '🎨',
          description: `${userHobbies.join(', ')} hobi alanlarınıza uygun etkinlikler (şehir dışı)`
        };
      case 'general':
        return {
          badge: 'Genel',
          color: 'default',
          icon: '📋',
          description: 'Genel etkinlikler (profil bilgilerinizi tamamlayın)'
        };
      default:
        return null;
    }
  };

  // Size Özel Etkinlikler Bölümü - İyileştirilmiş versiyon
  const renderRecommendedEvents = () => {
    if (!isAuthenticated) {
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          Hobilerinize ve bulunduğunuz ile göre özel etkinlikleri görmek için <Button 
            variant="outlined" 
            size="small" 
            color="primary"
            sx={{ ml: 1 }}
            onClick={() => navigate('/login')}
          >
            Giriş Yapın
          </Button>
        </Alert>
      );
    }

    if (loadingRecommended) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ ml: 2, mt: 0.5 }}>
            Size özel etkinlikler yükleniyor...
          </Typography>
        </Box>
      );
    }

    if (errorRecommended) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorRecommended}
          <Button 
            variant="outlined" 
            size="small" 
            color="primary"
            sx={{ mt: 1, ml: 1 }}
            onClick={fetchRecommendedEvents}
          >
            Tekrar Dene
          </Button>
        </Alert>
      );
    }

    if (recommendedEvents.length === 0) {
      // Kullanıcının profil durumunu kontrol et
      const userHobbies = user?.hobbies || [];
      const userLocation = user?.location?.address || '';
      
      let message = '';
      let suggestions = [];
      
      if (!userLocation && userHobbies.length === 0) {
        message = 'Size özel etkinlikler gösterebilmek için profil bilgilerinizi tamamlamanız gerekiyor.';
        suggestions = ['Profilinizde bulunduğunuz ili belirtin', 'İlgi alanlarınızı ve hobilerini ekleyin'];
      } else if (!userLocation) {
        message = 'Hobilerinize uygun etkinlikler var ancak bulunduğunuz ili belirtmediniz.';
        suggestions = ['Profilinizde bulunduğunuz ili belirtin'];
      } else if (userHobbies.length === 0) {
        message = 'Bulunduğunuz ildeki etkinlikler mevcut ancak hobilerini belirtmediniz.';
        suggestions = ['Profilinizde ilgi alanlarınızı ve hobilerini ekleyin'];
      } else {
        message = 'Belirlediğiniz hobi ve konum bilgilerine uygun etkinlik bulunamadı.';
        suggestions = ['Farklı hobiler ekleyebilirsiniz', 'Yeni etkinlik oluşturabilirsiniz'];
      }

      return (
        <Box sx={{ mb: 2 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              {message}
            </Typography>
            {suggestions.length > 0 && (
              <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                {suggestions.map((suggestion, index) => (
                  <Typography component="li" variant="body2" key={index}>
                    {suggestion}
                  </Typography>
                ))}
              </Box>
            )}
        </Alert>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => navigate('/profile-settings')}
            >
              Profili Düzenle
            </Button>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={handleCreateEventOpen}
            >
              Etkinlik Oluştur
            </Button>
          </Box>
        </Box>
      );
    }

    // Filtreleme bilgilerini göster
    const filterDisplay = getFilterTypeDisplay(filterInfo);

    return (
      <>


        {/* Etkinlik kartları */}
        <Grid container spacing={3}>
          {recommendedEvents.map(event => (
            <Grid item xs={12} sm={6} md={3} key={getEventKey(event)}>
              <EventCard 
                event={{
                  ...event,
                  title: event.title,
                  description: event.description,
                  image: getEventImage(event),
                  date: event.startDate || event.date,
                  location: formatEventLocation(event),
                  ...getAttendeeInfo(event),
                  category: getEventCategory(event)
                }} 
                showRecommendationBadge={true}
              />
            </Grid>
          ))}
        </Grid>

        {/* Daha fazla etkinlik bağlantısı */}
        {recommendedEvents.length >= 4 && (
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Size uygun daha fazla etkinlik var
            </Typography>
            <Button 
              variant="outlined" 
              color="primary"
              onClick={() => {
                setSelectedCategory('Tümü');
                setTabValue(0);
              }}
            >
              Tüm Etkinlikleri Görüntüle
            </Button>
          </Box>
        )}
      </>
    );
  };

  // Şu anki sekmeye göre etkinlikleri render et
  const renderEventsByTab = () => {
    switch (tabValue) {
      case 0: // Etkinlikler sekmesi
        return renderAllEvents();
      case 1: // Yakınımdaki sekmesi
        return renderNearbyEvents();
      default:
        return renderAllEvents();
    }
  };

  // Tüm etkinlikleri render et
  const renderAllEvents = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Paper sx={{ p: 3, textAlign: 'center', color: 'error.main' }}>
          {error}
        </Paper>
      );
    }
    
    if (filteredEvents.length === 0) {
      return (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
          <Typography>
            Bu kategoride şu anda etkinlik bulunmuyor.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 2 }}
            onClick={handleCreateEventOpen}
          >
            Etkinlik Oluştur
          </Button>
        </Paper>
      );
    }
    
    return (
      <>
        <Grid container spacing={3}>
          {filteredEvents.map(event => (
            <Grid item xs={12} sm={6} key={getEventKey(event)}>
              <EventCard 
                event={{
                  ...event,
                  title: event.title,
                  description: event.description,
                  image: getEventImage(event),
                  date: event.startDate || event.date,
                  location: formatEventLocation(event),
                  ...getAttendeeInfo(event),
                  category: getEventCategory(event)
                }} 
              />
            </Grid>
          ))}
        </Grid>
        
        {/* Sayfalandırma */}
        {pagination.pages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination 
              count={pagination.pages} 
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              size="large"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </>
    );
  };

  // Yakınımdaki etkinlikleri render et
  const renderNearbyEvents = () => {
    if (loadingNearby && !nearbyEvents.length) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (errorNearby) {
      return (
        <Paper sx={{ p: 3, textAlign: 'center', color: 'error.main' }}>
          {errorNearby}
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 2, ml: 2 }}
            onClick={getUserLocation}
          >
            Tekrar Dene
          </Button>
        </Paper>
      );
    }
    
    if (nearbyEvents.length === 0) {
      return (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
          <Typography>
            Yakınınızda (20 km içinde) etkinlik bulunamadı.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 2 }}
            onClick={handleCreateEventOpen}
          >
            Etkinlik Oluştur
          </Button>
        </Paper>
      );
    }
    
    return (
      <>
        {showDistanceInfo && (
          <Box sx={{ mb: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Box>
                <Typography variant="body2" fontWeight="medium">
                  <LocationOn fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  Konumunuz anlık olarak takip ediliyor. Bulunduğunuz konuma 20 km mesafedeki etkinlikler listeleniyor.
                </Typography>
                {loadingNearby && (
                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <CircularProgress size={12} sx={{ mr: 1 }} />
                    Konum güncellendiği için etkinlikler yeniden yükleniyor...
                  </Typography>
                )}
              </Box>
            </Alert>
          </Box>
        )}
        
        <Grid container spacing={3}>
          {nearbyEvents.map(event => {
            // API'den gelen mesafe bilgisini kontrol et
            let distance = null;
            
            // Öncelikle event.distance alanını kontrol et (API'den gelmiş olabilir)
            if (event.distance) {
              distance = `${event.distance} km uzaklıkta`;
            } 
            // API'den mesafe gelmemişse, koordinatlar ile hesapla
            else if (userCoordinates && event.location && event.location.coordinates) {
              const eventCoords = event.location.coordinates;
              // MongoDB formatı: [longitude, latitude]
              const calculatedDistance = calculateDistance(
                userCoordinates[0], userCoordinates[1], 
                eventCoords[1], eventCoords[0]
              );
              
              if (calculatedDistance !== null) {
                distance = `${calculatedDistance.toFixed(1)} km uzaklıkta`;
              }
            }
            
            return (
              <Grid item xs={12} sm={6} key={getEventKey(event)}>
                <EventCard 
                  event={{
                    ...event,
                    title: event.title,
                    description: event.description,
                    image: getEventImage(event),
                    date: event.startDate || event.date,
                    location: formatEventLocation(event),
                    distance: distance,
                    ...getAttendeeInfo(event),
                    category: getEventCategory(event)
                  }} 
                />
              </Grid>
            );
          })}
        </Grid>
      </>
    );
  };

  return (
    <MainLayout>
      <HeroSection>
        <Typography variant="h3" gutterBottom fontWeight="bold">
          Ortak İlgi Alanlarını Keşfet
        </Typography>
        <Typography variant="h5" paragraph>
          Sosyal etkinlikler ile yeni arkadaşlar edin, hobilerini paylaş
        </Typography>
        <Button 
          variant="contained" 
          color="secondary" 
          size="large"
          onClick={handleCreateEventOpen}
          sx={{ mt: 2, fontWeight: 'bold', py: 1.2, px: 4 }}
        >
          Etkinlik Oluştur
        </Button>
      </HeroSection>



      {/* Size Özel Etkinlikler Bölümü */}
      <Box sx={{ mb: 5 }}>
        <Paper sx={{ p: 3, borderRadius: 2, mb: 2, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Whatshot sx={{ mr: 1, color: 'error.main' }} />
            <Typography variant="h5" component="h2" fontWeight="bold" color="primary">
              Size Özel Etkinlikler
            </Typography>
          </Box>
          
          <Typography variant="body1" color="text.primary" sx={{ mb: 2, fontWeight: 500 }}>
            {isAuthenticated 
              ? 'Kayıt olurken seçtiğiniz il ve hobi bilgilerinize göre size özel etkinlikler burada listelenir.' 
              : 'Giriş yapın ve kayıt olurken seçtiğiniz il ve hobiler ile eşleşen özel etkinlikleri keşfedin.'}
          </Typography>
          

          
          {!isAuthenticated && (
            <Box sx={{ 
              p: 2, 
              bgcolor: 'rgba(255, 152, 0, 0.08)', 
              borderRadius: 1, 
              border: '1px solid rgba(255, 152, 0, 0.2)',
              mb: 3
            }}>
              <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600, mb: 1 }}>
                💡 Nasıl Çalışır?
              </Typography>
              <Typography variant="body2" color="text.secondary" component="div">
                • Kayıt olurken <strong>şehir bilginizi</strong> seçin → O ildeki etkinlikler öncelikli gösterilir<br/>
                • <strong>Hobi ve ilgi alanlarınızı</strong> belirtin → Size uygun etkinlikler filtrelenir<br/>
                • Sistem bu iki kritere göre size özel bir liste oluşturur
              </Typography>
            </Box>
          )}
          
          {!isAuthenticated && (
            <Box sx={{ mb: 3 }}>
              <Alert severity="info" icon={false} sx={{ bgcolor: 'rgba(25, 118, 210, 0.1)', border: '1px solid rgba(25, 118, 210, 0.3)' }}>
                <Typography variant="body2" gutterBottom>
                  🎯 <strong>Nasıl çalışır?</strong>
                </Typography>
                <Typography variant="body2" component="div">
                  • Kayıt olurken seçtiğiniz <strong>şehir bilgisi</strong> ile o ildeki etkinlikler
                  <br />
                  • Seçtiğiniz <strong>hobi ve ilgi alanları</strong> ile uyumlu etkinlikler
                  <br />
                  • Bu iki kritere göre size özel filtreli liste
                </Typography>
              </Alert>
              
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button 
                  variant="contained" 
                color="primary"
                onClick={() => navigate('/login')}
                  sx={{ fontWeight: 'bold' }}
              >
                  Giriş Yap
              </Button>
              <Button 
                variant="outlined" 
                color="primary"
                  onClick={() => navigate('/register')}
              >
                  Kayıt Ol
              </Button>
              </Box>
            </Box>
          )}
          
          <Divider sx={{ mb: 3 }} />
          
          {isAuthenticated && renderRecommendedEvents()}
        </Paper>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Box sx={{ mb: 3 }}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                variant="fullWidth"
                textColor="primary"
                indicatorColor="primary"
              >
                <Tab icon={<Event />} label="Etkinlikler" />
                <Tab icon={<LocationOn />} label="Yakınımdaki" />
              </Tabs>
            </Paper>
            
            {/* Sadece 'Etkinlikler' sekmesinde kategori filtresini göster */}
            {tabValue === 0 && (
              <CategoryFilter 
                selectedCategory={selectedCategory} 
                onSelectCategory={(category) => {
                  setSelectedCategory(category);
                  setCurrentPage(1); // Kategori değiştiğinde ilk sayfaya dön
                }} 
              />
            )}
            
            <Typography variant="h5" component="h2" fontWeight="bold" sx={{ mt: 3, mb: 2 }}>
              {tabValue === 0 ? (
                selectedCategory === 'Tümü' ? 'Tüm Etkinlikler' : `${selectedCategory} Etkinlikleri`
              ) : tabValue === 1 ? (
                'Yakınımdaki Etkinlikler'
              ) : (
                'Arkadaşlarımın Etkinlikleri'
              )}
            </Typography>
            
            {/* Seçilen sekmeye göre içeriği render et */}
            {renderEventsByTab()}
          </Box>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Event sx={{ mr: 1 }} color="primary" />
              <Typography variant="h6" component="h3" fontWeight="bold">
                Yaklaşan Etkinlikleriniz (48 Saat İçinde)
              </Typography>
            </Box>
            <UpcomingEvents 
              events={upcomingEvents} 
              loading={loadingUpcoming}
              error={errorUpcoming}
              onRetry={fetchUpcomingEvents}
            />
            <Button
              variant="text"
              color="primary"
              fullWidth
              sx={{ mt: 1 }}
              onClick={() => navigate('/profile')}
            >
              Tümünü Görüntüle
            </Button>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <People sx={{ mr: 1 }} color="primary" />
              <Typography variant="h6" component="h3" fontWeight="bold">
                Size Benzer Kişiler
              </Typography>
            </Box>
            <RecommendedUsers />
          </Paper>
        </Grid>
      </Grid>
      
      {/* Etkinlik oluşturma modalı */}
      <CreateEventForm 
        open={createEventOpen} 
        onClose={handleCreateEventClose} 
      />
    </MainLayout>
  );
}

export default HomePage; 