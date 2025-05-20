import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Divider, 
  Button, 
  Avatar, 
  Chip, 
  CircularProgress, 
  Alert,
  IconButton,
  CardMedia,
  Stack
} from '@mui/material';
import { 
  AccessTime, 
  LocationOn, 
  PeopleAlt, 
  ArrowBack, 
  Share, 
  Bookmark, 
  MonetizationOn, 
  Category 
} from '@mui/icons-material';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import Navbar from '../components/Layout/Navbar';
import { getEventById, joinEvent, leaveEvent } from '../services/eventService';
import { useAuth } from '../context/AuthContext';

// Convert category to color
const getCategoryColor = (category) => {
  const colors = {
    'Spor': '#4caf50',
    'Sanat': '#f44336',
    'Müzik': '#9c27b0',
    'Dans': '#ff9800',
    'Yemek': '#795548',
    'Seyahat': '#2196f3',
    'Eğitim': '#607d8b',
    'Teknoloji': '#00bcd4',
    'Doğa': '#8bc34a',
    'Diğer': '#9e9e9e'
  };
  
  return colors[category] || '#9e9e9e';
};

const EventDetailsPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  
  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);
  
  const fetchEventDetails = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log(`Fetching event details for ID: ${eventId}`);
      const response = await getEventById(eventId);
      
      if (response.success && response.data) {
        console.log('Event details loaded:', response.data);
        setEvent(response.data);
        
        // Check if current user is a participant
        if (user && response.data.participants) {
          const participating = response.data.participants.some(
            p => p._id === user._id || p.id === user._id || p === user._id
          );
          setIsParticipant(participating);
        }
      } else {
        setError(response.message || 'Etkinlik bilgileri yüklenemedi');
      }
    } catch (err) {
      console.error('Error loading event details:', err);
      setError('Etkinlik bilgileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  
  const handleJoinEvent = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { message: 'Etkinliğe katılmak için önce giriş yapmalısınız' }});
      return;
    }
    
    setJoining(true);
    
    try {
      const response = isParticipant 
        ? await leaveEvent(eventId) 
        : await joinEvent(eventId);
        
      if (response.success) {
        // Update local state
        setIsParticipant(!isParticipant);
        // Reload event details to get updated participants list
        fetchEventDetails();
      } else {
        setError(response.message || 'İşlem gerçekleştirilemedi');
      }
    } catch (err) {
      console.error('Error joining/leaving event:', err);
      setError('İşlem gerçekleştirilirken bir hata oluştu');
    } finally {
      setJoining(false);
    }
  };
  
  // Helper functions to format data
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'PPP', { locale: tr });
    } catch {
      return 'Tarih belirsiz';
    }
  };
  
  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'HH:mm', { locale: tr });
    } catch {
      return '--:--';
    }
  };
  
  const getLocationString = () => {
    if (!event) return 'Konum belirsiz';
    
    if (event.location) {
      if (typeof event.location === 'string') {
        return event.location;
      }
      if (typeof event.location === 'object' && event.location.address) {
        return event.location.address;
      }
    }
    
    return event.address || 'Konum belirtilmemiş';
  };
  
  const getEventCategory = () => {
    if (!event) return 'Diğer';
    
    if (event.hobby && typeof event.hobby === 'object') {
      return event.hobby.category;
    }
    
    return event.category || 'Diğer';
  };
  
  const getParticipantCount = () => {
    if (!event) return 0;
    
    if (event.participants && Array.isArray(event.participants)) {
      return event.participants.length;
    }
    
    return event.attendees || 0;
  };
  
  const getMaxParticipants = () => {
    if (!event) return 0;
    
    return event.maxParticipants || event.maxAttendees || 'Sınırsız';
  };
  
  const getEventImage = () => {
    if (!event) return 'https://via.placeholder.com/800x400?text=Etkinlik+Resmi';
    
    return event.image || 'https://via.placeholder.com/800x400?text=Etkinlik+Resmi';
  };
  
  const getOrganizerName = () => {
    if (!event) return 'Bilinmeyen';
    
    if (event.organizer) {
      if (typeof event.organizer === 'object') {
        return event.organizer.fullName || event.organizer.username || 'İsimsiz Organizatör';
      }
      return event.organizer;
    }
    
    return 'Bilinmeyen';
  };
  
  // UI Rendering
  if (loading) {
    return (
      <>
        <Navbar />
        <Container maxWidth="md" sx={{ mt: 10, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }
  
  if (error) {
    return (
      <>
        <Navbar />
        <Container maxWidth="md" sx={{ mt: 10, mb: 4 }}>
          <Alert severity="error" sx={{ mt: 4 }}>
            {error}
            <Button 
              onClick={() => navigate(-1)} 
              color="inherit" 
              size="small" 
              sx={{ ml: 2 }}
            >
              Geri Dön
            </Button>
          </Alert>
        </Container>
      </>
    );
  }
  
  if (!event) {
    return (
      <>
        <Navbar />
        <Container maxWidth="md" sx={{ mt: 10, mb: 4 }}>
          <Alert severity="warning" sx={{ mt: 4 }}>
            Etkinlik bulunamadı
            <Button 
              onClick={() => navigate(-1)} 
              color="inherit" 
              size="small" 
              sx={{ ml: 2 }}
            >
              Geri Dön
            </Button>
          </Alert>
        </Container>
      </>
    );
  }
  
  return (
    <>
      <Navbar />
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pt: 8, pb: 4 }}>
        <Container maxWidth="md">
          {/* Back Button */}
          <Box sx={{ mb: 2 }}>
            <Button 
              startIcon={<ArrowBack />} 
              onClick={() => navigate(-1)}
              sx={{ mb: 2 }}
            >
              Geri
            </Button>
          </Box>
          
          {/* Event Cover Image */}
          <Paper 
            sx={{ 
              borderRadius: 2, 
              overflow: 'hidden',
              mb: 3,
              position: 'relative'
            }}
          >
            <CardMedia
              component="img"
              height="300"
              image={getEventImage()}
              alt={event.title}
              sx={{ objectFit: 'cover' }}
            />
            
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 16, 
                right: 16, 
                display: 'flex', 
                gap: 1 
              }}
            >
              <IconButton sx={{ bgcolor: 'rgba(255,255,255,0.8)' }}>
                <Share />
              </IconButton>
              <IconButton sx={{ bgcolor: 'rgba(255,255,255,0.8)' }}>
                <Bookmark />
              </IconButton>
            </Box>
            
            <Chip
              label={getEventCategory()}
              sx={{
                position: 'absolute',
                top: 16,
                left: 16,
                bgcolor: getCategoryColor(getEventCategory()),
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          </Paper>
          
          <Grid container spacing={3}>
            {/* Event Details */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                  {event.title}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ mr: 2 }}
                    alt={getOrganizerName()}
                    src={event.organizer?.profilePicture}
                  />
                  <Typography variant="subtitle1">
                    Organizatör: <strong>{getOrganizerName()}</strong>
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Stack spacing={2} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTime sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography>
                      {formatDate(event.startDate || event.date)} • {formatTime(event.startDate || event.date)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationOn sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography>
                      {getLocationString()}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PeopleAlt sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography>
                      {getParticipantCount()} katılımcı / {getMaxParticipants()} kapasite
                    </Typography>
                  </Box>
                  
                  {event.price && Number(event.price) > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <MonetizationOn sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography>
                        {event.price} TL
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Category sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography>
                      Kategori: {getEventCategory()}
                    </Typography>
                  </Box>
                </Stack>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Etkinlik Açıklaması
                </Typography>
                
                <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
                  {event.description}
                </Typography>
                
                <Box sx={{ mt: 4 }}>
                  <Button 
                    variant="contained" 
                    color={isParticipant ? "error" : "primary"}
                    size="large" 
                    fullWidth
                    disabled={joining}
                    onClick={handleJoinEvent}
                    sx={{ py: 1.5 }}
                  >
                    {joining ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : isParticipant ? (
                      'Etkinlikten Ayrıl'
                    ) : (
                      'Etkinliğe Katıl'
                    )}
                  </Button>
                </Box>
              </Paper>
            </Grid>
            
            {/* Sidebar */}
            <Grid item xs={12} md={4}>
              {/* Organizer Info */}
              <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Organizatör Hakkında
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar 
                    sx={{ width: 64, height: 64, mr: 2 }}
                    alt={getOrganizerName()}
                    src={event.organizer?.profilePicture}
                  />
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {getOrganizerName()}
                    </Typography>
                    {event.organizer?.bio && (
                      <Typography variant="body2" color="text.secondary">
                        {event.organizer.bio}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Paper>
              
              {/* Participants */}
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Katılımcılar ({getParticipantCount()})
                </Typography>
                {event.participants && event.participants.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {event.participants.slice(0, 10).map((participant) => (
                      <Avatar 
                        key={participant._id || participant}
                        alt={participant.username || ''}
                        src={participant.profilePicture || ''}
                        sx={{ width: 40, height: 40 }}
                      />
                    ))}
                    {event.participants.length > 10 && (
                      <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
                        +{event.participants.length - 10}
                      </Avatar>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Henüz katılımcı yok. İlk katılan sen ol!
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
};

export default EventDetailsPage; 