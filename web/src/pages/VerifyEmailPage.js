import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  CircularProgress,
  Alert,
  InputAdornment,
  Grid
} from '@mui/material';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import KeyIcon from '@mui/icons-material/Key';
import EmailIcon from '@mui/icons-material/Email';
import { verifyEmailCode } from '../services/userService';

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get email from location state
  const email = location.state?.email || '';
  
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  if (!email) {
    // If no email, redirect to register page
    navigate('/register');
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!code || code.length < 6) {
      setError('Lütfen size gönderilen 6 haneli kodu girin');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await verifyEmailCode({
        email,
        code
      });
      
      if (response.success) {
        setSuccess(true);
        // Navigate to email verified page
        setTimeout(() => {
          navigate('/email-verified?success=true&email=' + encodeURIComponent(email), { 
            state: { 
              email,
              verified: true
            } 
          });
        }, 1500);
      } else {
        setError(response.message || 'E-posta doğrulaması başarısız oldu');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Doğrulama işlemi sırasında bir hata oluştu, lütfen tekrar deneyin'
      );
      
      // Hata durumunda EmailVerifiedPage'e yönlendir
      setTimeout(() => {
        const errorMessage = encodeURIComponent(
          err.response?.data?.message || 'E-posta doğrulama işlemi sırasında bir hata oluştu'
        );
        navigate(`/email-verified?success=false&error=${errorMessage}&email=${encodeURIComponent(email)}`);
      }, 1500);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container component="main" maxWidth="xs">
      <Paper 
        elevation={3}
        sx={{
          mt: 8,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRadius: 2
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
          <MarkEmailReadIcon sx={{ fontSize: 32 }} />
        </Avatar>
        
        <Typography component="h1" variant="h5" fontWeight="bold" gutterBottom>
          E-posta Doğrulama
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          p: 1.5, 
          bgcolor: 'action.hover', 
          borderRadius: 1,
          width: '100%',
          mb: 2
        }}>
          <EmailIcon color="action" sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            <strong>{email}</strong> adresine gönderilen 6 haneli kodu girin
          </Typography>
        </Box>
        
        {error && <Alert severity="error" sx={{ mt: 1, mb: 2, width: '100%' }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 1, mb: 2, width: '100%' }}>E-posta doğrulaması başarılı! Yönlendiriliyorsunuz...</Alert>}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, width: '100%' }}>
          <TextField
            required
            fullWidth
            id="code"
            label="Doğrulama Kodu"
            name="code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, ''))}
            autoFocus
            inputProps={{ 
              maxLength: 6,
              inputMode: 'numeric',
              pattern: '[0-9]*',
              style: { textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.2em' }
            }}
            placeholder="_ _ _ _ _ _"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <KeyIcon />
                </InputAdornment>
              ),
            }}
            disabled={loading || success}
          />
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
            E-posta kutunuzu ve spam klasörünüzü kontrol edin
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading || success}
                sx={{ py: 1.2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'E-Postamı Doğrula'}
              </Button>
            </Grid>
            
            <Grid item xs={12} sx={{ textAlign: 'center' }}>
              <Button 
                variant="text" 
                color="primary" 
                onClick={() => navigate('/login')}
                size="small"
                disabled={loading || success}
              >
                Giriş sayfasına dön
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default VerifyEmailPage; 