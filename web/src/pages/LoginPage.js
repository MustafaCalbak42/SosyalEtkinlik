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
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        
        // Kullanıcının e-posta doğrulama durumunu kontrol et
        if (response.data.user && !response.data.user.emailVerified) {
          setNeedsVerification(true);
          setVerificationEmail(data.email);
          setError('Lütfen e-posta adresinizi doğrulayın');
        } else {
          setUser(response.data.user);
          navigate('/');
        }
      } else {
        setError(response.message || 'Giriş başarısız');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Giriş sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
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
        if (response.data && response.data.testEmailUrl) {
          setTestEmailUrl(response.data.testEmailUrl);
        }
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
                needsVerification && (
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
                      aria-label="şifre görünürlüğünü değiştir"
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
            
            <Grid container spacing={2}>
              <Grid item xs>
                <Link component={RouterLink} to="/forgot-password" variant="body2">
                  Şifremi Unuttum
                </Link>
              </Grid>
              <Grid item>
                <Link component={RouterLink} to="/register" variant="body2">
                  Hesabınız yok mu? Kaydolun
                </Link>
              </Grid>
            </Grid>
            
            <Button
              fullWidth
              color="primary"
              variant="outlined"
              component={RouterLink}
              to="/"
              sx={{ mt: 3 }}
            >
              Ana Sayfaya Dön
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* Doğrulama E-postası Yeniden Gönderme Dialogu */}
      <Dialog
        open={resendDialog}
        onClose={handleCloseResendDialog}
        aria-labelledby="resend-dialog-title"
      >
        <DialogTitle id="resend-dialog-title">
          Doğrulama E-postasını Yeniden Gönder
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {!resendSuccess ? (
              `${verificationEmail} adresine bir doğrulama e-postası göndermek istiyor musunuz?`
            ) : (
              `Doğrulama e-postası ${verificationEmail} adresine başarıyla gönderildi. Lütfen gelen kutunuzu kontrol edin.`
            )}
          </DialogContentText>
          
          {resendError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {resendError}
            </Alert>
          )}
          
          {resendSuccess && testEmailUrl && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Test ortamında, doğrulama e-postasını görüntülemek için aşağıdaki bağlantıyı kullanabilirsiniz:
              </Typography>
              <Link 
                href={testEmailUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                sx={{ display: 'flex', alignItems: 'center', mt: 1 }}
              >
                E-postayı Görüntüle <OpenInNewIcon fontSize="small" sx={{ ml: 0.5 }} />
              </Link>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResendDialog}>
            {resendSuccess ? 'Kapat' : 'İptal'}
          </Button>
          {!resendSuccess && (
            <Button 
              onClick={handleConfirmResend} 
              color="primary" 
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

export default LoginPage; 