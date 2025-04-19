import React, { useState, useEffect } from 'react';
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
  CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined as LockIcon } from '@mui/icons-material';
import { useNavigate, Link as RouterLink, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { validateResetToken, resetPassword } from '../services/userService';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState('');
  const [validToken, setValidToken] = useState(false);
  
  const password = watch('password');
  
  const handleClickShowPassword = () => setShowPassword(!showPassword);

  // Token doğrulama
  useEffect(() => {
    const checkToken = async () => {
      try {
        await validateResetToken(token);
        setValidToken(true);
      } catch (err) {
        setError('Geçersiz veya süresi dolmuş şifre sıfırlama bağlantısı.');
      } finally {
        setValidating(false);
      }
    };

    if (token) {
      checkToken();
    } else {
      setError('Şifre sıfırlama token\'ı bulunamadı.');
      setValidating(false);
    }
  }, [token]);

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    
    try {
      await resetPassword({
        token,
        password: data.password
      });
      
      // Başarılı şifre sıfırlama sonrası giriş sayfasına yönlendir
      navigate('/login', { 
        state: { 
          message: 'Şifreniz başarıyla sıfırlandı. Yeni şifreniz ile giriş yapabilirsiniz.' 
        } 
      });
    } catch (err) {
      setError(err.message || 'Şifre sıfırlanırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <Container component="main" maxWidth="xs">
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
            Token doğrulanıyor...
          </Typography>
        </Box>
      </Container>
    );
  }

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
              Şifre Sıfırlama
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!validToken ? (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button
                component={RouterLink}
                to="/forgot-password"
                variant="contained"
                sx={{ mt: 2 }}
              >
                Yeni Şifre Sıfırlama Bağlantısı Al
              </Button>
            </Box>
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
                {loading ? <CircularProgress size={24} /> : 'Şifreyi Sıfırla'}
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