import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Box, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Alert, 
  Link, 
  CircularProgress,
  Avatar,
  InputAdornment
} from '@mui/material';
import { 
  LockOutlined as LockIcon, 
  EmailOutlined as EmailIcon 
} from '@mui/icons-material';
import { forgotPassword } from '../services/userService';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    if (!email) {
      setError('Email adresi giriniz');
      return;
    }

    setLoading(true);
    
    try {
      const response = await forgotPassword({ email });
      
      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.message || 'Şifre sıfırlama işlemi başarısız oldu.');
      }
    } catch (err) {
      console.error('Şifremi unuttum hatası:', err);
      setError(
        err.response?.data?.message || 
        'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    navigate('/verify-reset-code', { 
      state: { email }
    });
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            width: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            borderRadius: 2 
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
            <LockIcon />
          </Avatar>

          <Typography component="h1" variant="h5" gutterBottom>
            Şifremi Unuttum
          </Typography>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Kayıtlı email adresinizi girin, şifre sıfırlama kodu göndereceğiz.
          </Typography>
          
          {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
          {success && (
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              Şifre sıfırlama talimatları email adresinize gönderildi. Lütfen mail kutunuzu kontrol edin.
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Adresi"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={handleChange}
              disabled={loading || success}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon />
                  </InputAdornment>
                ),
              }}
            />
            
            {!success ? (
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Sıfırlama Kodu Gönder'}
              </Button>
            ) : (
              <Button
                fullWidth
                variant="contained"
                color="success"
                sx={{ mt: 3, mb: 2, py: 1.2 }}
                onClick={handleContinue}
              >
                Devam Et - Kodu Doğrula
              </Button>
            )}
            
            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/login" variant="body2">
                Giriş sayfasına dön
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPasswordPage; 