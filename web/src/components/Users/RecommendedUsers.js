import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  Button, 
  Divider, 
  Chip,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import { Person, Info } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { getSimilarUsers } from '../../services/userService';
import { useNavigate } from 'react-router-dom';

const RecommendedUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      fetchSimilarUsers();
    }
  }, [isAuthenticated]);

  const fetchSimilarUsers = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await getSimilarUsers(1, 5);
      if (response.success) {
        setUsers(response.data);
        console.log(`[RecommendedUsers] ${response.data.length} benzer kullanıcı yüklendi`);
      } else {
        setError(response.message || 'Benzer kullanıcılar yüklenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Benzer kullanıcıları yüklerken hata:', error);
      setError('Benzer kullanıcılar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Giriş yapılmamışsa bilgi mesajı göster
  if (!isAuthenticated) {
    return (
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Sizinle aynı hobilere sahip kullanıcıları görmek için <Button 
            variant="outlined" 
            size="small" 
            color="primary"
            sx={{ ml: 1 }}
            onClick={() => navigate('/login')}
          >
            Giriş Yapın
          </Button>
        </Alert>
      </Paper>
    );
  }

  // Yükleme durumu
  if (loading) {
    return (
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ ml: 2, mt: 0.5 }}>
            Benzer kullanıcılar yükleniyor...
          </Typography>
        </Box>
      </Paper>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          <Button 
            variant="outlined" 
            size="small" 
            color="primary"
            sx={{ mt: 1, ml: 1 }}
            onClick={fetchSimilarUsers}
          >
            Tekrar Dene
          </Button>
        </Alert>
      </Paper>
    );
  }

  // Kullanıcı yoksa
  if (users.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Box sx={{ py: 2, textAlign: 'center' }}>
          <Person sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Sizinle aynı hobilere sahip kullanıcı bulunamadı.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Profilinizde hobi bilgilerinizi ekleyerek benzer kullanıcıları keşfedebilirsiniz.
          </Typography>
        </Box>
      </Paper>
    );
  }

  // Kullanıcı profil resmi için initials oluştur
  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  // Kullanıcı profiline git
  const handleUserClick = (username) => {
    navigate(`/profile/${username}`);
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
      {users.map((user, index) => (
        <Box key={user._id || user.id}>
          <Box sx={{ py: 1.5 }}>
            <Box 
              sx={{ 
                display: 'flex', 
                mb: 1,
                cursor: 'pointer',
                borderRadius: 1,
                p: 1,
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
              onClick={() => handleUserClick(user.username)}
            >
              <Avatar 
                src={user.profilePicture} 
                alt={user.fullName || user.username}
                sx={{ width: 40, height: 40, mr: 1.5, bgcolor: 'primary.main' }}
              >
                {!user.profilePicture && getInitials(user.fullName || user.username)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {user.fullName || user.username}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  @{user.username}
                </Typography>
                {user.bio && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {user.bio.length > 50 ? `${user.bio.substring(0, 50)}...` : user.bio}
                  </Typography>
                )}
              </Box>
            </Box>
            
            {/* Ortak hobiler */}
            {user.commonHobbies && user.commonHobbies.length > 0 && (
              <Box sx={{ ml: 6 }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'success.main', display: 'block', mb: 0.5 }}>
                  {user.commonHobbiesCount || user.commonHobbies.length} ortak hobi:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                  {user.commonHobbies.map(hobby => (
                    <Chip 
                      key={hobby._id || hobby.name} 
                      label={hobby.name || hobby} 
                      size="small"
                      variant="filled" 
                      color="success"
                      sx={{ 
                        height: 24,
                        '& .MuiChip-label': {
                          px: 1,
                          fontSize: '0.7rem'
                        }
                      }} 
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
          {index < users.length - 1 && <Divider />}
        </Box>
      ))}
    </Paper>
  );
};

export default RecommendedUsers; 