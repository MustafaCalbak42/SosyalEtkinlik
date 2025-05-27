import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Tabs, 
  Tab, 
  List, 
  ListItem, 
  ListItemAvatar, 
  Avatar, 
  ListItemText,
  Divider,
  Button
} from '@mui/material';
import { styled } from '@mui/material/styles';
import EventIcon from '@mui/icons-material/Event';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const ActivityCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[3],
  marginBottom: theme.spacing(3)
}));

const ProfileActivities = ({ events = [], participatedEvents = [], followers = [], following = [], isCurrentUser }) => {
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Etkinlik görsel URL'si formatla - HomePage ile aynı akıllı sistem
  const getEventImage = (event) => {
    try {
      // Önce etkinliğin kendi görselini kontrol et
      if (event.image) {
        return event.image;
      }
      
      // Etkinliğin kategorisini al
      const getEventCategory = () => {
        if (event.hobby && typeof event.hobby === 'object') {
          return event.hobby.category;
        }
        return event.category || 'Diğer';
      };
      
      const category = getEventCategory();
      
      // Etkinlik başlığı ve açıklamasını küçük harfe çevir
      const title = (event.title || '').toLowerCase();
      const description = (event.description || '').toLowerCase();
      const tags = Array.isArray(event.tags) ? event.tags.map(tag => tag.toLowerCase()) : [];
      const hobbyName = event.hobby && typeof event.hobby === 'object' ? (event.hobby.name || '').toLowerCase() : '';
      
      // Tüm içeriği birleştirerek daha güçlü bir arama yap
      const allContent = `${title} ${description} ${tags.join(' ')} ${hobbyName}`;
      
      // Kategori bazlı anahtar kelimeler ve görsel URL'leri
      const categoryKeywords = {
        'Spor': {
          'futbol': 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'basketbol': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'tenis': 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'yüzme': 'https://images.unsplash.com/photo-1530549387789-4c1017266635?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'koşu': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'bisiklet': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'yoga': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60'
        },
        'Müzik': {
          'gitar': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'piyano': 'https://images.unsplash.com/photo-1552422535-c45813c61732?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'konser': 'https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60'
        },
        'Sanat': {
          'resim': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'fotoğraf': 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60'
        },
        'Yemek': {
          'kahve': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'pizza': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60'
        },
        'Teknoloji': {
          'yazılım': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          'kod': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60'
        }
      };
      
      // Kategori bazlı varsayılan görseller
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
      console.error(`[ProfileActivities] Hata: "${event.title}" için görsel belirlenirken hata oluştu:`, error);
      // Hata durumunda varsayılan olarak genel etkinlik görseli döndür
      return 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60';
    }
  };

  const renderEvents = (eventList, isParticipant = false) => {
    if (!eventList || eventList.length === 0) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {isParticipant ? 'Henüz katılınan etkinlik bulunmuyor.' : 'Henüz düzenlenen etkinlik bulunmuyor.'}
          </Typography>
        </Box>
      );
    }

    return (
      <List>
        {eventList.map((event, index) => {
          // Etkinlik tarihini belirle (farklı alan adları olabilir)
          const eventDate = event.startDate || event.date;
          
          // Konum bilgisini formatla
          const getLocationText = (location) => {
            if (!location) return 'Konum belirtilmemiş';
            
            if (typeof location === 'string') {
              return location;
            }
            
            if (typeof location === 'object') {
              return location.address || location.city || 'Konum belirtilmemiş';
            }
            
            return 'Konum belirtilmemiş';
          };

          return (
          <React.Fragment key={event._id || index}>
              <ListItem 
                alignItems="flex-start" 
                component={Link} 
                to={`/events/${event._id}`} 
                sx={{ 
                  textDecoration: 'none', 
                  color: 'inherit',
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  },
                  borderRadius: 1,
                  mb: 0.5
                }}
              >
              <ListItemAvatar>
                <Avatar 
                  sx={{ 
                    width: 56, 
                    height: 56, 
                    bgcolor: 'primary.main',
                    '& img': {
                      objectFit: 'cover'
                    }
                  }}
                  src={getEventImage(event)}
                  onError={(e) => {
                    console.error(`[ProfileActivities] Görsel yüklenemedi: ${getEventImage(event)}`, e);
                    // Hata durumunda EventIcon göster
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                >
                  <EventIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                  primary={
                    <Typography variant="subtitle1" fontWeight="medium">
                      {event.title || 'Başlıksız Etkinlik'}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography component="span" variant="body2" color="text.primary">
                        📍 {getLocationText(event.location)}
                      </Typography>
                      <br />
                      <Typography component="span" variant="body2" color="text.secondary">
                        📅 {eventDate ? format(new Date(eventDate), 'PPP', { locale: tr }) : 'Tarih belirtilmemiş'}
                      </Typography>
                      {event.startTime && (
                        <>
                          <br />
                          <Typography component="span" variant="body2" color="text.secondary">
                            🕐 {event.startTime}
                          </Typography>
                        </>
                      )}
                      {event.participantCount !== undefined && (
                        <>
                          <br />
                          <Typography component="span" variant="body2" color="success.main">
                            👥 {event.participantCount} katılımcı
                          </Typography>
                        </>
                      )}
                    </Box>
                }
              />
            </ListItem>
            {index < eventList.length - 1 && <Divider variant="inset" component="li" />}
          </React.Fragment>
          );
        })}
      </List>
    );
  };

  const renderUsers = (userList, title) => {
    if (!userList || userList.length === 0) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {title === 'Takipçiler' ? 'Henüz takipçi bulunmuyor.' : 'Henüz takip edilen kullanıcı bulunmuyor.'}
          </Typography>
        </Box>
      );
    }

    return (
      <List>
        {userList.map((user, index) => (
          <React.Fragment key={user._id || index}>
            <ListItem alignItems="flex-start" component={Link} to={`/profile/${user.username}`} sx={{ textDecoration: 'none', color: 'inherit' }}>
              <ListItemAvatar>
                <Avatar src={user.profilePicture || "/assets/default-profile.png"} alt={user.fullName} />
              </ListItemAvatar>
              <ListItemText
                primary={user.fullName}
                secondary={`@${user.username}`}
              />
            </ListItem>
            {index < userList.length - 1 && <Divider variant="inset" component="li" />}
          </React.Fragment>
        ))}
      </List>
    );
  };

  return (
    <ActivityCard>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Oluşturulan Etkinlikler" />
          <Tab label="Katıldığı Etkinlikler" />
        </Tabs>
      </Box>
      
      <CardContent>
        {tabValue === 0 && (
          <>
            {renderEvents(events, false)}
            {isCurrentUser && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<EventIcon />}
                  component={Link}
                  to="/create-event"
                >
                  Yeni Etkinlik Oluştur
                </Button>
              </Box>
            )}
          </>
        )}
        
        {tabValue === 1 && renderEvents(participatedEvents, true)}
      </CardContent>
    </ActivityCard>
  );
};

export default ProfileActivities; 