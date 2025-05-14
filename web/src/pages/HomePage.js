import React, { useState, useEffect } from 'react';
import { Box, Container, Grid, Typography, Paper, Button, Tab, Tabs, InputBase, IconButton, CircularProgress, Pagination, Divider, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Search as SearchIcon, LocationOn, Event, People, Category, Whatshot } from '@mui/icons-material';
import Navbar from '../components/Layout/Navbar';
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

  // Önerilen etkinlikleri getir
  const fetchRecommendedEvents = async () => {
    setLoadingRecommended(true);
    setErrorRecommended('');
    
    try {
      console.log(`[HomePage] Fetching recommended events for user`);
      const result = await getRecommendedEvents(1, 4); // İlk sayfa, 4 etkinlik
      
      if (result.success && result.data) {
        console.log('[HomePage] Successfully loaded recommended events:', result.data.length);
        setRecommendedEvents(result.data);
      } else {
        console.error('[HomePage] Failed to load recommended events:', result.message);
        setErrorRecommended('Önerilen etkinlikler yüklenirken bir hata oluştu: ' + result.message);
      }
    } catch (error) {
      console.error('[HomePage] Error loading recommended events:', error);
      setErrorRecommended('Önerilen etkinlikler yüklenirken bir hata oluştu');
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
    if (event.image) {
      return event.image;
    }
    // Burada varsayılan bir resim URL'si döndürebilirsiniz
    return 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60';
  };

  // Sayfa değişikliği
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    window.scrollTo(0, 0); // Sayfa değiştiğinde en üste git
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="lg">
        <HeroSection>
          <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
            Hobinize Uygun Etkinlikleri Keşfedin
          </Typography>
          <Typography variant="h6" component="p" sx={{ maxWidth: 700, mx: 'auto', mb: 4 }}>
            İlgi alanlarınıza göre etkinlik bulun, yeni insanlarla tanışın, organizasyonlar oluşturun.
          </Typography>
          <Button 
            variant="contained" 
            color="secondary"
            size="large"
            onClick={handleCreateEventOpen}
            sx={{ 
              backgroundColor: 'white', 
              color: '#1976d2', 
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.9)',
              }
            }}
          >
            Etkinlik Oluştur
          </Button>
        </HeroSection>

        <SearchBox>
          <StyledInputBase
            placeholder="Etkinlik ara veya ilgi alanı gir..."
            inputProps={{ 'aria-label': 'search' }}
            endAdornment={
              <IconButton type="submit" aria-label="search">
                <SearchIcon />
              </IconButton>
            }
          />
        </SearchBox>

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
            
            {isAuthenticated && loadingRecommended ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : isAuthenticated && errorRecommended ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorRecommended}
              </Alert>
            ) : isAuthenticated && recommendedEvents.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Hobilerinize uygun etkinlik bulunamadı. Farklı hobiler ekleyebilir veya yeni etkinlikler oluşturabilirsiniz.
              </Alert>
            ) : isAuthenticated && (
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
            )}
            
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
      </Container>
    </>
  );
}

export default HomePage; 