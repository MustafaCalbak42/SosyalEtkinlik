import React from 'react';
import { 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Box, 
  Chip, 
  Avatar, 
  IconButton, 
  LinearProgress, 
  Tooltip,
  CardActionArea
} from '@mui/material';
import { 
  LocationOn, 
  AccessTime, 
  PeopleAlt, 
  BookmarkBorder, 
  Bookmark,
  DirectionsWalk
} from '@mui/icons-material';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

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

const EventCard = ({ event }) => {
  const navigate = useNavigate();
  
  const { 
    _id,
    id,
    title, 
    description, 
    image, 
    date, 
    location, 
    attendees, 
    maxAttendees, 
    category,
    distance
  } = event;

  const eventId = _id || id; // Support both _id (MongoDB) and id formats
  
  const eventDate = new Date(date);
  const formattedDate = format(eventDate, 'PPP', { locale: tr });
  const formattedTime = format(eventDate, 'HH:mm');
  const attendeePercentage = (attendees / maxAttendees) * 100;

  const handleCardClick = () => {
    if (eventId) {
      navigate(`/events/${eventId}`);
    } else {
      console.error('Event ID is missing, cannot navigate to details page');
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 20px rgba(0,0,0,0.1)',
          cursor: 'pointer'
        }
      }}
      onClick={handleCardClick}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="180"
          image={image}
          alt={title}
          onError={(e) => {
            console.error(`[EventCard] Görsel yüklenemedi: ${image}`, e);
            // Hata durumunda varsayılan görsel kullan
            e.target.src = 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60';
          }}
        />
        <Chip
          label={category}
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            backgroundColor: getCategoryColor(category),
            color: 'white',
            fontWeight: 'bold',
          }}
        />
        <IconButton
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'white',
            backgroundColor: 'rgba(0,0,0,0.3)',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.5)',
            },
          }}
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click event
            // Bookmark functionality here
          }}
        >
          <BookmarkBorder />
        </IconButton>
      </Box>
      
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Typography gutterBottom variant="h6" component="div" fontWeight="bold" noWrap>
          {title}
        </Typography>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            mb: 2,
            height: 40
          }}
        >
          {description}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <AccessTime fontSize="small" color="action" sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {formattedDate} • {formattedTime}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <LocationOn fontSize="small" color="action" sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary" noWrap>
            {location}
          </Typography>
        </Box>
        
        {distance && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <DirectionsWalk fontSize="small" color="action" sx={{ mr: 1 }} />
            <Typography variant="body2" color="primary.main" fontWeight="medium">
              {distance}
            </Typography>
          </Box>
        )}
        
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PeopleAlt fontSize="small" color="action" sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {attendees}/{maxAttendees} katılımcı
              </Typography>
            </Box>
            <Typography 
              variant="body2" 
              color={attendeePercentage >= 80 ? 'error.main' : 'text.secondary'}
              fontWeight={attendeePercentage >= 80 ? 'bold' : 'normal'}
            >
              {attendeePercentage >= 80 ? 'Son Kontenjan!' : ''}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={attendeePercentage} 
            color={attendeePercentage >= 80 ? 'error' : 'primary'}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default EventCard; 