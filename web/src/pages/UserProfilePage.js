import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Stack
} from '@mui/material';
import {
  LocationOn,
  Email,
  Event as EventIcon,
  PersonAdd,
  PersonRemove,
  ArrowBack
} from '@mui/icons-material';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import Navbar from '../components/Layout/Navbar';
import ProfileActivities from '../components/Profile/ProfileActivities';
import { getUserById, followUser, unfollowUser } from '../services/userService';
import { useAuth } from '../context/AuthContext';

const UserProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [following, setFollowing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  useEffect(() => {
    fetchUserProfile();
  }, [userId]);
  
  const fetchUserProfile = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await getUserById(userId);
      
      if (response.success && response.data) {
        setUser(response.data);
        
        // Check if current user is following this user
        if (isAuthenticated && currentUser && response.data.followers) {
          const isFollowing = response.data.followers.includes(currentUser._id);
          setFollowing(isFollowing);
        }
      } else {
        setError(response.message || 'Kullanıcı bilgileri yüklenemedi');
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
      setError('Kullanıcı bilgileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { message: 'Kullanıcıyı takip etmek için önce giriş yapmalısınız' }});
      return;
    }
    
    setActionLoading(true);
    
    try {
      const response = following
        ? await unfollowUser(userId)
        : await followUser(userId);
      
      if (response.success) {
        setFollowing(!following);
        fetchUserProfile(); // Refresh user data
      } else {
        console.error('Follow/unfollow error:', response.message);
      }
    } catch (err) {
      console.error('Error following/unfollowing user:', err);
    } finally {
      setActionLoading(false);
    }
  };
  
  // Function to get user initials for avatar
  const getInitials = (name) => {
    if (!name) return '?';
    
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };
  
  // Format date helper
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMMM yyyy', { locale: tr });
    } catch (err) {
      return 'Belirtilmemiş';
    }
  };
  
  if (loading) {
    return (
      <>
        <Navbar />
        <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
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
        <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
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
  
  if (!user) {
    return (
      <>
        <Navbar />
        <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
          <Alert severity="warning" sx={{ mt: 4 }}>
            Kullanıcı bulunamadı
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
        <Container maxWidth="lg">
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
          
          <Grid container spacing={3}>
            {/* Profile Sidebar */}
            <Grid item xs={12} md={4}>
              <Paper 
                sx={{ 
                  p: 3, 
                  borderRadius: 2, 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative'
                }}
              >
                <Avatar
                  src={user.profilePicture}
                  alt={user.fullName || user.username}
                  sx={{ 
                    width: 150, 
                    height: 150, 
                    mb: 2,
                    bgcolor: 'primary.main'
                  }}
                >
                  {!user.profilePicture && getInitials(user.fullName || user.username)}
                </Avatar>
                
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {user.fullName || 'İsimsiz Kullanıcı'}
                </Typography>
                
                {user.username && (
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    @{user.username}
                  </Typography>
                )}
                
                {isAuthenticated && currentUser && currentUser._id !== userId && (
                  <Button
                    variant={following ? "outlined" : "contained"}
                    color={following ? "error" : "primary"}
                    startIcon={following ? <PersonRemove /> : <PersonAdd />}
                    onClick={handleFollowToggle}
                    disabled={actionLoading}
                    sx={{ mt: 2, mb: 3 }}
                  >
                    {actionLoading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : following ? (
                      'Takipten Çıkar'
                    ) : (
                      'Takip Et'
                    )}
                  </Button>
                )}
                
                <Divider sx={{ width: '100%', my: 2 }} />
                
                <Stack spacing={2} sx={{ width: '100%' }}>
                  {user.createdAt && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EventIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography>
                        {formatDate(user.createdAt)} tarihinden beri üye
                      </Typography>
                    </Box>
                  )}
                  
                  {user.email && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Email sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography>
                        {user.email}
                      </Typography>
                    </Box>
                  )}
                  
                  {user.location && (typeof user.location === 'object' ? user.location.address : user.location) && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationOn sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography>
                        {typeof user.location === 'object' ? user.location.address : user.location}
                      </Typography>
                    </Box>
                  )}
                </Stack>
                
                <Divider sx={{ width: '100%', my: 2 }} />
                
                <Grid container spacing={2} sx={{ textAlign: 'center' }}>
                  <Grid item xs={12}>
                    <Typography variant="h6" fontWeight="bold">
                      {user.participatedEvents?.length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Katıldığı Etkinlik
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            {/* User Content */}
            <Grid item xs={12} md={8}>
              {/* Bio Section */}
              {user.bio && (
                <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Hakkında
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                    {user.bio}
                  </Typography>
                </Paper>
              )}
              
              {/* Interests and Hobbies */}
              {(user.interests?.length > 0 || user.hobbies?.length > 0) && (
                <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    İlgi Alanları
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {user.hobbies && user.hobbies.map((hobby, index) => (
                      <Chip
                        key={hobby._id || `hobby-${index}`}
                        label={hobby.name || hobby}
                        color="primary"
                        variant="outlined"
                        sx={{ m: 0.5 }}
                      />
                    ))}
                    
                    {user.interests && user.interests.map((interest, index) => (
                      <Chip
                        key={`interest-${index}`}
                        label={interest}
                        color="secondary"
                        variant="outlined"
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Box>
                </Paper>
              )}
              
              {/* User Activities */}
              <ProfileActivities 
                events={user.events || []}
                participatedEvents={user.participatedEvents || []}
                followers={user.followers || []}
                following={user.following || []}
                isCurrentUser={false}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
};

export default UserProfilePage; 