import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Grid, 
  Link, 
  InputAdornment, 
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined as LockIcon, Email as EmailIcon, OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { loginUser, resendVerificationEmail } from '../services/userService';

const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendDialog, setResendDialog] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');
  const [testEmailUrl, setTestEmailUrl] = useState('');
  
  // Auth context'i kullan
  const { setUser } = useAuth();

  // Location state'den mesaj kontrolü
  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
      // History'den mesajı temizle
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleClickShowPassword = () => setShowPassword(!showPassword);

  const handleLoginSubmit = async (data) => {
    setLoading(true);
    setError('');
    setMessage('');
    setNeedsVerification(false);
    
    try {
      const response = await loginUser(data);
      if (response.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        setUser(response.data.user);
        
        // Kullanıcının e-posta durumunu kontrol et
        if (!response.data.user.emailVerified) {
          setNeedsVerification(true);
          setVerificationEmail(data.email);
          setError(response.message || 'E-posta adresinizi doğrulayın');
        } else {
          navigate('/profile');
        }
      } else {
        setError(response.message || 'Giriş başarısız');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Giriş sırasında bir hata oluştu');
    }
    setLoading(false);
  };

  // Doğrulama e-postasını tekrar gönder
  const handleResendVerification = async () => {
    setResendDialog(true);
  };

  // Doğrulama dialogunu kapat
  const handleCloseResendDialog = () => {
    setResendDialog(false);
    setResendSuccess(false);
    setResendError('');
  };

  // Doğrulama işlemini gerçekleştir
  const handleConfirmResend = async () => {
    setResendLoading(true);
    setResendError('');
    setResendSuccess(false);

    try {
      const response = await resendVerificationEmail({ email: verificationEmail });
      if (response.success) {
        setResendSuccess(true);
        setTestEmailUrl(response.data.testEmailUrl);
      } else {
        setResendError(response.message || 'Doğrulama e-postası gönderilirken bir hata oluştu.');
      }
    } catch (err) {
      setResendError(err.message || 'Doğrulama e-postası gönderilirken bir hata oluştu.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
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
        <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
          <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <LockIcon sx={{ m: 1, fontSize: 40, color: 'primary.main' }} />
            <Typography component="h1" variant="h5" fontWeight="bold">
              Giriş Yap
            </Typography>
          </Box>

          {message && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}

          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
              action={
                error.includes('e-posta') && (
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={handleResendVerification}
                  >
                    Yeniden Gönder
                  </Button>
                )
              }
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(handleLoginSubmit)} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="E-posta Adresi"
              autoComplete="email"
              autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon />
                  </InputAdornment>
                ),
              }}
              {...register('email', { 
                required: 'E-posta adresi gereklidir',
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i,
                  message: 'Geçerli bir e-posta adresi girin'
                }
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Şifre"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="Şifre görünürlüğünü değiştir"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              {...register('password', { 
                required: 'Şifre gereklidir',
                minLength: {
                  value: 6,
                  message: 'Şifre en az 6 karakter olmalıdır'
                }
              })}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Giriş Yap'}
            </Button>
            <Grid container spacing={1}>
              <Grid item xs>
                <Link component={RouterLink} to="/forgot-password" variant="body2">
                  Şifremi Unuttum
                </Link>
              </Grid>
              <Grid item>
                <Link component={RouterLink} to="/register" variant="body2">
                  Hesabınız yok mu? Kayıt olun
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>

      {/* E-posta Doğrulama Dialog */}
      <Dialog open={resendDialog} onClose={handleCloseResendDialog}>
        <DialogTitle>
          E-posta Doğrulama
        </DialogTitle>
        <DialogContent>
          {resendSuccess ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                Doğrulama e-postası <strong>{verificationEmail}</strong> adresine yeniden gönderildi.
              </Typography>
              <Typography variant="body2">
                Lütfen e-posta kutunuzu kontrol edin. E-postayı göremiyorsanız spam klasörünü de kontrol edin.
              </Typography>
              {/* Test e-posta URL'si varsa göster */}
              {testEmailUrl && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#f0f8ff', borderRadius: 1, border: '1px solid #cce5ff' }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Test modu aktif - E-postayı hemen görüntüleyin:
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    size="medium"
                    href={testEmailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ mt: 1, width: '100%' }}
                    startIcon={<OpenInNewIcon />}
                  >
                    Test E-postasını Görüntüle
                  </Button>
                </Box>
              )}
            </Alert>
          ) : (
            <>
              <DialogContentText>
                <strong>{verificationEmail}</strong> adresine yeni bir doğrulama e-postası göndermek istiyor musunuz?
              </DialogContentText>
              {resendError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {resendError}
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResendDialog}>
            Kapat
          </Button>
          {!resendSuccess && (
            <Button 
              onClick={handleConfirmResend} 
              variant="contained" 
              disabled={resendLoading}
            >
              {resendLoading ? <CircularProgress size={24} /> : 'Doğrulama E-postası Gönder'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LoginPage; 