import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container, Box, Avatar, Menu, MenuItem, IconButton, Badge } from '@mui/material';
import { AccountCircle, Chat, Home, Logout, Settings } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const MainLayout = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);
  
  // Debug için oturum durumunu kontrol et
  useEffect(() => {
    console.log('MainLayout Auth State:', { user, isAuthenticated, token: localStorage.getItem('token') });
  }, [user, isAuthenticated]);
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Çıkış yapılırken hata:', error);
    }
  };
  
  const handleMenuItemClick = (path) => {
    handleClose();
    navigate(path);
  };
  
  // Token var mı kontrol et (yedek kontrol)
  const hasToken = !!localStorage.getItem('token');
  
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'white' }}>
            Sosyal Etkinlik
          </Typography>
          
          {(isAuthenticated || hasToken) ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button 
                component={Link} 
                to="/" 
                color="inherit"
                startIcon={<Home />}
                sx={{ 
                  mr: 1,
                  backgroundColor: location.pathname === '/' ? 'rgba(255,255,255,0.2)' : 'transparent'
                }}
              >
                Ana Sayfa
              </Button>
              
              <Button 
                component={Link} 
                to="/messages" 
                color="inherit"
                startIcon={<Chat />}
                sx={{ 
                  mr: 1,
                  backgroundColor: location.pathname === '/messages' ? 'rgba(255,255,255,0.2)' : 'transparent'
                }}
              >
                Mesajlar
              </Button>
              
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                {user?.profilePicture ? (
                  <Avatar 
                    src={`http://localhost:5000/${user.profilePicture}`}
                    alt={user?.fullName} 
                    sx={{ width: 32, height: 32 }}
                  />
                ) : (
                  <AccountCircle />
                )}
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={() => handleMenuItemClick('/profile')}>
                  <AccountCircle fontSize="small" sx={{ mr: 1 }} />
                  Profilim
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <Logout fontSize="small" sx={{ mr: 1 }} />
                  Çıkış Yap
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Box>
              <Button component={Link} to="/login" color="inherit">Giriş Yap</Button>
              <Button component={Link} to="/register" color="inherit">Kayıt Ol</Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      
      <Container component="main" sx={{ py: 4 }}>
        {children}
      </Container>
    </>
  );
};

export default MainLayout; 