import React, { useState, useEffect } from 'react';
import { Box, Container, Grid, Typography, Paper, Button, Tab, Tabs, InputBase, IconButton, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Search as SearchIcon, LocationOn, Event, People, Chat, Category } from '@mui/icons-material';
import Navbar from '../components/Layout/Navbar';
import EventCard from '../components/Events/EventCard';
import CategoryFilter from '../components/Events/CategoryFilter';
import RecommendedUsers from '../components/Users/RecommendedUsers';
import UpcomingEvents from '../components/Events/UpcomingEvents';

// Mock data for events
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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const filteredEvents = selectedCategory === 'Tümü' 
    ? mockEvents 
    : mockEvents.filter(event => event.category === selectedCategory);

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
                onSelectCategory={setSelectedCategory} 
              />
              
              <Typography variant="h5" component="h2" fontWeight="bold" sx={{ mt: 3, mb: 2 }}>
                {selectedCategory === 'Tümü' ? 'Öne Çıkan Etkinlikler' : `${selectedCategory} Etkinlikleri`}
              </Typography>
              
              <Grid container spacing={3}>
                {filteredEvents.map(event => (
                  <Grid item xs={12} sm={6} key={event.id}>
                    <EventCard event={event} />
                  </Grid>
                ))}
              </Grid>
              
              {filteredEvents.length === 0 && (
                <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
                  <Typography>
                    Bu kategoride şu anda etkinlik bulunmuyor.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    sx={{ mt: 2 }}
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
      </Container>
    </>
  );
}

export default HomePage; 