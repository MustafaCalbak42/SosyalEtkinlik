import React, { useState, useEffect } from 'react';
import { Box, Container, Grid, Typography, Paper, Button, Tab, Tabs, InputBase, IconButton, CircularProgress, Pagination, Divider, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Search as SearchIcon, LocationOn, Event, People, Category, Whatshot } from '@mui/icons-material';
import MainLayout from '../components/MainLayout';
import EventCard from '../components/Events/EventCard';
import CategoryFilter from '../components/Events/CategoryFilter';
import RecommendedUsers from '../components/Users/RecommendedUsers';
import UpcomingEvents from '../components/Events/UpcomingEvents';
import CreateEventForm from '../components/Events/CreateEventForm';
import { useAuth } from '../context/AuthContext';
import { getAllEvents, getRecommendedEvents } from '../services/eventService';
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

const SearchBox = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(4),
  width: '100%',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  padding: theme.spacing(1, 1, 1, 0),
  paddingLeft: theme.spacing(3),
  width: '100%',
  '& input': {
    transition: theme.transitions.create('width'),
    fontSize: 16,
    padding: theme.spacing(1.5),
  },
}));

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

  useEffect(() => {
    fetchEvents();
  }, [currentPage, selectedCategory]); // Sayfa değiştiğinde ve kategori değiştiğinde etkinlikleri yeniden yükle

  // Kullanıcı giriş yapmışsa, önerilen etkinlikleri yükle
  useEffect(() => {
    if (isAuthenticated) {
      fetchRecommendedEvents();
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

  // Önerilen etkinlikleri yükle
  const fetchRecommendedEvents = async () => {
    if (!isAuthenticated) return;

    setLoadingRecommended(true);
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
      const response = await getRecommendedEvents(1, 4, userCity);
      if (response.success) {
        setRecommendedEvents(response.data);
        
        // İl bazlı filtreleme yapılmış mı kontrol et
        if (response.message && response.message.includes('ilinizdeki')) {
          console.log(`[HomePage] Etkinlikler il bazlı filtrelendi: ${response.message}`);
        }
      }
    } catch (error) {
      console.error('Önerilen etkinlikleri yüklerken hata:', error);
    } finally {
      setLoadingRecommended(false);
    }
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
      // Eğer kullanıcı giriş yapmışsa, önerilen etkinlikleri de yenile
      if (isAuthenticated) {
        fetchRecommendedEvents();
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

  // Etkinlik görsel URL'si formatla
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
      
      console.log(`[getEventImage] Event: "${event.title}", Category: "${category || 'Belirsiz'}"`);
      
      // Kategori bazlı anahtar kelimeler ve görsel URL'leri
      const categoryKeywords = {
        // SPOR KATEGORİSİ
        'Spor': {
          // Futbol
          'futbol': 'https://images.unsplash.com/photo-1560272564-c83b665fa177?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'soccer': 'https://images.unsplash.com/photo-1560272564-c83b665fa177?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'football': 'https://images.unsplash.com/photo-1560272564-c83b665fa177?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          // Basketbol
          'basketbol': 'https://images.unsplash.com/photo-1518650868956-c1098117c4ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'basketball': 'https://images.unsplash.com/photo-1518650868956-c1098117c4ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'basket': 'https://images.unsplash.com/photo-1518650868956-c1098117c4ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          // Tenis
          'tenis': 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'tennis': 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          // Diğer sporlar
          'voleybol': 'https://images.unsplash.com/photo-1592656094261-c49cafc9a48f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'volleyball': 'https://images.unsplash.com/photo-1592656094261-c49cafc9a48f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'yüzme': 'https://images.unsplash.com/photo-1560089000-7433a4ebbd64?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'swimming': 'https://images.unsplash.com/photo-1560089000-7433a4ebbd64?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'havuz': 'https://images.unsplash.com/photo-1560089000-7433a4ebbd64?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'koşu': 'https://images.unsplash.com/photo-1487956382158-bb926046304a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'running': 'https://images.unsplash.com/photo-1487956382158-bb926046304a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'bisiklet': 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'cycling': 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'bicycle': 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'golf': 'https://images.unsplash.com/photo-1535131749006-b7d58e929eac?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'yoga': 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'boks': 'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'boxing': 'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
        },
        
        // MÜZİK KATEGORİSİ
        'Müzik': {
          'gitar': 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'guitar': 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'piyano': 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'piano': 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'keman': 'https://images.unsplash.com/photo-1612225330812-01a9c6b355ec?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'violin': 'https://images.unsplash.com/photo-1612225330812-01a9c6b355ec?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'davul': 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'drums': 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'konser': 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'concert': 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'dj': 'https://images.unsplash.com/photo-1571266028027-a8bbe87a692d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'rock': 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'caz': 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'jazz': 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'klasik müzik': 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'classical music': 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
        },
        
        // SANAT KATEGORİSİ
        'Sanat': {
          'resim': 'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'painting': 'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'heykel': 'https://images.unsplash.com/photo-1544413164-5f1b295eb435?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'sculpture': 'https://images.unsplash.com/photo-1544413164-5f1b295eb435?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'fotoğraf': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'photography': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'ebru': 'https://images.unsplash.com/photo-1558522195-e1201b090344?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'marbling': 'https://images.unsplash.com/photo-1558522195-e1201b090344?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'çizim': 'https://images.unsplash.com/photo-1602472097151-72eeec7a3185?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'drawing': 'https://images.unsplash.com/photo-1602472097151-72eeec7a3185?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'sergi': 'https://images.unsplash.com/photo-1563349441-5ccf8952dca2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'exhibition': 'https://images.unsplash.com/photo-1563349441-5ccf8952dca2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
        },
        
        // DANS KATEGORİSİ
        'Dans': {
          'bale': 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'ballet': 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'salsa': 'https://images.unsplash.com/photo-1504609813442-a9c278baf893?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'tango': 'https://images.unsplash.com/photo-1516666248405-9737546ccea8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'hip hop': 'https://images.unsplash.com/photo-1535525153412-5a42439a210d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'halk dansları': 'https://images.unsplash.com/photo-1563841930606-67e2bce48b78?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'folk dance': 'https://images.unsplash.com/photo-1563841930606-67e2bce48b78?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'modern dans': 'https://images.unsplash.com/photo-1547153760-18fc86324498?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'modern dance': 'https://images.unsplash.com/photo-1547153760-18fc86324498?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
        },
        
        // YEMEK KATEGORİSİ
        'Yemek': {
          'pasta': 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'cake': 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'kahve': 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'coffee': 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'barbekü': 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'barbecue': 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'bbq': 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'sushi': 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'türk mutfağı': 'https://images.unsplash.com/photo-1600803907087-f56d462fd26b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'turkish cuisine': 'https://images.unsplash.com/photo-1600803907087-f56d462fd26b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'italyan': 'https://images.unsplash.com/photo-1498579150354-977475b7ea0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'italian': 'https://images.unsplash.com/photo-1498579150354-977475b7ea0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'vegan': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
        },
        
        // SEYAHAT KATEGORİSİ
        'Seyahat': {
          'istanbul': 'https://images.unsplash.com/photo-1527838832700-5059252407fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'kapadokya': 'https://images.unsplash.com/photo-1570856033163-05f258ec9481?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'cappadocia': 'https://images.unsplash.com/photo-1570856033163-05f258ec9481?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'antalya': 'https://images.unsplash.com/photo-1582782895059-a15955184946?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'bodrum': 'https://images.unsplash.com/photo-1570693124260-2d4cff77d8a1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'paris': 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'londra': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'roma': 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'rome': 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'kamp': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'camping': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
        },
        
        // TEKNOLOJİ KATEGORİSİ
        'Teknoloji': {
          'yazılım': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'software': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'kod': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'code': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'yapay zeka': 'https://images.unsplash.com/photo-1507146153580-69a1fe6d8aa1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'artificial intelligence': 'https://images.unsplash.com/photo-1507146153580-69a1fe6d8aa1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'ai': 'https://images.unsplash.com/photo-1507146153580-69a1fe6d8aa1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'robotik': 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'robotics': 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'robot': 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'blockchain': 'https://images.unsplash.com/photo-1559445368-b8a993c2b202?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'bitcoin': 'https://images.unsplash.com/photo-1559445368-b8a993c2b202?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'siber güvenlik': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'cyber security': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
        },
        
        // DOĞA KATEGORİSİ
        'Doğa': {
          'dağ': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'mountain': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'göl': 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'lake': 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'deniz': 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'sea': 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'orman': 'https://images.unsplash.com/photo-1448375240586-882707db888b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'forest': 'https://images.unsplash.com/photo-1448375240586-882707db888b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'şelale': 'https://images.unsplash.com/photo-1431057572259-f3ba5f89c4d6?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'waterfall': 'https://images.unsplash.com/photo-1431057572259-f3ba5f89c4d6?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'mağara': 'https://images.unsplash.com/photo-1504877412559-d17511fcbe12?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'cave': 'https://images.unsplash.com/photo-1504877412559-d17511fcbe12?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
        },
        
        // EĞİTİM KATEGORİSİ
        'Eğitim': {
          'seminer': 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'seminar': 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'konferans': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'conference': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'atölye': 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'workshop': 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'dil': 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'language': 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'kitap': 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'book': 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          
          'bilim': 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          'science': 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
        }
      };
      
      // Kategori bazlı varsayılan görseller - Daha güvenilir ve yüksek kaliteli URL'ler
      const categoryImages = {
        'Müzik': 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'Spor': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'Sanat': 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'Dans': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'Yemek': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'Seyahat': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'Teknoloji': 'https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'Doğa': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'Eğitim': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'Diğer': 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
      };
      
      // Kategori bulunamadıysa varsayılan görsel döndür
      if (!category) {
        console.log(`[getEventImage] Kategori bulunamadı: "${event.title}" için varsayılan görsel kullanılıyor`);
        return categoryImages['Diğer'];
      }
      
      // Kategori alt türleri için anahtar kelimeler varsa kontrol et
      if (categoryKeywords[category]) {
        const keywords = categoryKeywords[category];
        
        // Anahtar kelimeleri ara
        for (const [keyword, imageUrl] of Object.entries(keywords)) {
          if (allContent.includes(keyword)) {
            console.log(`[getEventImage] Eşleşme: "${keyword}" anahtar kelimesi "${event.title}" etkinliğinde bulundu`);
            return imageUrl;
          }
        }
      }
      
      // Alt kategori belirlenemezse ana kategori görseli kullan
      console.log(`[getEventImage] Alt kategori eşleşmedi: "${event.title}" - genel kategori görseli kullanılıyor`);
      return categoryImages[category] || categoryImages['Diğer'];
    } catch (error) {
      console.error(`[getEventImage] Hata: "${event.title}" için görsel belirlenirken hata oluştu:`, error);
      // Hata durumunda varsayılan olarak genel etkinlik görseli döndür
      return 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60';
    }
  };

  // Sayfa değişikliği
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    window.scrollTo(0, 0); // Sayfa değiştiğinde en üste git
  };

  // Size Özel Etkinlikler Bölümü - Render edilirken güncelleyelim
  const renderRecommendedEvents = () => {
    if (!isAuthenticated) {
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          Hobilerinize uygun etkinlikleri görmek için <Button 
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
        </Box>
      );
    }

    if (errorRecommended) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorRecommended}
        </Alert>
      );
    }

    if (recommendedEvents.length === 0) {
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          Hobilerinize uygun etkinlik bulunamadı. Farklı hobiler ekleyebilir veya yeni etkinlikler oluşturabilirsiniz.
        </Alert>
      );
    }

    // Kullanıcının hobi ve konum bilgilerine göre eşleşmeleri göster
    const userHobbies = user?.hobbies?.map(h => typeof h === 'object' ? h.name : h) || [];
    const userLocation = user?.location?.address || '';
    const userProvince = userLocation ? userLocation.split(',')[0]?.trim() : '';

    return (
      <>
        {userHobbies.length > 0 || userProvince ? (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {userHobbies.length > 0 && userProvince ? (
                <>Listelenen etkinlikler <b>{userHobbies.join(', ')}</b> hobileriniz ve <b>{userProvince}</b> konumunuz ile eşleşmektedir.</>
              ) : userHobbies.length > 0 ? (
                <>Listelenen etkinlikler <b>{userHobbies.join(', ')}</b> hobileriniz ile eşleşmektedir.</>
              ) : (
                <>Listelenen etkinlikler <b>{userProvince}</b> konumunuz ile eşleşmektedir.</>
              )}
            </Typography>
          </Box>
        ) : null}

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
              />
            </Grid>
          ))}
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

      {/* Arama Kutusu */}
      <SearchBox>
        <StyledInputBase
          placeholder="Etkinlik ara..."
          inputProps={{ 'aria-label': 'search' }}
        />
        <IconButton sx={{ p: 2, position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}>
          <SearchIcon />
        </IconButton>
      </SearchBox>

      {/* Etkinlik Sekmeleri */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<Whatshot />} iconPosition="start" label="Tüm Etkinlikler" />
          <Tab icon={<Event />} iconPosition="start" label="Size Özel" disabled={!isAuthenticated} />
          <Tab icon={<LocationOn />} iconPosition="start" label="Yakınımdakiler" />
          <Tab icon={<People />} iconPosition="start" label="Arkadaşlarımın Etkinlikleri" disabled={!isAuthenticated} />
        </Tabs>
      </Box>

      {/* Size Özel Etkinlikler Bölümü */}
      <Box sx={{ mb: 5 }}>
        <Paper sx={{ p: 3, borderRadius: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Whatshot sx={{ mr: 1, color: 'error.main' }} />
            <Typography variant="h5" component="h2" fontWeight="bold">
              Size Özel Etkinlikler
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {isAuthenticated 
              ? 'Hobi ve ilgi alanlarınıza göre, bulunduğunuz ildeki etkinlikler burada listelenir.' 
              : 'Giriş yaparak hobilerinize ve bulunduğunuz ile göre etkinlikleri görebilirsiniz.'}
          </Typography>
          
          <Divider sx={{ mb: 3 }} />
          
          {!isAuthenticated && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Hobilerinize uygun etkinlikleri görmek için <Button 
                variant="outlined" 
                size="small" 
                color="primary"
                sx={{ ml: 1 }}
                onClick={() => navigate('/login')}
              >
                Giriş Yapın
              </Button>
            </Alert>
          )}
          
          {isAuthenticated && renderRecommendedEvents()}
          
          {isAuthenticated && recommendedEvents.length > 0 && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
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
                <Tab icon={<People />} label="Arkadaşlarım" />
              </Tabs>
            </Paper>
            
            <CategoryFilter 
              selectedCategory={selectedCategory} 
              onSelectCategory={(category) => {
                setSelectedCategory(category);
                setCurrentPage(1); // Kategori değiştiğinde ilk sayfaya dön
              }} 
            />
            
            <Typography variant="h5" component="h2" fontWeight="bold" sx={{ mt: 3, mb: 2 }}>
              {selectedCategory === 'Tümü' ? 'Tüm  Etkinlikler' : `${selectedCategory} Etkinlikleri`}
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Paper sx={{ p: 3, textAlign: 'center', color: 'error.main' }}>
                {error}
              </Paper>
            ) : (
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
            )}
            
            {!loading && !error && filteredEvents.length === 0 && (
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
            )}
          </Box>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Category sx={{ mr: 1 }} color="primary" />
              <Typography variant="h6" component="h3" fontWeight="bold">
                İlgi Alanlarınız
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {['Müzik', 'Seyahat', 'Doğa', 'Spor', 'Yemek'].map(interest => (
                <Button
                  key={interest}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    borderRadius: 4,
                    px: 1.5
                  }}
                >
                  {interest}
                </Button>
              ))}
              <Button
                size="small"
                variant="text"
                color="primary"
                sx={{ borderRadius: 4 }}
              >
                + Düzenle
              </Button>
            </Box>
          </Paper>
          
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Event sx={{ mr: 1 }} color="primary" />
              <Typography variant="h6" component="h3" fontWeight="bold">
                Yaklaşan Etkinlikleriniz
              </Typography>
            </Box>
            <UpcomingEvents events={mockEvents.slice(0, 2)} />
            <Button
              variant="text"
              color="primary"
              fullWidth
              sx={{ mt: 1 }}
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