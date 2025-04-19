import React, { useState, useEffect } from 'react';
import { Container, Grid, Box, Button, Alert, CircularProgress } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProfileInfo from '../components/Profile/ProfileInfo';
import ProfileActivities from '../components/Profile/ProfileActivities';
import { getUserByUsername, getUserProfile, followUser, unfollowUser } from '../services/userService';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';

const ProfilePage = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  
  const isCurrentUser = !username || (user && (username === user.username));
  
  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let profileData;
        
        if (isCurrentUser) {
          // Kendi profilin görüntüleniyor
          const response = await getUserProfile();
          profileData = response.data;
        } else {
          // Başka kullanıcının profili görüntüleniyor
          const response = await getUserByUsername(username);
          profileData = response.data;
          
          // Takip durumunu kontrol et
          if (user && profileData) {
            setIsFollowing(profileData.followers.some(follower => 
              follower._id === user._id || follower === user._id
            ));
          }
        }
        
        setProfile(profileData);
      } catch (error) {
        console.error('Profil bilgileri yüklenirken hata oluştu:', error);
        setError(error.message || 'Profil bilgileri yüklenemedi.');
        
        // Profil bulunamadıysa anasayfaya yönlendir
        if (error.status === 404) {
          navigate('/', { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (user || username) {
      fetchProfileData();
    }
  }, [user, username, isCurrentUser, navigate]);
  
  const handleProfileUpdate = (updatedProfile) => {
    setProfile(updatedProfile);
  };
  
  const handleFollow = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/profile/${username}` } });
      return;
    }
    
    setFollowLoading(true);
    
    try {
      if (isFollowing) {
        await unfollowUser(profile._id);
        setIsFollowing(false);
      } else {
        await followUser(profile._id);
        setIsFollowing(true);
      }
      
      // Profil verilerini yeniden yükle
      const response = await getUserByUsername(username);
      setProfile(response.data);
    } catch (error) {
      console.error('Takip işleminde hata:', error);
      setError(error.message || 'Takip işlemi gerçekleştirilemedi.');
    } finally {
      setFollowLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <ProfileInfo 
            profile={profile} 
            onProfileUpdate={handleProfileUpdate} 
          />
          
          {!isCurrentUser && user && (
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Button
                variant={isFollowing ? "outlined" : "contained"}
                color={isFollowing ? "error" : "primary"}
                startIcon={isFollowing ? <PersonRemoveIcon /> : <PersonAddIcon />}
                onClick={handleFollow}
                disabled={followLoading}
              >
                {followLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  isFollowing ? 'Takibi Bırak' : 'Takip Et'
                )}
              </Button>
            </Box>
          )}
        </Grid>
        
        <Grid item xs={12} md={8}>
          <ProfileActivities 
            events={profile?.events || []}
            participatedEvents={profile?.participatedEvents || []}
            followers={profile?.followers || []}
            following={profile?.following || []}
            isCurrentUser={isCurrentUser}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfilePage; 