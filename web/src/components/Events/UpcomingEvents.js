import React from 'react';
import { 
  Box, 
  Typography, 
  Divider, 
  Avatar,
  CircularProgress,
  Alert,
  Button,
  Chip
} from '@mui/material';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { AccessTime, LocationOn, Person, Event as EventIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const UpcomingEvents = ({ events = [], loading = false, error = '', onRetry }) => {
  const navigate = useNavigate();

  // Yükleme durumu
  if (loading) {
    return (
      <Box sx={{ py: 2, textAlign: 'center' }}>
        <CircularProgress size={24} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Yaklaşan etkinlikler yükleniyor...
        </Typography>
      </Box>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <Box sx={{ py: 2 }}>
        <Alert severity="error" sx={{ mb: 1 }}>
          {error}
        </Alert>
        {onRetry && (
          <Button 
            variant="outlined" 
            size="small" 
            onClick={onRetry}
            fullWidth
          >
            Tekrar Dene
          </Button>
        )}
      </Box>
    );
  }

  // Etkinlik yoksa
  if (events.length === 0) {
    return (
      <Box sx={{ py: 2, textAlign: 'center' }}>
        <EventIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Önümüzdeki 2 gün içinde etkinliğiniz bulunmuyor.
        </Typography>
      </Box>
    );
  }

  // Kalan süreyi formatla
  const formatTimeUntil = (timeUntilStart) => {
    if (!timeUntilStart) return '';
    
    const { hours, minutes } = timeUntilStart;
    
    if (hours < 1) {
      return `${minutes} dakika sonra`;
    } else if (hours < 24) {
      return `${hours} saat ${minutes} dakika sonra`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days} gün ${remainingHours} saat sonra`;
    }
  };

  // Rol rengini belirle
  const getRoleColor = (userRole) => {
    switch (userRole) {
      case 'organizer':
        return 'primary';
      case 'participant':
        return 'success';
      default:
        return 'default';
    }
  };

  // Rol metnini belirle
  const getRoleText = (userRole) => {
    switch (userRole) {
      case 'organizer':
        return 'Organizatör';
      case 'participant':
        return 'Katılımcı';
      default:
        return '';
    }
  };

  // Etkinlik konumunu formatla ve kısalt
  const formatLocation = (location) => {
    let address = '';
    
    if (typeof location === 'string') {
      address = location;
    } else if (typeof location === 'object' && location.address) {
      address = location.address;
    } else {
      return 'Konum belirtilmemiş';
    }
    
    // Uzun adresleri kısalt
    if (address.length > 25) {
      // Virgülle ayrılmış adres parçalarını kontrol et
      const parts = address.split(',');
      if (parts.length > 1) {
        // İlk iki parçayı al (genellikle mahalle ve ilçe)
        const shortAddress = parts.slice(0, 2).join(', ').trim();
        return shortAddress.length > 25 ? shortAddress.substring(0, 22) + '...' : shortAddress;
      } else {
        // Virgül yoksa direkt kısalt
        return address.substring(0, 22) + '...';
      }
    }
    
    return address;
  };

  // Etkinlik detayına git
  const handleEventClick = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  return (
    <Box>
      {events.map((event, index) => {
        const eventDate = new Date(event.startDate || event.date);
        const formattedDate = format(eventDate, 'd MMM', { locale: tr });
        const formattedTime = format(eventDate, 'HH:mm');
        const timeUntilText = formatTimeUntil(event.timeUntilStart);
        
        return (
          <Box key={event._id || event.id}>
            <Box 
              sx={{ 
                display: 'flex', 
                py: 1.5,
                cursor: 'pointer',
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
              onClick={() => handleEventClick(event._id || event.id)}
            >
              <Avatar 
                variant="rounded"
                sx={{ 
                  width: 48, 
                  height: 48, 
                  mr: 1.5,
                  bgcolor: 'primary.main'
                }}
              >
                <EventIcon />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, maxWidth: '100%' }}>
                  <Typography 
                    variant="subtitle2" 
                    fontWeight="bold" 
                    sx={{ 
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      minWidth: 0
                    }}
                    title={event.title}
                  >
                    {event.title}
                  </Typography>
                  {event.userRole && (
                    <Chip 
                      label={getRoleText(event.userRole)}
                      size="small"
                      color={getRoleColor(event.userRole)}
                      variant="outlined"
                      sx={{ ml: 1, fontSize: '0.7rem', height: 20, flexShrink: 0 }}
                    />
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <AccessTime fontSize="small" color="action" sx={{ fontSize: 14, mr: 0.5 }} />
                  <Typography variant="caption" color="text.secondary">
                    {formattedDate} • {formattedTime}
                  </Typography>
                </Box>
                
                {timeUntilText && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Typography variant="caption" color="primary.main" fontWeight="medium">
                      {timeUntilText}
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, maxWidth: '100%' }}>
                  <LocationOn fontSize="small" color="action" sx={{ fontSize: 14, mr: 0.5, flexShrink: 0 }} />
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '100%'
                    }}
                    title={typeof event.location === 'string' ? event.location : event.location?.address || 'Konum belirtilmemiş'}
                  >
                    {formatLocation(event.location)}
                  </Typography>
                </Box>
              </Box>
            </Box>
            {index < events.length - 1 && <Divider />}
          </Box>
        );
      })}
    </Box>
  );
};

export default UpcomingEvents; 