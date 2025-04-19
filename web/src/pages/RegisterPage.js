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
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  LockOutlined as LockIcon, 
  Email as EmailIcon,
  Person as PersonIcon,
  AccountCircle as AccountCircleIcon,
  MarkEmailRead as MarkEmailReadIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { registerUser } from '../services/userService';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [testEmailUrl, setTestEmailUrl] = useState('');
  
  const password = watch('password');
  
  const handleClickShowPassword = () => setShowPassword(!showPassword);

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    setSuccess(false);
    setTestEmailUrl('');
    
    try {
      const registerData = {
        username: data.username,
        email: data.email,
        password: data.password,
        fullName: data.fullName
      };
      
      const response = await registerUser(registerData);
      
      // Başarılı kayıt
      setSuccess(true);
      setRegisteredEmail(data.email);
      
      // Form içeriğini temizle
      reset();
      
      // Geliştirme ortamında test e-posta URL'sini göster
      if (response.developerInfo && response.developerInfo.emailPreviewUrl) {
        setTestEmailUrl(response.developerInfo.emailPreviewUrl);
      }
    } catch (err) {
      setError(err.message || 'Kayıt olurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };
  
  // Login sayfasına git
  const handleGoToLogin = () => {
    navigate('/login');
  };

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
        <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
          {success ? (
            // Başarılı kayıt mesajı
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <MarkEmailReadIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography component="h1" variant="h5" fontWeight="bold" gutterBottom>
                Kayıt İşlemi Başarılı!
              </Typography>
              <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
                <Typography variant="body1" fontWeight="medium" gutterBottom>
                  Doğrulama e-postası <strong>{registeredEmail}</strong> adresine gönderildi.
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Hesabınızı aktifleştirmek için lütfen e-posta kutunuzu kontrol edin ve doğrulama bağlantısına tıklayın. 
                  E-postayı göremiyorsanız, spam/gereksiz e-posta klasörünü de kontrol etmeyi unutmayın.
                </Typography>
                {testEmailUrl && (
                  <Typography variant="body2" fontWeight="medium" color="primary" sx={{ mt: 1 }}>
                    Test modu aktif olduğundan, aşağıdaki "Test E-postasını Görüntüle" düğmesine tıklayarak doğrulama e-postasını görüntüleyebilirsiniz.
                  </Typography>
                )}
              </Alert>
              
              {testEmailUrl && (
                <Box sx={{ mb: 3, p: 2, bgcolor: '#f0f8ff', borderRadius: 1, border: '1px solid #cce5ff' }}>
                  <Typography variant="subtitle2" color="primary" display="block" gutterBottom>
                    Test E-postası Önizleme
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    size="large"
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
              
              <Button
                variant="outlined"
                color="primary"
                size="large"
                onClick={handleGoToLogin}
                sx={{ mt: 2 }}
                fullWidth
              >
                Giriş Sayfasına Git
              </Button>
            </Box>
          ) : (
            // Kayıt formu
            <>
              <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <AccountCircleIcon sx={{ m: 1, fontSize: 40, color: 'primary.main' }} />
                <Typography component="h1" variant="h5" fontWeight="bold">
                  Hesap Oluştur
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="fullName"
                  label="Ad Soyad"
                  autoComplete="name"
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  }}
                  {...register('fullName', { 
                    required: 'Ad Soyad gereklidir',
                    minLength: {
                      value: 3,
                      message: 'Ad Soyad en az 3 karakter olmalıdır'
                    }
                  })}
                  error={!!errors.fullName}
                  helperText={errors.fullName?.message}
                />
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  label="Kullanıcı Adı"
                  autoComplete="username"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccountCircleIcon />
                      </InputAdornment>
                    ),
                  }}
                  {...register('username', { 
                    required: 'Kullanıcı adı gereklidir',
                    minLength: {
                      value: 3,
                      message: 'Kullanıcı adı en az 3 karakter olmalıdır'
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9_]+$/,
                      message: 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir'
                    }
                  })}
                  error={!!errors.username}
                  helperText={errors.username?.message}
                />
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="E-posta Adresi"
                  autoComplete="email"
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
                  id="password"
                  label="Şifre"
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
                  {loading ? <CircularProgress size={24} /> : 'Kayıt Ol'}
                </Button>
                
                <Grid container justifyContent="flex-end">
                  <Grid item>
                    <Link component={RouterLink} to="/login" variant="body2">
                      Zaten bir hesabınız var mı? Giriş yapın
                    </Link>
                  </Grid>
                </Grid>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default RegisterPage; 