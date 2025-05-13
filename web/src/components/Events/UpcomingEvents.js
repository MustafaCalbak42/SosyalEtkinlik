import React from 'react';
import { 
  Box, 
  Typography, 
  Divider, 
  Avatar
} from '@mui/material';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { AccessTime, LocationOn } from '@mui/icons-material';

const UpcomingEvents = ({ events = [] }) => {
  if (events.length === 0) {
    return (
      <Box sx={{ py: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Henüz yaklaşan etkinlik bulunmuyor.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {events.map((event, index) => {
        const eventDate = new Date(event.date);
        const formattedDate = format(eventDate, 'd MMM', { locale: tr });
        const formattedTime = format(eventDate, 'HH:mm');
        
        return (
          <Box key={event.id}>
            <Box sx={{ display: 'flex', py: 1.5 }}>
              <Avatar 
                src={event.image} 
                variant="rounded"
                sx={{ width: 48, height: 48, mr: 1.5 }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" noWrap fontWeight="bold">
                  {event.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <AccessTime fontSize="small" color="action" sx={{ fontSize: 14, mr: 0.5 }} />
                  <Typography variant="caption" color="text.secondary">
                    {formattedDate} • {formattedTime}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <LocationOn fontSize="small" color="action" sx={{ fontSize: 14, mr: 0.5 }} />
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {event.location}
                  </Typography>
                </Box>
              </Box>
            </Box>
            {index < events.length - 1 && <Divider />}
          </Box>
        );
      })}
    </Box>
  );
};

export default UpcomingEvents; 