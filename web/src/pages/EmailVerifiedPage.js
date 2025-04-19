import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle as CheckCircleIcon, Error as ErrorIcon } from '@mui/icons-material';

// E-posta doğrulama sonuç sayfası
const EmailVerifiedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // URL parametrelerini al
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const successParam = searchParams.get('success');
    const errorParam = searchParams.get('error');
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');

    // İşlem başarılı mı?
    if (successParam === 'true') {
      setSuccess(true);
      
      // Token varsa otomatik giriş yap
      if (token && refreshToken) {
        // Token'ları sakla
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
      }
    } else {
      setSuccess(false);
      if (errorParam) {
        setError(decodeURIComponent(errorParam));
      } else {
        setError('E-posta doğrulama işlemi sırasında bir hata oluştu.');
      }
    }
    
    setLoading(false);
  }, [location.search]);

  // Giriş sayfasına yönlendir
  const handleGoToLogin = () => {
    navigate('/login');
  };

  // Ana sayfaya yönlendir (oturum açıksa)
  const handleGoToHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh'
          }}
        >
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            E-posta doğrulama sonucu alınıyor...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          py: 8
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2, textAlign: 'center' }}>
          {success ? (
            <>
              <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom fontWeight="bold">
                E-posta Adresiniz Doğrulandı
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Hesabınız başarıyla aktifleştirildi. Artık Sosyal Etkinlik uygulamasını kullanmaya başlayabilirsiniz.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleGoToHome}
                sx={{ mt: 2 }}
              >
                Ana Sayfaya Git
              </Button>
            </>
          ) : (
            <>
              <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom fontWeight="bold">
                E-posta Doğrulama Hatası
              </Typography>
              <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                {error}
              </Alert>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Doğrulama bağlantısı geçersiz veya süresi dolmuş olabilir. Lütfen yeniden kayıt olun veya giriş sayfasından yeni doğrulama bağlantısı isteyin.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleGoToLogin}
                sx={{ mt: 2 }}
              >
                Giriş Sayfasına Git
              </Button>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default EmailVerifiedPage; 