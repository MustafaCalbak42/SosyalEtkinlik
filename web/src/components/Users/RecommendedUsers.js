import React from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  Button, 
  Divider, 
  Chip
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';

// Mock data for recommended users
const mockUsers = [
  {
    id: 1,
    name: 'Ahmet Yılmaz',
    username: 'ahmetyilmaz',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    mutualInterests: ['Müzik', 'Doğa'],
    mutualEventCount: 2
  },
  {
    id: 2,
    name: 'Ayşe Demir',
    username: 'aysedemir',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    mutualInterests: ['Spor', 'Teknoloji'],
    mutualEventCount: 1
  },
  {
    id: 3,
    name: 'Mehmet Kaya',
    username: 'mehmetkaya',
    avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
    mutualInterests: ['Yemek', 'Seyahat', 'Müzik'],
    mutualEventCount: 3
  }
];

const RecommendedUsers = () => {
  return (
    <Box>
      {mockUsers.map((user, index) => (
        <Box key={user.id}>
          <Box sx={{ py: 1.5 }}>
            <Box sx={{ display: 'flex', mb: 1 }}>
              <Avatar 
                src={user.avatar} 
                alt={user.name}
                sx={{ width: 40, height: 40, mr: 1.5 }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {user.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  @{user.username}
                </Typography>
              </Box>
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<PersonAdd />}
                sx={{ 
                  height: 32,
                  minWidth: 'auto',
                  borderRadius: 16
                }}
              >
                Takip Et
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5, ml: 0.5 }}>
              {user.mutualInterests.map(interest => (
                <Chip 
                  key={interest} 
                  label={interest} 
                  size="small"
                  variant="outlined" 
                  sx={{ 
                    height: 24,
                    '& .MuiChip-label': {
                      px: 1,
                      fontSize: '0.7rem'
                    }
                  }} 
                />
              ))}
              <Typography variant="caption" sx={{ ml: 0.5 }}>
                ortak ilgi
              </Typography>
            </Box>
            
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, ml: 0.5 }}>
              {user.mutualEventCount} ortak etkinliğe katıldı
            </Typography>
          </Box>
          {index < mockUsers.length - 1 && <Divider />}
        </Box>
      ))}
    </Box>
  );
};

export default RecommendedUsers; 