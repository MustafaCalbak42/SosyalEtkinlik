import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Link,
  InputAdornment, 
  IconButton,
  Alert,
  CircularProgress,
  Avatar
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  LockOutlined as LockIcon, 
  CheckCircleOutline as CheckIcon 
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { resetPassword } from '../services/userService';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Verify location state data (from VerifyResetCodePage)
  const email = location.state?.email || '';
  const verified = location.state?.verified || false;
  const verificationId = location.state?.verificationId || '';
  
  // Redirect if not coming from verification page
  if (!verified || !email) {
    navigate('/forgot-password');
    return null;
  }
  
  const password = watch('password', '');
  
  const handleClickShowPassword = () => setShowPassword(!showPassword);

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await resetPassword({
        email,
        verificationId,
        password: data.password
      });
      
      if (response.success) {
        setSuccess(true);
        
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Şifreniz başarıyla değiştirildi. Lütfen yeni şifrenizle giriş yapın.' 
            } 
          });
        }, 2000);
      } else {
        setError(response.message || 'Şifre değiştirme işlemi başarısız oldu.');
      }
    } catch (err) {
      console.error('Şifre değiştirme hatası:', err);
      setError(
        err.response?.data?.message || 
        'Şifre değiştirme sırasında bir hata oluştu. Lütfen tekrar deneyin.'
      );
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
          mt: 8
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar sx={{ m: 1, bgcolor: success ? 'success.main' : 'primary.main', width: 56, height: 56 }}>
              {success ? <CheckIcon sx={{ fontSize: 32 }} /> : <LockIcon sx={{ fontSize: 32 }} />}
            </Avatar>
            
            <Typography component="h1" variant="h5" fontWeight="bold" gutterBottom>
              {success ? 'Şifre Değiştirildi' : 'Yeni Şifre Belirle'}
            </Typography>
            
            {!success && (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                <strong>{email}</strong> hesabınız için yeni bir şifre belirleyin
              </Typography>
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, mt: 2 }}>
              {error}
            </Alert>
          )}
          
          {success ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              Şifreniz başarıyla değiştirildi! Giriş sayfasına yönlendiriliyorsunuz...
            </Alert>
          ) : (
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="password"
                label="Yeni Şifre"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
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
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
                    message: 'Şifre en az bir küçük harf, bir büyük harf ve bir rakam içermelidir'
                  }
                })}
                error={!!errors.password}
                helperText={errors.password?.message}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                id="confirmPassword"
                label="Şifre Tekrar"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon />
                    </InputAdornment>
                  ),
                }}
                {...register('confirmPassword', { 
                  required: 'Şifre tekrarı gereklidir',
                  validate: value => value === password || 'Şifreler eşleşmiyor'
                })}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Şifreyi Değiştir'}
              </Button>
              
              <Box sx={{ textAlign: 'center' }}>
                <Link component={RouterLink} to="/login" variant="body2">
                  Giriş sayfasına dön
                </Link>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ResetPasswordPage; 