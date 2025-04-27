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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Chip,
  FormHelperText,
  Divider
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  LockOutlined as LockIcon, 
  Email as EmailIcon,
  Person as PersonIcon,
  AccountCircle as AccountCircleIcon,
  MarkEmailRead as MarkEmailReadIcon,
  OpenInNew as OpenInNewIcon,
  LocationOn as LocationIcon,
  Interests as InterestsIcon
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { registerUser } from '../services/userService';
import { getAllHobbies } from '../services/hobbyService';
import { HOBBY_CATEGORIES } from '../shared/constants/appConstants';

// Şehirler listesi
const CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin', 'Aydın', 'Balıkesir', 
  'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 
  'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkâri', 'Hatay', 
  'Isparta', 'Mersin', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir', 'Kocaeli', 
  'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 
  'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 
  'Uşak', 'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale', 'Batman', 'Şırnak', 'Bartın', 
  'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce'
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, control, formState: { errors }, reset } = useForm();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [testEmailUrl, setTestEmailUrl] = useState('');
  const [hobbies, setHobbies] = useState([]);
  const [loadingHobbies, setLoadingHobbies] = useState(false);
  const [customHobbies, setCustomHobbies] = useState([]);
  const [newCustomHobby, setNewCustomHobby] = useState('');
  
  const password = watch('password');
  
  // Hobi verilerini yükle
  useEffect(() => {
    const fetchHobbies = async () => {
      setLoadingHobbies(true);
      try {
        const response = await getAllHobbies();
        setHobbies(response);
      } catch (err) {
        console.error('Hobiler yüklenirken hata:', err);
      } finally {
        setLoadingHobbies(false);
      }
    };
    
    fetchHobbies();
  }, []);
  
  const handleClickShowPassword = () => setShowPassword(!showPassword);

  // Kategori renklerini belirler
  const getCategoryColor = (category) => {
    const colors = {
      'Spor': '#4caf50',
      'Sanat': '#f44336',
      'Müzik': '#9c27b0',
      'Dans': '#ff9800',
      'Yemek': '#795548',
      'Seyahat': '#2196f3',
      'Eğitim': '#607d8b',
      'Teknoloji': '#00bcd4',
      'Doğa': '#8bc34a',
      'Diğer': '#9e9e9e'
    };
    
    return colors[category] || '#9e9e9e';
  };

  // Kategori ikonlarını belirler
  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Spor':
        return <Box component="span" sx={{ fontSize: 16 }}>🏀</Box>;
      case 'Sanat': 
        return <Box component="span" sx={{ fontSize: 16 }}>🎨</Box>;
      case 'Müzik':
        return <Box component="span" sx={{ fontSize: 16 }}>🎵</Box>;
      case 'Dans':
        return <Box component="span" sx={{ fontSize: 16 }}>💃</Box>;
      case 'Yemek':
        return <Box component="span" sx={{ fontSize: 16 }}>🍳</Box>;
      case 'Seyahat':
        return <Box component="span" sx={{ fontSize: 16 }}>✈️</Box>;
      case 'Eğitim':
        return <Box component="span" sx={{ fontSize: 16 }}>📚</Box>;
      case 'Teknoloji':
        return <Box component="span" sx={{ fontSize: 16 }}>💻</Box>;
      case 'Doğa':
        return <Box component="span" sx={{ fontSize: 16 }}>🌲</Box>;
      case 'Diğer':
        return <Box component="span" sx={{ fontSize: 16 }}>⭐</Box>;
      default:
        return <Box component="span" sx={{ fontSize: 16 }}>⭐</Box>;
    }
  };

  // Her hobi için özel ikonlar
  const getHobbyIcon = (hobbyName, category) => {
    // Spor kategorisi
    if (category === 'Spor') {
      switch(hobbyName) {
        case 'Futbol': return <Box component="span" sx={{ fontSize: 16 }}>⚽</Box>;
        case 'Basketbol': return <Box component="span" sx={{ fontSize: 16 }}>🏀</Box>;
        case 'Voleybol': return <Box component="span" sx={{ fontSize: 16 }}>🏐</Box>;
        case 'Tenis': return <Box component="span" sx={{ fontSize: 16 }}>🎾</Box>;
        case 'Yüzme': return <Box component="span" sx={{ fontSize: 16 }}>🏊</Box>;
        case 'Koşu': return <Box component="span" sx={{ fontSize: 16 }}>🏃</Box>;
        case 'Bisiklet': return <Box component="span" sx={{ fontSize: 16 }}>🚴</Box>;
        case 'Yoga': return <Box component="span" sx={{ fontSize: 16 }}>🧘</Box>;
        case 'Pilates': return <Box component="span" sx={{ fontSize: 16 }}>💪</Box>;
        default: return getCategoryIcon(category);
      }
    }
    // Sanat kategorisi
    else if (category === 'Sanat') {
      switch(hobbyName) {
        case 'Resim': return <Box component="span" sx={{ fontSize: 16 }}>🖼️</Box>;
        case 'Heykel': return <Box component="span" sx={{ fontSize: 16 }}>🗿</Box>;
        case 'Fotoğrafçılık': return <Box component="span" sx={{ fontSize: 16 }}>📷</Box>;
        case 'El Sanatları': return <Box component="span" sx={{ fontSize: 16 }}>🧶</Box>;
        case 'Seramik': return <Box component="span" sx={{ fontSize: 16 }}>🏺</Box>;
        default: return getCategoryIcon(category);
      }
    }
    // Müzik kategorisi
    else if (category === 'Müzik') {
      switch(hobbyName) {
        case 'Gitar': return <Box component="span" sx={{ fontSize: 16 }}>🎸</Box>;
        case 'Piyano': return <Box component="span" sx={{ fontSize: 16 }}>🎹</Box>;
        case 'Şarkı Söyleme': return <Box component="span" sx={{ fontSize: 16 }}>🎤</Box>;
        case 'Bağlama': return <Box component="span" sx={{ fontSize: 16 }}>🪕</Box>;
        case 'Keman': return <Box component="span" sx={{ fontSize: 16 }}>🎻</Box>;
        case 'Perküsyon': return <Box component="span" sx={{ fontSize: 16 }}>🥁</Box>;
        default: return getCategoryIcon(category);
      }
    }
    // Dans kategorisi
    else if (category === 'Dans') {
      switch(hobbyName) {
        case 'Modern Dans': return <Box component="span" sx={{ fontSize: 16 }}>💃</Box>;
        case 'Bale': return <Box component="span" sx={{ fontSize: 16 }}>🩰</Box>;
        case 'Salsa': return <Box component="span" sx={{ fontSize: 16 }}>💃</Box>;
        case 'Hip Hop': return <Box component="span" sx={{ fontSize: 16 }}>🕺</Box>;
        case 'Halk Dansları': return <Box component="span" sx={{ fontSize: 16 }}>👯</Box>;
        default: return getCategoryIcon(category);
      }
    }
    // Yemek kategorisi
    else if (category === 'Yemek') {
      switch(hobbyName) {
        case 'Pasta Yapımı': return <Box component="span" sx={{ fontSize: 16 }}>🎂</Box>;
        case 'Ekmek Yapımı': return <Box component="span" sx={{ fontSize: 16 }}>🍞</Box>;
        case 'Dünya Mutfağı': return <Box component="span" sx={{ fontSize: 16 }}>🌮</Box>;
        case 'Vegan Yemekler': return <Box component="span" sx={{ fontSize: 16 }}>🥗</Box>;
        case 'Türk Mutfağı': return <Box component="span" sx={{ fontSize: 16 }}>🍖</Box>;
        default: return getCategoryIcon(category);
      }
    }
    // Seyahat kategorisi
    else if (category === 'Seyahat') {
      switch(hobbyName) {
        case 'Dağ Tırmanışı': return <Box component="span" sx={{ fontSize: 16 }}>🏔️</Box>;
        case 'Kamp': return <Box component="span" sx={{ fontSize: 16 }}>⛺</Box>;
        case 'Şehir Turu': return <Box component="span" sx={{ fontSize: 16 }}>🏙️</Box>;
        case 'Kültür Gezileri': return <Box component="span" sx={{ fontSize: 16 }}>🗿</Box>;
        case 'Doğa Yürüyüşü': return <Box component="span" sx={{ fontSize: 16 }}>🥾</Box>;
        default: return getCategoryIcon(category);
      }
    }
    // Eğitim kategorisi
    else if (category === 'Eğitim') {
      switch(hobbyName) {
        case 'Yabancı Dil': return <Box component="span" sx={{ fontSize: 16 }}>🗣️</Box>;
        case 'Bilgisayar Programlama': return <Box component="span" sx={{ fontSize: 16 }}>👨‍💻</Box>;
        case 'Tarih': return <Box component="span" sx={{ fontSize: 16 }}>📜</Box>;
        case 'Felsefe': return <Box component="span" sx={{ fontSize: 16 }}>🧠</Box>;
        case 'Matematik': return <Box component="span" sx={{ fontSize: 16 }}>🔢</Box>;
        default: return getCategoryIcon(category);
      }
    }
    // Teknoloji kategorisi
    else if (category === 'Teknoloji') {
      switch(hobbyName) {
        case 'Web Tasarım': return <Box component="span" sx={{ fontSize: 16 }}>🌐</Box>;
        case 'Mobil Uygulama Geliştirme': return <Box component="span" sx={{ fontSize: 16 }}>📱</Box>;
        case 'Yapay Zeka': return <Box component="span" sx={{ fontSize: 16 }}>🤖</Box>;
        case 'Robotik': return <Box component="span" sx={{ fontSize: 16 }}>🦾</Box>;
        case 'Oyun Geliştirme': return <Box component="span" sx={{ fontSize: 16 }}>🎮</Box>;
        default: return getCategoryIcon(category);
      }
    }
    // Doğa kategorisi
    else if (category === 'Doğa') {
      switch(hobbyName) {
        case 'Bahçecilik': return <Box component="span" sx={{ fontSize: 16 }}>🌱</Box>;
        case 'Kuş Gözlemciliği': return <Box component="span" sx={{ fontSize: 16 }}>🦜</Box>;
        case 'Balıkçılık': return <Box component="span" sx={{ fontSize: 16 }}>🎣</Box>;
        case 'Doğa Fotoğrafçılığı': return <Box component="span" sx={{ fontSize: 16 }}>📸</Box>;
        case 'Ekoloji': return <Box component="span" sx={{ fontSize: 16 }}>♻️</Box>;
        default: return getCategoryIcon(category);
      }
    }
    // Diğer kategorisi
    else if (category === 'Diğer') {
      switch(hobbyName) {
        case 'Satranç': return <Box component="span" sx={{ fontSize: 16 }}>♟️</Box>;
        case 'Koleksiyon': return <Box component="span" sx={{ fontSize: 16 }}>🧸</Box>;
        case 'Meditasyon': return <Box component="span" sx={{ fontSize: 16 }}>🧘‍♂️</Box>;
        case 'Gönüllülük': return <Box component="span" sx={{ fontSize: 16 }}>🤝</Box>;
        case 'Astroloji': return <Box component="span" sx={{ fontSize: 16 }}>🔮</Box>;
        default: return getCategoryIcon(category);
      }
    }
    
    // Varsayılan olarak kategori ikonunu kullan
    return getCategoryIcon(category);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    setSuccess(false);
    setTestEmailUrl('');
    
    try {
      // Form verileri hazırlanıyor
      const registerData = {
        username: data.username,
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        city: data.city,
        bio: data.bio || '',
        hobbies: data.hobbies || [],
        interests: data.interests || []
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
    <Container component="main" maxWidth="md">
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
                <Typography variant="subtitle1" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
                  İlgi alanlarınıza göre etkinliklere katılın ve yeni insanlarla tanışın
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
                <Typography variant="subtitle1" color="primary" fontWeight="medium" sx={{ mb: 2 }}>
                  Kişisel Bilgiler
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
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
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
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
                  </Grid>
                
                  <Grid item xs={12}>
                    <TextField
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
                  </Grid>
                
                  <Grid item xs={12} md={6}>
                    <TextField
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
                  </Grid>
                
                  <Grid item xs={12} md={6}>
                    <TextField
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
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="subtitle1" color="primary" fontWeight="medium" sx={{ mb: 2 }}>
                  Konum ve İlgi Alanları
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="city"
                      control={control}
                      defaultValue=""
                      rules={{ required: 'Lütfen şehir seçiniz' }}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.city}>
                          <InputLabel id="city-label">Şehir</InputLabel>
                          <Select
                            {...field}
                            labelId="city-label"
                            id="city"
                            label="Şehir"
                            startAdornment={
                              <InputAdornment position="start">
                                <LocationIcon />
                              </InputAdornment>
                            }
                          >
                            {CITIES.map((city) => (
                              <MenuItem key={city} value={city}>
                                {city}
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.city && <FormHelperText>{errors.city.message}</FormHelperText>}
                        </FormControl>
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="hobbies"
                      control={control}
                      defaultValue={[]}
                      render={({ field: { onChange, value } }) => (
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Hobiler
                          </Typography>
                          
                          <Box sx={{ mb: 2 }}>
                            <Autocomplete
                              multiple
                              options={hobbies || []}
                              loading={loadingHobbies}
                              getOptionLabel={(option) => option.name || option}
                              value={value.filter(h => typeof h === 'object')}
                              onChange={(e, newValue) => {
                                // Yalnızca seçili hobiler ve özel hobiler birleştirilir
                                const customHobbyValues = value.filter(h => typeof h === 'string');
                                onChange([...newValue, ...customHobbyValues]);
                              }}
                              renderTags={(tagValue, getTagProps) =>
                                tagValue.map((option, index) => (
                                  <Chip
                                    label={option.name || option}
                                    {...getTagProps({ index })}
                                    key={index}
                                    variant="outlined"
                                    color="primary"
                                    size="small"
                                    avatar={
                                      <Box 
                                        component="span" 
                                        sx={{ 
                                          width: 24, 
                                          height: 24, 
                                          borderRadius: '50%',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          backgroundColor: option.category ? getCategoryColor(option.category) : '#e0e0e0'
                                        }}
                                      >
                                        {getHobbyIcon(option.name, option.category)}
                                      </Box>
                                    }
                                  />
                                ))
                              }
                              groupBy={(option) => option.category}
                              renderOption={(props, option) => (
                                <li {...props}>
                                  <Box 
                                    component="span" 
                                    sx={{ 
                                      width: 32, 
                                      height: 32, 
                                      borderRadius: '50%',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      mr: 1,
                                      backgroundColor: getCategoryColor(option.category)
                                    }}
                                  >
                                    {getHobbyIcon(option.name, option.category)}
                                  </Box>
                                  <Box>
                                    <Typography variant="body1">{option.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{option.category}</Typography>
                                  </Box>
                                </li>
                              )}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  placeholder="Hobilerinizi seçin"
                                  InputProps={{
                                    ...params.InputProps,
                                    startAdornment: (
                                      <>
                                        <InputAdornment position="start">
                                          <InterestsIcon />
                                        </InputAdornment>
                                        {params.InputProps.startAdornment}
                                      </>
                                    ),
                                  }}
                                />
                              )}
                            />
                          </Box>
                          
                          {/* Özel Hobi Ekleme */}
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                            Özel Hobiler Ekleyin
                          </Typography>
                          
                          <Box sx={{ display: 'flex', mb: 1 }}>
                            <TextField 
                              fullWidth
                              size="small"
                              placeholder="Kendi hobinizi ekleyin"
                              value={newCustomHobby}
                              onChange={(e) => setNewCustomHobby(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && newCustomHobby.trim()) {
                                  e.preventDefault();
                                  // Özel hobi ekle
                                  const customHobby = newCustomHobby.trim();
                                  if (!value.includes(customHobby)) {
                                    onChange([...value, customHobby]);
                                    setCustomHobbies([...customHobbies, customHobby]);
                                  }
                                  setNewCustomHobby('');
                                }
                              }}
                              InputProps={{
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton 
                                      size="small" 
                                      onClick={() => {
                                        if (newCustomHobby.trim()) {
                                          // Özel hobi ekle
                                          const customHobby = newCustomHobby.trim();
                                          if (!value.includes(customHobby)) {
                                            onChange([...value, customHobby]);
                                            setCustomHobbies([...customHobbies, customHobby]);
                                          }
                                          setNewCustomHobby('');
                                        }
                                      }}
                                      disabled={!newCustomHobby.trim()}
                                    >
                                      <Box 
                                        component="span" 
                                        sx={{ 
                                          bgcolor: newCustomHobby.trim() ? 'primary.main' : 'grey.300',
                                          color: 'white',
                                          borderRadius: '50%',
                                          width: 24,
                                          height: 24,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                      >
                                        +
                                      </Box>
                                    </IconButton>
                                  </InputAdornment>
                                )
                              }}
                            />
                          </Box>
                          
                          {/* Özel Hobiler Listesi */}
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {value.filter(v => typeof v === 'string').map((hobby, index) => (
                              <Chip
                                key={index}
                                label={hobby}
                                variant="outlined"
                                size="small"
                                onDelete={() => {
                                  const newValue = value.filter(v => v !== hobby);
                                  onChange(newValue);
                                }}
                                avatar={
                                  <Box 
                                    component="span" 
                                    sx={{ 
                                      width: 24, 
                                      height: 24, 
                                      borderRadius: '50%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      backgroundColor: '#e0e0e0'
                                    }}
                                  >
                                    <PersonIcon fontSize="small" />
                                  </Box>
                                }
                              />
                            ))}
                          </Box>
                          
                          <FormHelperText>
                            Hobiler arasından seçim yapabilir veya kendi özel hobilerinizi ekleyebilirsiniz
                          </FormHelperText>
                        </Box>
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Controller
                      name="interests"
                      control={control}
                      defaultValue={[]}
                      render={({ field: { onChange, value } }) => (
                        <Autocomplete
                          multiple
                          freeSolo
                          options={[]}
                          value={value}
                          onChange={(e, newValue) => onChange(newValue)}
                          renderTags={(tagValue, getTagProps) =>
                            tagValue.map((option, index) => (
                              <Chip
                                label={option}
                                {...getTagProps({ index })}
                                key={index}
                                variant="outlined"
                                size="small"
                              />
                            ))
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="İlgi Alanları"
                              placeholder="İlgi alanlarınızı yazın ve Enter'a basın"
                              helperText="İlgi alanlarınızı yazın ve Enter tuşuna basın. Örn: kitap okuma, yürüyüş, sinema"
                            />
                          )}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="bio"
                      label="Hakkınızda"
                      multiline
                      rows={3}
                      placeholder="Kendinizi kısaca tanıtın..."
                      {...register('bio', { 
                        maxLength: {
                          value: 500,
                          message: 'Biyografiniz en fazla 500 karakter olabilir'
                        }
                      })}
                      error={!!errors.bio}
                      helperText={errors.bio?.message || "İsteğe bağlı, en fazla 500 karakter"}
                    />
                  </Grid>
                </Grid>
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 4, mb: 2, py: 1.5 }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Kayıt Ol ve Etkinliklere Katıl'}
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