import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
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
import LockResetIcon from '@mui/icons-material/LockReset';
import KeyIcon from '@mui/icons-material/Key';
import EmailIcon from '@mui/icons-material/Email';

const VerifyResetCodePage = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get email from location state
  const email = location.state?.email || '';
  
  if (!email) {
    // If no email, redirect to forgot password
    navigate('/forgot-password');
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
      const response = await axios.post('/api/users/verify-reset-code', {
        email,
        code
      });
      
      if (response.data.success) {
        setSuccess(true);
        // Navigate to reset password page with token
        setTimeout(() => {
          navigate('/reset-password/new', { 
            state: { 
              email,
              verified: true,
              verificationId: response.data.verificationId
            } 
          });
        }, 1000); // Daha hızlı yönlendirme
      } else {
        setError(response.data.message || 'Kod doğrulaması başarısız oldu');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Doğrulama işlemi sırasında bir hata oluştu, lütfen tekrar deneyin'
      );
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
          <LockResetIcon sx={{ fontSize: 32 }} />
        </Avatar>
        
        <Typography component="h1" variant="h5" fontWeight="bold" gutterBottom>
          Doğrulama Kodu
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
        {success && <Alert severity="success" sx={{ mt: 1, mb: 2, width: '100%' }}>Doğrulama başarılı! Şifre değiştirme sayfasına yönlendiriliyorsunuz...</Alert>}
        
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
                {loading ? <CircularProgress size={24} /> : 'Doğrula ve Devam Et'}
              </Button>
            </Grid>
            
            <Grid item xs={12} sx={{ textAlign: 'center' }}>
              <Button 
                variant="text" 
                color="primary" 
                onClick={() => navigate('/forgot-password')}
                size="small"
                disabled={loading || success}
              >
                Farklı bir e-posta adresi kullan
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default VerifyResetCodePage; 