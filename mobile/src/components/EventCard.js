import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const EventCard = ({ event }) => {
  const navigation = useNavigation();
  
  // Function to get category icon
  const getCategoryIcon = (category) => {
    const icons = {
      'Sports': 'basketball',
      'Art': 'palette',
      'Music': 'music',
      'Food': 'food',
      'Technology': 'laptop',
      'Education': 'school',
      'Travel': 'airplane',
      'Dance': 'dance-ballroom',
      'Nature': 'nature',
      'Others': 'dots-horizontal-circle'
    };
    
    return icons[category] || 'calendar';
  };
  
  // Format date with native JavaScript
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const day = date.getDate();
    
    // Get hours in 12-hour format
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    // Get minutes with leading zero if needed
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${dayName}, ${monthName} ${day} • ${hours}:${minutes} ${ampm}`;
  };
  
  // Format location data
  const formatLocation = (location) => {
    // Eğer location bir string ise direkt kullan
    if (typeof location === 'string') {
      return location;
    }
    
    // Eğer location bir nesne ise address kısmını kullan
    if (location && typeof location === 'object') {
      if (location.address) {
        return location.address;
      }
      // Coordinates varsa ve address yoksa
      if (location.coordinates && Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
        return `${location.coordinates[1]}, ${location.coordinates[0]}`;
      }
    }
    
    // Hiçbir format uygun değilse
    return 'Konum belirtilmemiş';
  };
  
  // Katılımcı sayısını güvenli şekilde hesapla
  const getAttendeeCount = () => {
    if (event.attendees && Array.isArray(event.attendees)) {
      return event.attendees.length;
    }
    if (event.participants && Array.isArray(event.participants)) {
      return event.participants.length;
    }
    return 0;
  };
  
  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('EventDetail', { eventId: event._id })}
    >
      {/* Event Image */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: event.image || 'https://via.placeholder.com/300x200?text=Event' }} 
          style={styles.image} 
          resizeMode="cover"
        />
        
        {/* Category Badge */}
        <View style={styles.categoryBadge}>
          <Icon name={getCategoryIcon(event.category)} size={14} color="#fff" />
          <Text style={styles.categoryText}>{event.category}</Text>
        </View>
      </View>
      
      {/* Event Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
        
        <View style={styles.detailItem}>
          <Icon name="clock-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {formatDate(event.startDate)}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Icon name="map-marker" size={16} color="#666" />
          <Text style={styles.detailText} numberOfLines={1}>
            {formatLocation(event.location)}
          </Text>
        </View>
        
        <View style={styles.footer}>
          <View style={styles.attendeesInfo}>
            <Icon name="account-group" size={16} color="#666" />
            <Text style={styles.attendeesText}>
              {getAttendeeCount()} attending
            </Text>
          </View>
          
          <TouchableOpacity style={styles.joinButton}>
            <Text style={styles.joinButtonText}>Join</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 160,
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#3f51b5',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  infoContainer: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  attendeesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeesText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  joinButton: {
    backgroundColor: '#3f51b5',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
});

export default EventCard; 