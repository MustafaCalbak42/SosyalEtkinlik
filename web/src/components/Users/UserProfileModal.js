import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Box, 
  Typography, 
  Avatar, 
  Button, 
  IconButton, 
  Divider, 
  CircularProgress, 
  Alert,
  Chip,
  Badge,
  Tooltip
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Person,
  Info,
  Event as EventIcon,
  Email,
  Favorite,
  Stars
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getUserById } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

const UserProfileModal = ({ open, onClose, userId, participantData }) => {
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [user, setUser] = useState(participantData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useFallback, setUseFallback] = useState(!!participantData);
  
  console.log('UserProfileModal render:', { open, userId, participantData, user, useFallback });

  useEffect(() => {
    console.log('UserProfileModal props received:', { open, userId, participantData });
    
    if (participantData) {
      console.log('Updating participant data state');
      setUser(prevUser => {
        if (prevUser && !useFallback) return prevUser;
        return participantData;
      });
      setUseFallback(true);
    }
    
    if (!open) {
      console.log('Modal closed, resetting state');
      setLoading(false);
      setError('');
      return;
    }
    
    // If we have valid userId and open modal, fetch the full profile
    if (open && userId) {
      console.log(`Modal opened with userId: ${userId}, starting fetch`);
      fetchUserProfile(userId);
    } 
    // If we have participantData but no valid userId, just use the participantData
    else if (open && !userId && participantData) {
      console.log('Modal opened with participantData but no valid userId, using fallback only');
      setUser(participantData);
      setUseFallback(true);
      setLoading(false);
    }
    // If open but no data at all
    else if (open) {
      console.log('Modal opened but no data available');
      setError('Kullanıcı bilgisi bulunamadı');
      setLoading(false);
    }
  }, [open, userId, participantData]);

  const fetchUserProfile = async (id, retryCount = 0) => {
    if (!id) {
      console.error('No user ID provided to modal');
      setError('Kullanıcı ID\'si eksik');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log(`Fetching user profile for ID: ${id} (attempt: ${retryCount + 1})`);
      const response = await getUserById(id);
      
      if (response.success && response.data) {
        console.log('User profile loaded:', response.data);
        setUser(response.data);
        setUseFallback(false);
      } else {
        // If we have participantData, don't show an error, just use that
        if (participantData) {
          console.log('API failed, using available participant data as fallback');
          setUser(participantData);
          setUseFallback(true);
          setLoading(false);
          return;
        }
        
        setError(response.message || 'Kullanıcı bilgileri yüklenemedi');
        console.log('API failed, using fallback participant data if available');
        
        if (retryCount < 2 && !response.success) {
          console.log(`Retrying user profile fetch (${retryCount + 1}/3) in 1.5 seconds`);
          setTimeout(() => {
            fetchUserProfile(id, retryCount + 1);
          }, 1500);
        }
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
      
      // If we have participantData, don't show an error, just use that
      if (participantData) {
        console.log('Request failed, using available participant data as fallback');
        setUser(participantData);
        setUseFallback(true);
        setLoading(false);
        return;
      }
      
      setError('Kullanıcı bilgileri bulunamadı. Kullanıcı silinmiş olabilir.');
      
      if (retryCount < 1) {
        console.log(`Retrying after error (${retryCount + 1}/2) in 2 seconds`);
        setTimeout(() => {
          fetchUserProfile(id, retryCount + 1);
        }, 2000);
      }
    } finally {
      if (retryCount >= 2 || !useFallback) {
        setLoading(false);
      }
    }
  };

  const handleViewFullProfile = () => {
    if (user && user._id) {
      onClose();
      navigate(`/users/${user._id}`);
    }
  };
  
  const handleContactUser = () => {
    if (user && user._id) {
      // Navigate to messaging page or open messaging dialog
      // For now, we'll just close the modal and alert the user
      alert(`İletişim özelliği yakında eklenecek: ${user.username || user.fullName}`);
      onClose();
    }
  };
  
  // Find shared interests between current user and profile user
  const getSharedInterests = () => {
    if (!currentUser || !user) return [];
    
    let sharedHobbies = [];
    
    // Compare hobbies if both users have them
    if (currentUser.hobbies && user.hobbies && 
        Array.isArray(currentUser.hobbies) && Array.isArray(user.hobbies)) {
      
      // Extract hobby IDs for comparison
      const currentUserHobbyIds = currentUser.hobbies.map(h => 
        typeof h === 'object' ? h._id : h
      );
      
      const userHobbyIds = user.hobbies.map(h => 
        typeof h === 'object' ? h._id : h
      );
      
      // Find hobby objects that match
      const matchingHobbies = user.hobbies.filter(hobby => {
        const hobbyId = typeof hobby === 'object' ? hobby._id : hobby;
        return currentUserHobbyIds.includes(hobbyId);
      });
      
      sharedHobbies = matchingHobbies;
    }
    
    return sharedHobbies;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const renderUserContent = () => {
    const displayData = user || {};
    const sharedInterests = getSharedInterests();
    
    return (
      <Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              displayData.isActive ? (
                <Tooltip title="Aktif Kullanıcı">
                  <Stars color="primary" fontSize="small" />
                </Tooltip>
              ) : null
            }
          >
            <Avatar
              sx={{ width: 100, height: 100, mb: 2, bgcolor: 'primary.main' }}
              src={displayData.profilePicture}
              alt={displayData.fullName || displayData.username}
            >
              {!displayData.profilePicture && getInitials(displayData.fullName || displayData.username || '?')}
            </Avatar>
          </Badge>
          
          <Typography variant="h5" component="h2" gutterBottom align="center" fontWeight="bold">
            {displayData.fullName || 'Kullanıcı'}
          </Typography>
          
          {displayData.username && (
            <Typography variant="body1" color="text.secondary" gutterBottom align="center">
              @{displayData.username}
            </Typography>
          )}
          
          {useFallback && (
            <Chip 
              label="Sınırlı Bilgi" 
              color="warning" 
              size="small"
              sx={{ mt: 1 }}
            />
          )}
          
          {sharedInterests.length > 0 && (
            <Chip 
              icon={<Favorite fontSize="small" />}
              label={`${sharedInterests.length} Ortak İlgi Alanı`}
              color="success" 
              size="small"
              sx={{ mt: 1 }}
            />
          )}
        </Box>
        
        {!useFallback && (
          <>
            <Divider sx={{ my: 2 }} />
            
            {displayData.bio && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Info sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="subtitle1" fontWeight="bold">
                    Hakkında
                  </Typography>
                </Box>
                <Typography variant="body1" paragraph>
                  {displayData.bio}
                </Typography>
              </Box>
            )}
            
            <Box sx={{ mb: 3 }}>
              {displayData.location && displayData.location.address && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Person sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body1">
                    Konum: {typeof displayData.location === 'object' ? displayData.location.address : displayData.location}
                  </Typography>
                </Box>
              )}
              
              {displayData.createdAt && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EventIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body1">
                    Katılma Tarihi: {new Date(displayData.createdAt).toLocaleDateString('tr-TR')}
                  </Typography>
                </Box>
              )}
              
              {displayData.participatedEvents && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EventIcon sx={{ mr: 1, color: 'secondary.main' }} />
                  <Typography variant="body1">
                    Katıldığı Etkinlik Sayısı: {displayData.participatedEvents.length || 0}
                  </Typography>
                </Box>
              )}
            </Box>
            
            {(displayData.interests?.length > 0 || displayData.hobbies?.length > 0) && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  İlgi Alanları
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {displayData.hobbies && displayData.hobbies.map((hobby, index) => {
                    const isShared = sharedInterests.some(sh => 
                      typeof sh === 'object' && typeof hobby === 'object' ? sh._id === hobby._id : sh === hobby
                    );
                    
                    return (
                      <Box
                        key={hobby._id || `hobby-${index}`}
                        sx={{
                          bgcolor: isShared ? 'success.light' : 'primary.light',
                          color: isShared ? 'success.contrastText' : 'primary.contrastText',
                          px: 2,
                          py: 0.5,
                          borderRadius: 2,
                          fontSize: '0.875rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}
                      >
                        {isShared && <Favorite fontSize="small" />}
                        {hobby.name || hobby}
                      </Box>
                    );
                  })}
                  
                  {displayData.interests && displayData.interests.map((interest, index) => (
                    <Box
                      key={`interest-${index}`}
                      sx={{
                        bgcolor: 'secondary.light',
                        color: 'secondary.contrastText',
                        px: 2,
                        py: 0.5,
                        borderRadius: 2,
                        fontSize: '0.875rem',
                      }}
                    >
                      {interest}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </>
        )}
        
        {useFallback && (
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Bu kullanıcının tam profil bilgilerini görmek için önce giriş yapmalısınız.
            </Typography>
          </Box>
        )}
        
        {error && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Katılımcı Profili
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {loading && !user ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : !user && !useFallback ? (
          <Alert severity="info">Kullanıcı bilgisi bulunamadı</Alert>
        ) : (
          renderUserContent()
        )}
      </DialogContent>
      
      <DialogActions sx={{ display: 'flex', justifyContent: 'space-between', px: 3 }}>
        <Button onClick={onClose}>Kapat</Button>
        <Box>
          {isAuthenticated && user && user._id && user._id !== currentUser?._id && (
            <Button
              startIcon={<Email />}
              onClick={handleContactUser}
              sx={{ mr: 1 }}
            >
              İletişim Kur
            </Button>
          )}
          {user && user._id && (
            <Button 
              onClick={handleViewFullProfile} 
              variant="contained"
            >
              Profili Görüntüle
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default UserProfileModal; 