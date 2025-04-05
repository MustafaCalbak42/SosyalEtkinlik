import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Avatar, 
  Box, 
  Button, 
  Chip, 
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EditIcon from '@mui/icons-material/Edit';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../context/AuthContext';
import { updateUserProfile } from '../../services/userService';

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  marginBottom: theme.spacing(2),
  border: `4px solid ${theme.palette.background.paper}`,
  boxShadow: theme.shadows[3]
}));

const ProfileCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[3],
  marginBottom: theme.spacing(3)
}));

const ProfileInfo = ({ profile, onProfileUpdate }) => {
  const { user } = useAuth();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: profile?.fullName || '',
    bio: profile?.bio || '',
    interests: profile?.interests?.join(', ') || ''
  });
  const [errors, setErrors] = useState({});

  const isCurrentUser = user?._id === profile?._id;

  const handleOpenEditDialog = () => {
    setFormData({
      fullName: profile?.fullName || '',
      bio: profile?.bio || '',
      interests: profile?.interests?.join(', ') || ''
    });
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName || formData.fullName.length < 3) {
      newErrors.fullName = 'Ad Soyad en az 3 karakter olmalıdır';
    }
    
    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Biyografi en fazla 500 karakter olabilir';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      // İlgi alanlarını diziye dönüştür
      const interests = formData.interests
        ? formData.interests.split(',').map(item => item.trim()).filter(Boolean)
        : [];
      
      const updatedData = {
        fullName: formData.fullName,
        bio: formData.bio,
        interests
      };
      
      const response = await updateUserProfile(updatedData);
      
      if (response.success) {
        onProfileUpdate(response.data);
        handleCloseEditDialog();
      }
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      // Hata mesajını gösterebilirsiniz
    }
  };
  
  if (!profile) {
    return (
      <ProfileCard>
        <CardContent>
          <Typography variant="body1">Profil yükleniyor...</Typography>
        </CardContent>
      </ProfileCard>
    );
  }

  return (
    <>
      <ProfileCard>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <ProfileAvatar 
              src={profile.profilePicture || "/assets/default-profile.png"} 
              alt={profile.fullName}
            />
            <Typography variant="h5" fontWeight="bold">
              {profile.fullName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              @{profile.username}
            </Typography>
            {profile.location?.address && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <LocationOnIcon color="primary" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  {profile.location.address}
                </Typography>
              </Box>
            )}
          </Box>
          
          {isCurrentUser && (
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Button 
                variant="outlined" 
                startIcon={<EditIcon />}
                onClick={handleOpenEditDialog}
              >
                Profili Düzenle
              </Button>
            </Box>
          )}
          
          <Divider sx={{ mb: 2 }} />
          
          <Typography variant="h6" fontWeight="medium" sx={{ mb: 1 }}>
            Hakkında
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {profile.bio || "Henüz bir biyografi eklenmemiş."}
          </Typography>
          
          {profile.interests && profile.interests.length > 0 && (
            <>
              <Typography variant="h6" fontWeight="medium" sx={{ mb: 1, mt: 2 }}>
                İlgi Alanları
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {profile.interests.map((interest, index) => (
                  <Chip 
                    key={index} 
                    label={interest} 
                    color="primary" 
                    variant="outlined" 
                    size="small" 
                  />
                ))}
              </Box>
            </>
          )}
        </CardContent>
      </ProfileCard>

      {/* Profil Düzenleme Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={handleCloseEditDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Profili Düzenle</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="fullName"
                label="Ad Soyad"
                value={formData.fullName}
                onChange={handleInputChange}
                fullWidth
                error={!!errors.fullName}
                helperText={errors.fullName}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="bio"
                label="Biyografi"
                value={formData.bio}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={4}
                error={!!errors.bio}
                helperText={errors.bio || "En fazla 500 karakter"}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="interests"
                label="İlgi Alanları"
                value={formData.interests}
                onChange={handleInputChange}
                fullWidth
                helperText="Virgülle ayırarak birden fazla ilgi alanı ekleyebilirsiniz"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>İptal</Button>
          <Button onClick={handleSubmit} variant="contained">Kaydet</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProfileInfo; 