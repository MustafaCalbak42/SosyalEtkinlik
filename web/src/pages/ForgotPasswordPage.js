import React, { useState } from 'react';
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
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { Email as EmailIcon, ArrowBack as ArrowBackIcon, OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { forgotPassword } from '../services/userService';

const ForgotPasswordPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [testEmailUrl, setTestEmailUrl] = useState('');
  const [emailSent, setEmailSent] = useState('');
  
  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    setSuccess(false);
    setTestEmailUrl('');
    setEmailSent(data.email);
    
    try {
      const response = await forgotPassword({ email: data.email });
      setSuccess(true);
      
      // Geliştirme ortamında test e-posta URL'sini göster
      if (response.developerInfo && response.developerInfo.emailPreviewUrl) {
        setTestEmailUrl(response.developerInfo.emailPreviewUrl);
      }
    } catch (err) {
      console.error('Şifremi unuttum hatası:', err);
      setError(err.message || 'Şifre sıfırlama isteği gönderilirken bir hata oluştu.');
    } finally {
      setLoading(false);
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
            <Typography component="h1" variant="h5" fontWeight="bold">
              Şifremi Unuttum
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1, textAlign: 'center' }}>
              E-posta adresinizi girin, size şifre sıfırlama bağlantısı göndereceğiz.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && !testEmailUrl && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="bold">
                {emailSent} adresine şifre sıfırlama bağlantısı gönderildi.
              </Typography>
              <Box mt={1}>
                <Typography variant="body2">
                  Lütfen e-posta kutunuzu kontrol edin. E-posta birkaç dakika içinde gelebilir.
                </Typography>
                <Typography variant="body2" mt={1}>
                  E-postayı göremiyorsanız spam/gereksiz klasörünü de kontrol etmeyi unutmayın.
                </Typography>
              </Box>
            </Alert>
          )}

          {success && testEmailUrl && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="E-posta Adresi"
              autoComplete="email"
              autoFocus
              disabled={loading}
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
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : success ? 'Tekrar Gönder' : 'Şifre Sıfırlama Bağlantısı Gönder'}
            </Button>
            
            {testEmailUrl && (
              <>
                <Divider sx={{ my: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    Test E-postası
                  </Typography>
                </Divider>
                <Box sx={{ mt: 2, mb: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    Bu sadece geliştirme ortamında görünür
                  </Typography>
                  <Button 
                    variant="outlined" 
                    startIcon={<OpenInNewIcon />}
                    component="a"
                    href={testEmailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ width: '100%' }}
                  >
                    Test E-postasını Görüntüle
                  </Button>
                </Box>
              </>
            )}
            
            <Grid container>
              <Grid item>
                <Link 
                  component={RouterLink} 
                  to="/login" 
                  variant="body2"
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  <ArrowBackIcon fontSize="small" sx={{ mr: 0.5 }} />
                  Giriş sayfasına dön
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPasswordPage; 