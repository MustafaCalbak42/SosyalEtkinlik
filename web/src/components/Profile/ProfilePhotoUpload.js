import React, { useState, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Button, 
  Avatar, 
  Alert, 
  CircularProgress,
  IconButton
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import DeleteIcon from '@mui/icons-material/Delete';
import { styled } from '@mui/material/styles';
import { uploadProfilePicture } from '../../services/userService';

const Input = styled('input')({
  display: 'none',
});

const LargeAvatar = styled(Avatar)(({ theme }) => ({
  width: 150,
  height: 150,
  margin: 'auto',
  marginBottom: theme.spacing(2),
  boxShadow: theme.shadows[3],
  border: `4px solid ${theme.palette.background.paper}`
}));

const ProfilePhotoUpload = ({ profile, setProfile }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);
  
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    
    if (!file) {
      return;
    }
    
    // Dosya tipini kontrol et
    if (!file.type.startsWith('image/')) {
      setError('Lütfen geçerli bir resim dosyası seçin (jpeg, png, gif vb.)');
      return;
    }
    
    // Dosya boyutunu kontrol et (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Dosya boyutu 5MB\'den küçük olmalıdır');
      return;
    }
    
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  };
  
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Lütfen bir resim dosyası seçin');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const formData = new FormData();
      formData.append('profilePicture', selectedFile);
      
      const response = await uploadProfilePicture(formData);
      
      if (response.success) {
        setSuccess(true);
        setProfile(response.data);
        
        // Önizleme URL'ini temizle
        URL.revokeObjectURL(previewUrl);
        setSelectedFile(null);
        setPreviewUrl(null);
      } else {
        setError(response.message || 'Profil fotoğrafı yüklenemedi');
      }
    } catch (error) {
      setError(error.message || 'Profil fotoğrafı yükleme işlemi sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
  };
  
  const handleTriggerFileInput = () => {
    fileInputRef.current.click();
  };
  
  return (
    <Card sx={{ borderRadius: 2, boxShadow: 3, mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PhotoCameraIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight="medium">
            Profil Fotoğrafı
          </Typography>
        </Box>
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Profil fotoğrafınız başarıyla güncellendi.
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
          <Box sx={{ position: 'relative' }}>
            <LargeAvatar 
              src={previewUrl || (profile?.profilePicture ? `http://localhost:5000/${profile.profilePicture}` : "/assets/default-profile.png")} 
              alt={profile?.fullName}
            />
            <IconButton 
              sx={{ 
                position: 'absolute', 
                bottom: 0, 
                right: 0, 
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                color: 'white' 
              }}
              onClick={handleTriggerFileInput}
            >
              <AddAPhotoIcon />
            </IconButton>
          </Box>
          
          <Input
            ref={fileInputRef}
            accept="image/*"
            id="profile-photo-upload"
            type="file"
            onChange={handleFileChange}
          />
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2, textAlign: 'center' }}>
            JPEG, PNG veya GIF formatında,
            <br />
            en fazla 5MB boyutunda dosya yükleyebilirsiniz.
          </Typography>
          
          {selectedFile && (
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleUpload}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Yükleniyor...' : 'Fotoğrafı Kaydet'}
              </Button>
              
              <Button
                variant="outlined"
                color="error"
                onClick={handleCancel}
                disabled={loading}
                startIcon={<DeleteIcon />}
              >
                İptal
              </Button>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProfilePhotoUpload; 