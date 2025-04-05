import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Typography, 
  Box, 
  Tab, 
  Tabs, 
  Card, 
  CardContent,
  Alert,
  CircularProgress,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChangePasswordForm from '../components/Profile/ChangePasswordForm';
import ProfilePhotoUpload from '../components/Profile/ProfilePhotoUpload';
import { getUserProfile } from '../services/userService';

// TabPanel bileşeni
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ProfileSettingsPage = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  
  useEffect(() => {
    // Kullanıcı girişi yapılmadıysa login sayfasına yönlendir
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/profile/settings' } });
      return;
    }
    
    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await getUserProfile();
        setProfile(response.data);
      } catch (error) {
        console.error('Profil bilgileri yüklenirken hata oluştu:', error);
        setError(error.message || 'Profil bilgileri yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [isAuthenticated, navigate]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeactivateAccount = () => {
    // Hesap deaktivasyonu burada yapılacak
    // API isteği gönderilecek
    alert('Hesap deaktivasyon işlemi için backend entegrasyonu yapılacak');
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
      <Typography variant="h4" component="h1" gutterBottom>
        Profil Ayarları
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 2, boxShadow: 3, mb: { xs: 2, md: 0 } }}>
            <CardContent>
              <Tabs
                orientation="vertical"
                variant="scrollable"
                value={tabValue}
                onChange={handleTabChange}
                sx={{ borderRight: 1, borderColor: 'divider' }}
              >
                <Tab label="Hesap Bilgileri" />
                <Tab label="Profil Fotoğrafı" />
                <Tab label="Şifre Değiştir" />
                <Tab label="Hesap Yönetimi" />
              </Tabs>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={9}>
          <TabPanel value={tabValue} index={0}>
            <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Hesap Bilgileri
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Kullanıcı Adı
                      </Typography>
                      <Typography variant="body1">
                        {profile?.username}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        E-posta
                      </Typography>
                      <Typography variant="body1">
                        {profile?.email}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Ad Soyad
                      </Typography>
                      <Typography variant="body1">
                        {profile?.fullName}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Hesap Oluşturma Tarihi
                      </Typography>
                      <Typography variant="body1">
                        {profile?.createdAt && new Date(profile.createdAt).toLocaleDateString('tr-TR')}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Son Aktivite
                      </Typography>
                      <Typography variant="body1">
                        {profile?.lastActive && new Date(profile.lastActive).toLocaleDateString('tr-TR')}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <ProfilePhotoUpload profile={profile} setProfile={setProfile} />
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <ChangePasswordForm />
          </TabPanel>
          
          <TabPanel value={tabValue} index={3}>
            <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Hesap Yönetimi
                </Typography>
                
                <Box sx={{ mt: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Button
                        variant="outlined"
                        color="primary"
                        fullWidth
                        onClick={handleLogout}
                      >
                        Çıkış Yap
                      </Button>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Button
                        variant="outlined"
                        color="error"
                        fullWidth
                        onClick={handleDeactivateAccount}
                      >
                        Hesabımı Devre Dışı Bırak
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </TabPanel>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfileSettingsPage; 