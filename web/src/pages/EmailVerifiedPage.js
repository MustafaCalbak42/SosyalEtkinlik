import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle as CheckCircleIcon, Error as ErrorIcon, Email as EmailIcon } from '@mui/icons-material';
import { resendVerificationEmail } from '../services/userService';

// E-posta doğrulama sonuç sayfası
const EmailVerifiedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [resendDialogOpen, setResendDialogOpen] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');

  // URL parametrelerini al
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const successParam = searchParams.get('success');
    const errorParam = searchParams.get('error');
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const userEmail = searchParams.get('email');

    if (userEmail) {
      setEmail(decodeURIComponent(userEmail));
    }

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
        
        // Eğer hata "token süresi dolmuş" ise otomatik olarak resend dialogunu aç
        if (errorParam.includes('süresi dolmuş') && userEmail) {
          setTimeout(() => {
            setResendDialogOpen(true);
          }, 1000);
        }
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

  // E-posta doğrulama bağlantısını yeniden gönder
  const handleResendVerification = () => {
    setResendDialogOpen(true);
  };

  // Doğrulama e-postasını yeniden gönder
  const handleResendSubmit = async () => {
    if (!email) {
      setResendError('Lütfen e-posta adresinizi girin');
      return;
    }

    setResendLoading(true);
    setResendError('');

    try {
      const response = await resendVerificationEmail({ email });
      if (response.success) {
        setResendSuccess(true);
        setResendError('');
      } else {
        setResendError(response.message || 'E-posta gönderilemedi');
      }
    } catch (error) {
      setResendError(error.message || 'E-posta gönderilemedi');
    } finally {
      setResendLoading(false);
    }
  };

  // Dialog'u kapat
  const handleCloseDialog = () => {
    if (resendSuccess) {
      setResendDialogOpen(false);
      setResendSuccess(false);
      navigate('/login', { 
        state: { 
          message: 'Doğrulama e-postası gönderildi. Lütfen e-posta kutunuzu kontrol edin.' 
        } 
      });
    } else {
      setResendDialogOpen(false);
    }
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
                Doğrulama bağlantısı geçersiz veya süresi dolmuş olabilir. Yeni bir doğrulama bağlantısı istemek için aşağıdaki butona tıklayabilirsiniz.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mt: 2 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  onClick={handleGoToLogin}
                  fullWidth
                >
                  Giriş Sayfasına Git
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleResendVerification}
                  startIcon={<EmailIcon />}
                  fullWidth
                >
                  Doğrulama E-postasını Tekrar Gönder
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Box>

      {/* Doğrulama E-postası Yeniden Gönderme Dialogu */}
      <Dialog open={resendDialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>
          Doğrulama E-postasını Yeniden Gönder
        </DialogTitle>
        <DialogContent>
          {!resendSuccess ? (
            <>
              <DialogContentText>
                Lütfen hesabınıza ait e-posta adresini girin. Yeni bir doğrulama bağlantısı göndereceğiz.
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                label="E-posta Adresi"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!resendError}
                helperText={resendError}
              />
            </>
          ) : (
            <Alert severity="success" sx={{ mt: 2 }}>
              Doğrulama e-postası {email} adresine başarıyla gönderildi. Lütfen e-posta kutunuzu kontrol edin.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            {resendSuccess ? 'Tamam' : 'İptal'}
          </Button>
          {!resendSuccess && (
            <Button 
              onClick={handleResendSubmit}
              color="primary"
              variant="contained"
              disabled={resendLoading}
            >
              {resendLoading ? <CircularProgress size={24} /> : 'Gönder'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EmailVerifiedPage; 