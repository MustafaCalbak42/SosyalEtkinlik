import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Box,
  Chip,
  FormHelperText,
  Alert,
  InputAdornment,
  CircularProgress,
  Divider
} from '@mui/material';
import { LocationOn, People, Euro, Map as MapIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { getAllHobbies } from '../../services/hobbyService';
import MapSelector from '../Map/MapSelector';

const CreateEventForm = ({ open, onClose }) => {
  const { user, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hobbies, setHobbies] = useState([]);
  const [tokenStatus, setTokenStatus] = useState({
    exists: false,
    checked: false
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    hobbyId: '',
    address: '',
    city: '',
    coordinates: null, // Haritadan seçilen koordinatlar
    startDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // Yarın
    endDate: new Date(new Date().getTime() + 27 * 60 * 60 * 1000),   // Yarın + 3 saat
    maxParticipants: 10,
    price: 0,
    tags: [],
    requirements: [],
    currentTag: '',
    currentRequirement: ''
  });

  // Form doğrulama
  const [formErrors, setFormErrors] = useState({});
  
  // Hobileri yükle
  useEffect(() => {
    const fetchHobbies = async () => {
      try {
        console.log('[CreateEventForm] Fetching hobbies with hobbyService...');
        const result = await getAllHobbies();
        
        if (result.success && result.data) {
          console.log('[CreateEventForm] Hobbies loaded successfully through service:', result.data);
          setHobbies(result.data);
        } else {
          console.error('[CreateEventForm] Failed to load hobbies through service:', result.message);
          setError('Hobiler yüklenemedi: ' + result.message);
        }
      } catch (error) {
        console.error('[CreateEventForm] Error fetching hobbies:', error);
        setError('Hobiler yüklenemedi. Lütfen daha sonra tekrar deneyin.');
      }
    };

    if (open) {
      fetchHobbies();
    }
  }, [open]);
  
  // Token durumunu izle
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem('token');
      if (!tokenStatus.exists && token) {
        console.log('[CreateEventForm] Token status changed, refreshing...');
        setTokenStatus({
          exists: true,
          checked: true
        });
        
        // Token varsa kullanıcı verilerini yenilemeyi dene
        refreshUserData && refreshUserData();
      }
    }, 2000); // 2 saniyede bir kontrol et
    
    return () => clearInterval(interval);
  }, [tokenStatus, refreshUserData]);

  // Debug için kullanıcı bilgisini ve kimlik doğrulama durumunu logla
  useEffect(() => {
    console.log('[CreateEventForm] Current user:', user);
    console.log('[CreateEventForm] Auth state:', !!user);
    console.log('[CreateEventForm] Token exists:', tokenStatus.exists);
    
    // User yoksa ama token varsa, kullanıcı verilerini yenile
    if (!user && tokenStatus.exists) {
      console.log('[CreateEventForm] Token exists but no user, refreshing user data');
      refreshUserData && refreshUserData();
    }
  }, [user, tokenStatus, refreshUserData]);

  // Hobi bilgilerini göster 
  useEffect(() => {
    console.log('[CreateEventForm] Current hobbies state:', hobbies);
  }, [hobbies]);

  // Token kontrolü
  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('token');
      console.log('[CreateEventForm] Token check:', token ? 'Token exists' : 'No token');
      setTokenStatus({
        exists: !!token,
        checked: true
      });
    };
    
    checkToken();
  }, [open]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Tarih alanları için özel işlem
    if (name === 'startDate' || name === 'endDate') {
      // Mevcut tarihten saati al
      const currentDate = new Date(formData[name]);
      // Yeni seçilen tarih
      const [year, month, day] = value.split('-').map(Number);
      
      // Saati koruyarak yeni bir tarih nesnesi oluştur
      const newDate = new Date(currentDate);
      newDate.setFullYear(year);
      newDate.setMonth(month - 1); // JavaScript'te aylar 0-11 arasında
      newDate.setDate(day);
      
      console.log(`[CreateEventForm] Tarih seçildi: ${name}, yeni değer:`, newDate);
      
      setFormData({
        ...formData,
        [name]: newDate
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Hata varsa temizle
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };

  const handleDateChange = (name, date) => {
    setFormData({
      ...formData,
      [name]: date
    });
    
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };

  const handleTagAdd = () => {
    if (formData.currentTag.trim() && !formData.tags.includes(formData.currentTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.currentTag.trim()],
        currentTag: ''
      });
    }
  };

  const handleTagDelete = (tagToDelete) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToDelete)
    });
  };

  const handleRequirementAdd = () => {
    if (formData.currentRequirement.trim() && !formData.requirements.includes(formData.currentRequirement.trim())) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, formData.currentRequirement.trim()],
        currentRequirement: ''
      });
    }
  };

  const handleRequirementDelete = (reqToDelete) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter(req => req !== reqToDelete)
    });
  };

  const handleLocationSelect = (locationData) => {
    // Haritadan seçilen konum bilgilerini formData'ya ekle
    const addressParts = locationData.address.split(',');
    // Adresin son kısmından şehir bilgisini çıkarmaya çalış
    const city = addressParts.length > 1 ? addressParts[addressParts.length - 2].trim() : '';
    
    setFormData({
      ...formData,
      address: locationData.address,
      city: city || formData.city, // Şehir bulunamazsa mevcut değeri koru
      coordinates: locationData.coordinates
    });
    
    // Konum hatasını temizle
    if (formErrors.address || formErrors.city) {
      setFormErrors({
        ...formErrors,
        address: null,
        city: null
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) errors.title = 'Etkinlik başlığı zorunludur';
    if (!formData.description.trim() || formData.description.length < 20) errors.description = 'Etkinlik açıklaması en az 20 karakter olmalıdır';
    if (!formData.hobbyId) errors.hobbyId = 'Hobi kategorisi seçmelisiniz';
    if (!formData.address.trim()) errors.address = 'Etkinlik adresi zorunludur';
    if (!formData.city.trim()) errors.city = 'Şehir zorunludur';
    if (!formData.coordinates) errors.coordinates = 'Haritadan konum seçmelisiniz';
    
    // Başlangıç tarihi kontrolü
    const now = new Date();
    if (!formData.startDate || formData.startDate <= now) errors.startDate = 'Başlangıç tarihi gelecekte olmalıdır';
    
    // Bitiş tarihi kontrolü
    if (!formData.endDate) errors.endDate = 'Bitiş tarihi zorunludur';
    else if (formData.endDate <= formData.startDate) errors.endDate = 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır';
    
    // Katılımcı sayısı kontrolü
    if (!formData.maxParticipants || formData.maxParticipants < 2) errors.maxParticipants = 'En az 2 katılımcı olmalıdır';
    
    // Fiyat kontrolü
    if (formData.price < 0) errors.price = 'Fiyat 0 veya daha büyük olmalıdır';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setError('');
    setSuccess(false);
    
    // Yeniden token kontrolü yap
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Oturum süreniz dolmuş olabilir. Lütfen yeniden giriş yapın.');
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    // Hobi ID'sini kontrol et
    if (!formData.hobbyId && hobbies.length > 0) {
      console.error('[CreateEventForm] No hobby selected although hobbies exist');
      setError('Lütfen bir hobi kategorisi seçiniz');
      setFormErrors({
        ...formErrors,
        hobbyId: 'Hobi kategorisi seçmelisiniz'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Gönderilecek verileri konsola yazdır
      console.log('[CreateEventForm] Submitting event data:', formData);
      console.log('[CreateEventForm] User token at submission:', token ? 'Present' : 'Missing');
      console.log('[CreateEventForm] Selected hobby ID:', formData.hobbyId);

      // Tarih formatlarını düzgün ayarla
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      // API'ye gönderilecek verileri hazırla
      const eventData = {
        title: formData.title,
        description: formData.description,
        hobby: formData.hobbyId,
        location: {
          type: 'Point',
          coordinates: formData.coordinates ? [formData.coordinates[1], formData.coordinates[0]] : [29.0121795, 41.0053215], // MongoDB GeoJSON formatı: [longitude, latitude]
          address: formData.address
        },
        startDate: startDate.toISOString(), // ISO string formatına çevir
        endDate: endDate.toISOString(),     // ISO string formatına çevir
        maxParticipants: parseInt(formData.maxParticipants),
        price: parseFloat(formData.price),
        tags: formData.tags,
        requirements: formData.requirements
      };
      
      console.log('[CreateEventForm] Formatted event data:', eventData);
      
      // Direk fetch API kullanarak deneme
      console.log('[CreateEventForm] Sending API request with fetch...');
      
      // API URL'sini tam olarak belirt
      const apiUrl = 'http://localhost:5000/api/events';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventData)
      });
      
      const responseData = await response.json();
      console.log('[CreateEventForm] API response:', responseData);
      
      if (response.ok && responseData.success) {
        setSuccess(true);
        setFormData({
          title: '',
          description: '',
          hobbyId: '',
          address: '',
          city: '',
          coordinates: null,
          startDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
          endDate: new Date(new Date().getTime() + 27 * 60 * 60 * 1000),
          maxParticipants: 10,
          price: 0,
          tags: [],
          requirements: [],
          currentTag: '',
          currentRequirement: ''
        });
        
        // 2 saniye sonra modal'ı kapat
        setTimeout(() => {
          onClose(true); // true: başarıyla oluşturuldu, sayfayı yenile
        }, 2000);
      } else {
        setError(responseData?.message || 'Etkinlik oluşturulurken bir hata oluştu');
      }
    } catch (error) {
      console.error('[CreateEventForm] Create event error:', error);
      
      if (error.response) {
        console.error('[CreateEventForm] Error details:', error.response.data);
        console.error('[CreateEventForm] Error status:', error.response.status);
        
        if (error.response.status === 401) {
          setError('Oturum süreniz dolmuş. Lütfen yeniden giriş yapın.');
          // Token'ı temizle, kullanıcı yeniden giriş yapmalı
          localStorage.removeItem('token');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else if (error.response.status === 403) {
          setError('Bu işlem için yetkiniz bulunmuyor. Lütfen tekrar giriş yapın.');
          localStorage.removeItem('token');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else {
          setError(error.response?.data?.message || 'Etkinlik oluşturulurken bir hata oluştu');
        }
      } else {
        // Network hatası veya beklenmeyen bir hata
        setError('Sunucuya bağlanırken bir hata oluştu. Lütfen internet bağlantınızı kontrol edin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  // Kullanıcı bilgisi konsolda görüntülenir
  console.log('[CreateEventForm] Rendering with user:', user);
  
  // Token var ama user yok ise
  if (!user && tokenStatus.exists) {
    // Direkt olarak etkinlik oluşturma formunu göster
    // Kullanıcı yükleniyor mesajı göstermek yerine
    console.log('[CreateEventForm] Token exists but user not loaded, proceeding with form');
    
    // Form görüntülenirken arka planda user verileri yüklenmeye çalışılacak
    refreshUserData && refreshUserData();
    
    // User olmasa da token varsa işleme devam et
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Yeni Etkinlik Oluştur</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2, mt: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2, mt: 2 }}>
              Etkinlik başarıyla oluşturuldu! Yönlendiriliyorsunuz...
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  name="title"
                  label="Etkinlik Başlığı"
                  fullWidth
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  error={!!formErrors.title}
                  helperText={formErrors.title}
                  disabled={loading || success}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Etkinlik Açıklaması"
                  fullWidth
                  required
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  error={!!formErrors.description}
                  helperText={formErrors.description || 'En az 20 karakter olmalıdır'}
                  disabled={loading || success}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={!!formErrors.hobbyId}>
                  <InputLabel>Hobi Kategorisi</InputLabel>
                  <Select
                    name="hobbyId"
                    value={formData.hobbyId}
                    onChange={handleInputChange}
                    disabled={loading || success}
                  >
                    {hobbies.map(hobby => (
                      <MenuItem key={hobby._id} value={hobby._id}>
                        {hobby.name} ({hobby.category})
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.hobbyId && <FormHelperText>{formErrors.hobbyId}</FormHelperText>}
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, fontWeight: 'bold' }}>
                  <MapIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Etkinlik Konumu
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Etkinlik konumunu harita üzerinde mavi işaretçi ile seçin. Bu işaretçi etkinlik konumunu belirleyecektir.
                </Typography>
                <MapSelector onLocationSelect={handleLocationSelect} />
                {formErrors.coordinates && (
                  <FormHelperText error>{formErrors.coordinates}</FormHelperText>
                )}
              </Grid>
              
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Divider />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="address"
                  label="Etkinlik Adresi"
                  fullWidth
                  required
                  value={formData.address}
                  onChange={handleInputChange}
                  error={!!formErrors.address}
                  helperText={formErrors.address || 'Haritadan konum seçtiğinizde otomatik doldurulur'}
                  disabled={loading || success}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="city"
                  label="Şehir"
                  fullWidth
                  required
                  value={formData.city}
                  onChange={handleInputChange}
                  error={!!formErrors.city}
                  helperText={formErrors.city || 'Haritadan konum seçtiğinizde otomatik doldurulur'}
                  disabled={loading || success}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="maxParticipants"
                  label="Maksimum Katılımcı Sayısı"
                  type="number"
                  fullWidth
                  required
                  value={formData.maxParticipants}
                  onChange={handleInputChange}
                  error={!!formErrors.maxParticipants}
                  helperText={formErrors.maxParticipants}
                  disabled={loading || success}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <People />
                      </InputAdornment>
                    ),
                    inputProps: { min: 2 }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="price"
                  label="Ücret (TL)"
                  type="number"
                  fullWidth
                  value={formData.price}
                  onChange={handleInputChange}
                  error={!!formErrors.price}
                  helperText={formErrors.price || '0 = Ücretsiz'}
                  disabled={loading || success}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Euro />
                      </InputAdornment>
                    ),
                    inputProps: { min: 0 }
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Etiketler (İsteğe Bağlı)
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TextField
                    name="currentTag"
                    label="Etiket Ekle"
                    value={formData.currentTag}
                    onChange={handleInputChange}
                    disabled={loading || success}
                    sx={{ mr: 1 }}
                  />
                  <Button 
                    variant="outlined" 
                    onClick={handleTagAdd}
                    disabled={!formData.currentTag.trim() || loading || success}
                  >
                    Ekle
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={() => handleTagDelete(tag)}
                      disabled={loading || success}
                    />
                  ))}
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Katılım Şartları (İsteğe Bağlı)
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TextField
                    name="currentRequirement"
                    label="Şart Ekle"
                    value={formData.currentRequirement}
                    onChange={handleInputChange}
                    disabled={loading || success}
                    sx={{ mr: 1 }}
                  />
                  <Button 
                    variant="outlined" 
                    onClick={handleRequirementAdd}
                    disabled={!formData.currentRequirement.trim() || loading || success}
                  >
                    Ekle
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.requirements.map((req, index) => (
                    <Chip
                      key={index}
                      label={req}
                      onDelete={() => handleRequirementDelete(req)}
                      disabled={loading || success}
                    />
                  ))}
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="startDate"
                  label="Başlangıç Tarihi"
                  type="date"
                  fullWidth
                  required
                  value={formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : ''}
                  onChange={handleInputChange}
                  error={!!formErrors.startDate}
                  helperText={formErrors.startDate}
                  disabled={loading || success}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="startTime"
                  label="Başlangıç Saati"
                  type="time"
                  fullWidth
                  required
                  value={formData.startDate ? new Date(formData.startDate).toTimeString().slice(0, 5) : ''}
                  onChange={(e) => {
                    const timeValue = e.target.value;
                    const date = new Date(formData.startDate);
                    const [hours, minutes] = timeValue.split(':');
                    
                    // Mevcut tarihi koruyarak sadece saati güncelle
                    const newDate = new Date(date);
                    newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
                    
                    console.log(`[CreateEventForm] Başlangıç saati güncellendi:`, newDate);
                    
                    handleDateChange('startDate', newDate);
                  }}
                  disabled={loading || success}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="endDate"
                  label="Bitiş Tarihi"
                  type="date"
                  fullWidth
                  required
                  value={formData.endDate ? new Date(formData.endDate).toISOString().split('T')[0] : ''}
                  onChange={handleInputChange}
                  error={!!formErrors.endDate}
                  helperText={formErrors.endDate}
                  disabled={loading || success}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="endTime"
                  label="Bitiş Saati"
                  type="time"
                  fullWidth
                  required
                  value={formData.endDate ? new Date(formData.endDate).toTimeString().slice(0, 5) : ''}
                  onChange={(e) => {
                    const timeValue = e.target.value;
                    const date = new Date(formData.endDate);
                    const [hours, minutes] = timeValue.split(':');
                    
                    // Mevcut tarihi koruyarak sadece saati güncelle
                    const newDate = new Date(date);
                    newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
                    
                    console.log(`[CreateEventForm] Bitiş saati güncellendi:`, newDate);
                    
                    handleDateChange('endDate', newDate);
                  }}
                  disabled={loading || success}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            İptal
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={loading || success}
          >
            {loading ? <CircularProgress size={24} /> : 'Etkinliği Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
  
  // Token ve user olmadığında
  if (!user || !tokenStatus.exists) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Etkinlik Oluştur</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Etkinlik oluşturmak için lütfen giriş yapın veya kayıt olun.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Kapat</Button>
          <Button 
            color="primary" 
            variant="contained"
            onClick={() => window.location.href = '/login'}
          >
            Giriş Yap
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Yeni Etkinlik Oluştur</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, mt: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2, mt: 2 }}>
            Etkinlik başarıyla oluşturuldu! Yönlendiriliyorsunuz...
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="title"
                label="Etkinlik Başlığı"
                fullWidth
                required
                value={formData.title}
                onChange={handleInputChange}
                error={!!formErrors.title}
                helperText={formErrors.title}
                disabled={loading || success}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Etkinlik Açıklaması"
                fullWidth
                required
                multiline
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                error={!!formErrors.description}
                helperText={formErrors.description || 'En az 20 karakter olmalıdır'}
                disabled={loading || success}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!formErrors.hobbyId}>
                <InputLabel>Hobi Kategorisi</InputLabel>
                <Select
                  name="hobbyId"
                  value={formData.hobbyId}
                  onChange={handleInputChange}
                  disabled={loading || success}
                >
                  {hobbies.map(hobby => (
                    <MenuItem key={hobby._id} value={hobby._id}>
                      {hobby.name} ({hobby.category})
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.hobbyId && <FormHelperText>{formErrors.hobbyId}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, fontWeight: 'bold' }}>
                <MapIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Etkinlik Konumu
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Etkinlik konumunu harita üzerinde mavi işaretçi ile seçin. Bu işaretçi etkinlik konumunu belirleyecektir.
              </Typography>
              <MapSelector onLocationSelect={handleLocationSelect} />
              {formErrors.coordinates && (
                <FormHelperText error>{formErrors.coordinates}</FormHelperText>
              )}
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Divider />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="address"
                label="Etkinlik Adresi"
                fullWidth
                required
                value={formData.address}
                onChange={handleInputChange}
                error={!!formErrors.address}
                helperText={formErrors.address || 'Haritadan konum seçtiğinizde otomatik doldurulur'}
                disabled={loading || success}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="city"
                label="Şehir"
                fullWidth
                required
                value={formData.city}
                onChange={handleInputChange}
                error={!!formErrors.city}
                helperText={formErrors.city || 'Haritadan konum seçtiğinizde otomatik doldurulur'}
                disabled={loading || success}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="maxParticipants"
                label="Maksimum Katılımcı Sayısı"
                type="number"
                fullWidth
                required
                value={formData.maxParticipants}
                onChange={handleInputChange}
                error={!!formErrors.maxParticipants}
                helperText={formErrors.maxParticipants}
                disabled={loading || success}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <People />
                    </InputAdornment>
                  ),
                  inputProps: { min: 2 }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="price"
                label="Ücret (TL)"
                type="number"
                fullWidth
                value={formData.price}
                onChange={handleInputChange}
                error={!!formErrors.price}
                helperText={formErrors.price || '0 = Ücretsiz'}
                disabled={loading || success}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Euro />
                    </InputAdornment>
                  ),
                  inputProps: { min: 0 }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Etiketler (İsteğe Bağlı)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TextField
                  name="currentTag"
                  label="Etiket Ekle"
                  value={formData.currentTag}
                  onChange={handleInputChange}
                  disabled={loading || success}
                  sx={{ mr: 1 }}
                />
                <Button 
                  variant="outlined" 
                  onClick={handleTagAdd}
                  disabled={!formData.currentTag.trim() || loading || success}
                >
                  Ekle
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => handleTagDelete(tag)}
                    disabled={loading || success}
                  />
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Katılım Şartları (İsteğe Bağlı)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TextField
                  name="currentRequirement"
                  label="Şart Ekle"
                  value={formData.currentRequirement}
                  onChange={handleInputChange}
                  disabled={loading || success}
                  sx={{ mr: 1 }}
                />
                <Button 
                  variant="outlined" 
                  onClick={handleRequirementAdd}
                  disabled={!formData.currentRequirement.trim() || loading || success}
                >
                  Ekle
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.requirements.map((req, index) => (
                  <Chip
                    key={index}
                    label={req}
                    onDelete={() => handleRequirementDelete(req)}
                    disabled={loading || success}
                  />
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="startDate"
                label="Başlangıç Tarihi"
                type="date"
                fullWidth
                required
                value={formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : ''}
                onChange={handleInputChange}
                error={!!formErrors.startDate}
                helperText={formErrors.startDate}
                disabled={loading || success}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="startTime"
                label="Başlangıç Saati"
                type="time"
                fullWidth
                required
                value={formData.startDate ? new Date(formData.startDate).toTimeString().slice(0, 5) : ''}
                onChange={(e) => {
                  const timeValue = e.target.value;
                  const date = new Date(formData.startDate);
                  const [hours, minutes] = timeValue.split(':');
                  
                  // Mevcut tarihi koruyarak sadece saati güncelle
                  const newDate = new Date(date);
                  newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
                  
                  console.log(`[CreateEventForm] Başlangıç saati güncellendi:`, newDate);
                  
                  handleDateChange('startDate', newDate);
                }}
                disabled={loading || success}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="endDate"
                label="Bitiş Tarihi"
                type="date"
                fullWidth
                required
                value={formData.endDate ? new Date(formData.endDate).toISOString().split('T')[0] : ''}
                onChange={handleInputChange}
                error={!!formErrors.endDate}
                helperText={formErrors.endDate}
                disabled={loading || success}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="endTime"
                label="Bitiş Saati"
                type="time"
                fullWidth
                required
                value={formData.endDate ? new Date(formData.endDate).toTimeString().slice(0, 5) : ''}
                onChange={(e) => {
                  const timeValue = e.target.value;
                  const date = new Date(formData.endDate);
                  const [hours, minutes] = timeValue.split(':');
                  
                  // Mevcut tarihi koruyarak sadece saati güncelle
                  const newDate = new Date(date);
                  newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
                  
                  console.log(`[CreateEventForm] Bitiş saati güncellendi:`, newDate);
                  
                  handleDateChange('endDate', newDate);
                }}
                disabled={loading || success}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          İptal
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading || success}
        >
          {loading ? <CircularProgress size={24} /> : 'Etkinliği Oluştur'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateEventForm; 