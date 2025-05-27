import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardMedia, 
  Grid, 
  Button, 
  Divider, 
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { CalendarMonth, LocationOn, People, Edit, Delete } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { getUserCreatedEvents } from '../../services/userService';
import { deleteEvent } from '../../services/eventService';

const CreatedEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, eventId: null, eventTitle: '' });

  useEffect(() => {
    fetchCreatedEvents();
  }, []);

  const fetchCreatedEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getUserCreatedEvents();
      
      if (response.success) {
        setEvents(response.data || []);
      } else {
        setError(response.message || 'Oluşturulan etkinlikler yüklenemedi');
      }
    } catch (error) {
      console.error('Oluşturulan etkinlikler yüklenirken hata oluştu:', error);
      setError('Etkinlikler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const response = await deleteEvent(eventId);
      
      if (response.success) {
        // Etkinliği listeden kaldır
        setEvents(events.filter(event => event._id !== eventId));
        setActionFeedback({
          type: 'success',
          message: 'Etkinlik başarıyla silindi'
        });
        
        // Dialog'u kapat
        setDeleteDialog({ open: false, eventId: null, eventTitle: '' });
        
        // 3 saniye sonra feedback'i kaldır
        setTimeout(() => {
          setActionFeedback(null);
        }, 3000);
      } else {
        setActionFeedback({
          type: 'error',
          message: response.message || 'Etkinlik silinirken bir hata oluştu'
        });
      }
    } catch (error) {
      console.error('Etkinlik silinirken hata oluştu:', error);
      setActionFeedback({
        type: 'error',
        message: 'Etkinlik silinirken bir hata oluştu. Lütfen tekrar deneyin.'
      });
    }
  };

  const openDeleteDialog = (eventId, eventTitle) => {
    setDeleteDialog({ open: true, eventId, eventTitle });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ open: false, eventId: null, eventTitle: '' });
  };

  const formatDate = (dateString) => {
    const options = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
  };

  const getEventStatus = (event) => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    if (now < startDate) {
      return { status: 'upcoming', label: 'Yaklaşan', color: 'primary' };
    } else if (now >= startDate && now <= endDate) {
      return { status: 'ongoing', label: 'Devam Ediyor', color: 'success' };
    } else {
      return { status: 'completed', label: 'Tamamlandı', color: 'default' };
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Oluşturduğum Etkinlikler
        </Typography>
        
        {actionFeedback && (
          <Alert 
            severity={actionFeedback.type} 
            sx={{ mb: 2 }}
            onClose={() => setActionFeedback(null)}
          >
            {actionFeedback.message}
          </Alert>
        )}
        
        {error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : events.length > 0 ? (
          <Grid container spacing={2}>
            {events.map((event) => {
              const eventStatus = getEventStatus(event);
              return (
                <Grid item xs={12} key={event._id}>
                  <Card sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    mb: 2, 
                    borderRadius: 2, 
                    overflow: 'hidden',
                    boxShadow: 1
                  }}>
                    <CardMedia
                      component="img"
                      sx={{ 
                        width: { xs: '100%', sm: 150 }, 
                        height: { xs: 140, sm: '100%' },
                        objectFit: 'cover' 
                      }}
                      image={event.images && event.images.length > 0 
                        ? `http://localhost:5000/${event.images[0]}`
                        : 'http://localhost:5000/uploads/events/default-event.jpg'}
                      alt={event.title}
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      <CardContent sx={{ flex: '1 0 auto' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography component="div" variant="h6">
                            {event.title}
                          </Typography>
                          <Chip 
                            label={eventStatus.label} 
                            size="small" 
                            color={eventStatus.color}
                            variant="outlined"
                          />
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Chip 
                            label={event.hobby?.name || 'Genel'} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            {event.hobby?.category || ''}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <CalendarMonth fontSize="small" color="action" sx={{ mr: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(event.startDate)}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LocationOn fontSize="small" color="action" sx={{ mr: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            {event.location?.address || 'Konum belirtilmemiş'}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <People fontSize="small" color="action" sx={{ mr: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            {event.currentParticipants || event.participants?.length || 0} / {event.maxParticipants} Katılımcı
                          </Typography>
                        </Box>
                      </CardContent>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', p: 2, pt: 0 }}>
                        <Button 
                          component={Link} 
                          to={`/events/${event._id}`}
                          size="small" 
                          variant="outlined"
                        >
                          Detaylar
                        </Button>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="primary"
                          sx={{ ml: 1 }}
                          startIcon={<Edit />}
                          disabled={eventStatus.status === 'completed'}
                        >
                          Düzenle
                        </Button>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="error"
                          sx={{ ml: 1 }}
                          startIcon={<Delete />}
                          onClick={() => openDeleteDialog(event._id, event.title)}
                        >
                          Sil
                        </Button>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Henüz hiç etkinlik oluşturmadınız.
            </Typography>
            <Button 
              component={Link} 
              to="/create-event" 
              variant="contained" 
              sx={{ mt: 2 }}
            >
              İlk Etkinliğinizi Oluşturun
            </Button>
          </Box>
        )}
      </CardContent>
      
      {/* Silme Onay Dialog'u */}
      <Dialog
        open={deleteDialog.open}
        onClose={closeDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Etkinliği Sil
        </DialogTitle>
        <DialogContent>
          <Typography>
            "{deleteDialog.eventTitle}" etkinliğini silmek istediğinizden emin misiniz? 
            Bu işlem geri alınamaz ve etkinliğe katılan tüm kullanıcılar bilgilendirilecektir.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} color="primary">
            İptal
          </Button>
          <Button 
            onClick={() => handleDeleteEvent(deleteDialog.eventId)} 
            color="error" 
            variant="contained"
          >
            Sil
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default CreatedEvents; 