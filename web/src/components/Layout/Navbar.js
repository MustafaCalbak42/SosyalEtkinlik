import React, { useState } from 'react';
import { 
  AppBar, 
  Box, 
  Toolbar, 
  IconButton, 
  Typography, 
  Menu, 
  Container, 
  Avatar, 
  Button, 
  Tooltip, 
  MenuItem,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { 
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Mail as MailIcon,
  Dashboard as DashboardIcon,
  AccountCircle,
  EventNote,
  Settings,
  Logout,
  Login,
  PersonAdd,
  LocationOn
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  // Demo mode - auth state is mocked to always be authenticated
  // const { user, isAuthenticated, logout } = useAuth() || { isAuthenticated: false };
  const isAuthenticated = true; // Always authenticated for demo
  const user = { 
    profilePhoto: 'https://randomuser.me/api/portraits/men/32.jpg',
    name: 'Demo User'
  };
  const navigate = useNavigate();
  
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleOpenNotifications = (event) => {
    setAnchorElNotifications(event.currentTarget);
  };

  const handleCloseNotifications = () => {
    setAnchorElNotifications(null);
  };

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleLogout = () => {
    // logout();
    navigate('/login');
    handleCloseUserMenu();
  };

  const drawerItems = [
    { text: 'Ana Sayfa', icon: <DashboardIcon />, path: '/' },
    { text: 'Etkinlikler', icon: <EventNote />, path: '/events' },
    { text: 'Yakınımda', icon: <LocationOn />, path: '/nearby' },
    { text: 'Mesajlar', icon: <MailIcon />, path: '/messages' },
  ];

  const authItems = isAuthenticated 
    ? [
        { text: 'Profilim', icon: <AccountCircle />, action: () => navigate('/profile') },
        { text: 'Ayarlar', icon: <Settings />, action: () => navigate('/profile/settings') },
        { text: 'Çıkış Yap', icon: <Logout />, action: handleLogout }
      ]
    : [
        { text: 'Giriş Yap', icon: <Login />, action: () => navigate('/login') },
        { text: 'Kaydol', icon: <PersonAdd />, action: () => navigate('/register') }
      ];

  return (
    <AppBar position="sticky">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2, display: { xs: 'flex', md: 'none' } }}
            onClick={toggleDrawer(true)}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography
            variant="h6"
            noWrap
            component={Link}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'flex' },
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            SosyalEtkinlik
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {drawerItems.map((item) => (
              <Button
                key={item.text}
                component={Link}
                to={item.path}
                sx={{ color: 'white', display: 'flex', mx: 1 }}
                startIcon={item.icon}
              >
                {item.text}
              </Button>
            ))}
          </Box>

          <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center' }}>
            {isAuthenticated && (
              <>
                <Tooltip title="Bildirimler">
                  <IconButton onClick={handleOpenNotifications} sx={{ ml: 1, color: 'white' }}>
                    <Badge badgeContent={4} color="error">
                      <NotificationsIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Mesajlar">
                  <IconButton component={Link} to="/messages" sx={{ ml: 1, color: 'white' }}>
                    <Badge badgeContent={2} color="error">
                      <MailIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>
                
                <Menu
                  anchorEl={anchorElNotifications}
                  open={Boolean(anchorElNotifications)}
                  onClose={handleCloseNotifications}
                  sx={{ mt: '45px' }}
                >
                  <MenuItem>
                    <Typography>Ali etkinliğinize katıldı</Typography>
                  </MenuItem>
                  <MenuItem>
                    <Typography>Müzik etkinliğiniz 2 gün sonra</Typography>
                  </MenuItem>
                  <MenuItem>
                    <Typography>Ayşe size mesaj gönderdi</Typography>
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleCloseNotifications}>
                    <Typography color="primary">Tüm bildirimleri gör</Typography>
                  </MenuItem>
                </Menu>
              </>
            )}
            
            <Tooltip title={isAuthenticated ? "Profil" : "Giriş"}>
              <IconButton onClick={handleOpenUserMenu} sx={{ ml: 1.5 }}>
                {isAuthenticated ? (
                  <Avatar src={user?.profilePhoto || "/static/images/avatar/1.jpg"} />
                ) : (
                  <Avatar sx={{ bgcolor: '#1565c0' }}><AccountCircle /></Avatar>
                )}
              </IconButton>
            </Tooltip>
            
            <Menu
              anchorEl={anchorElUser}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
              sx={{ mt: '45px' }}
            >
              {authItems.map((item) => (
                <MenuItem key={item.text} onClick={() => {
                  item.action();
                  handleCloseUserMenu();
                }}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <Typography textAlign="center">{item.text}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
      
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={toggleDrawer(false)}
          onKeyDown={toggleDrawer(false)}
        >
          <List>
            <ListItem>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, my: 1 }}
              >
                SosyalEtkinlik
              </Typography>
            </ListItem>
            <Divider />
            {drawerItems.map((item) => (
              <ListItem button key={item.text} component={Link} to={item.path}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
            <Divider />
            {authItems.map((item) => (
              <ListItem 
                button 
                key={item.text} 
                onClick={item.action}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default Navbar; 