import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Alert, 
  CircularProgress 
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useForm } from 'react-hook-form';
import { changePassword } from '../../services/userService';

const ChangePasswordForm = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const { 
    register, 
    handleSubmit, 
    reset, 
    formState: { errors },
    watch
  } = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });
  
  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const passwordData = {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      };
      
      const response = await changePassword(passwordData);
      
      if (response.success) {
        setSuccess(true);
        reset();
      } else {
        setError(response.message || 'Şifre değiştirilemedi.');
      }
    } catch (error) {
      setError(error.message || 'Şifre değiştirme işlemi sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card sx={{ borderRadius: 2, boxShadow: 3, mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <LockIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight="medium">
            Şifre Değiştir
          </Typography>
        </Box>
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Şifreniz başarıyla değiştirildi.
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            label="Mevcut Şifre"
            type="password"
            fullWidth
            margin="normal"
            {...register('currentPassword', { 
              required: 'Mevcut şifrenizi girmelisiniz'
            })}
            error={!!errors.currentPassword}
            helperText={errors.currentPassword?.message}
            disabled={loading}
          />
          
          <TextField
            label="Yeni Şifre"
            type="password"
            fullWidth
            margin="normal"
            {...register('newPassword', { 
              required: 'Yeni şifre girmelisiniz',
              minLength: {
                value: 6,
                message: 'Şifre en az 6 karakter olmalıdır'
              },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/,
                message: 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir'
              }
            })}
            error={!!errors.newPassword}
            helperText={errors.newPassword?.message}
            disabled={loading}
          />
          
          <TextField
            label="Yeni Şifre (Tekrar)"
            type="password"
            fullWidth
            margin="normal"
            {...register('confirmPassword', { 
              required: 'Şifreyi tekrar girmelisiniz',
              validate: value => value === watch('newPassword') || 'Şifreler eşleşmiyor'
            })}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
            disabled={loading}
          />
          
          <Box sx={{ mt: 2, textAlign: 'right' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Şifreyi Değiştir'}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};

export default ChangePasswordForm; 