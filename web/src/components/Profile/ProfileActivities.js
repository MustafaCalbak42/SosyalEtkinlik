import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Tabs, 
  Tab, 
  List, 
  ListItem, 
  ListItemAvatar, 
  Avatar, 
  ListItemText,
  Divider,
  Button
} from '@mui/material';
import { styled } from '@mui/material/styles';
import EventIcon from '@mui/icons-material/Event';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const ActivityCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[3],
  marginBottom: theme.spacing(3)
}));

const ProfileActivities = ({ events = [], participatedEvents = [], followers = [], following = [], isCurrentUser }) => {
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const renderEvents = (eventList, isParticipant = false) => {
    if (!eventList || eventList.length === 0) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {isParticipant ? 'Henüz katılınan etkinlik bulunmuyor.' : 'Henüz düzenlenen etkinlik bulunmuyor.'}
          </Typography>
        </Box>
      );
    }

    return (
      <List>
        {eventList.map((event, index) => (
          <React.Fragment key={event._id || index}>
            <ListItem alignItems="flex-start" component={Link} to={`/events/${event._id}`} sx={{ textDecoration: 'none', color: 'inherit' }}>
              <ListItemAvatar>
                <Avatar>
                  <EventIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={event.title}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="text.primary">
                      {event.location?.address || 'Konum belirtilmemiş'}
                    </Typography>
                    {' — '}
                    {event.date && format(new Date(event.date), 'PPP', { locale: tr })}
                  </>
                }
              />
            </ListItem>
            {index < eventList.length - 1 && <Divider variant="inset" component="li" />}
          </React.Fragment>
        ))}
      </List>
    );
  };

  const renderUsers = (userList, title) => {
    if (!userList || userList.length === 0) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {title === 'Takipçiler' ? 'Henüz takipçi bulunmuyor.' : 'Henüz takip edilen kullanıcı bulunmuyor.'}
          </Typography>
        </Box>
      );
    }

    return (
      <List>
        {userList.map((user, index) => (
          <React.Fragment key={user._id || index}>
            <ListItem alignItems="flex-start" component={Link} to={`/profile/${user.username}`} sx={{ textDecoration: 'none', color: 'inherit' }}>
              <ListItemAvatar>
                <Avatar src={user.profilePicture || "/assets/default-profile.png"} alt={user.fullName} />
              </ListItemAvatar>
              <ListItemText
                primary={user.fullName}
                secondary={`@${user.username}`}
              />
            </ListItem>
            {index < userList.length - 1 && <Divider variant="inset" component="li" />}
          </React.Fragment>
        ))}
      </List>
    );
  };

  return (
    <ActivityCard>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Etkinliklerim" />
          <Tab label="Katıldıklarım" />
          <Tab label={`Takipçiler (${followers.length})`} />
          <Tab label={`Takip Edilenler (${following.length})`} />
        </Tabs>
      </Box>
      
      <CardContent>
        {tabValue === 0 && (
          <>
            {renderEvents(events)}
            {isCurrentUser && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<EventIcon />}
                  component={Link}
                  to="/create-event"
                >
                  Yeni Etkinlik Oluştur
                </Button>
              </Box>
            )}
          </>
        )}
        
        {tabValue === 1 && renderEvents(participatedEvents, true)}
        
        {tabValue === 2 && renderUsers(followers, 'Takipçiler')}
        
        {tabValue === 3 && renderUsers(following, 'Takip Edilenler')}
      </CardContent>
    </ActivityCard>
  );
};

export default ProfileActivities; 