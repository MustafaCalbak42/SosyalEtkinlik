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
import { useAuth } from '../contexts/AuthContext';

const EventCard = ({ event }) => {
  const navigation = useNavigation();
  const auth = useAuth(); // AuthContext'i kullan
  
  // Function to get category icon
  const getCategoryIcon = (category) => {
    // Kategori değerini güvenli şekilde al
    const categoryName = (event.hobby?.name || event.category || event.hobbyName || '').toLowerCase();
    
    const icons = {
      'sports': 'basketball',
      'spor': 'basketball',
      'art': 'palette',
      'sanat': 'palette',
      'music': 'music',
      'müzik': 'music',
      'food': 'food',
      'yemek': 'food',
      'technology': 'laptop',
      'teknoloji': 'laptop',
      'education': 'school',
      'eğitim': 'school',
      'travel': 'airplane',
      'seyahat': 'airplane',
      'dance': 'dance-ballroom',
      'dans': 'dance-ballroom',
      'nature': 'nature',
      'doğa': 'nature',
      'others': 'dots-horizontal-circle',
      'diğer': 'dots-horizontal-circle'
    };
    
    return icons[categoryName] || 'calendar';
  };
  
  // Etkinlik için kategori ve içeriğe göre görsel URL'si belirle
  const getEventImage = (event) => {
    try {
      // Önce etkinliğin kendi görselini kontrol et
      if (event.image) {
        return event.image;
      }
      
      // Etkinliğin kategorisini al
      const category = event.hobby?.category || event.category || '';
      
      // Etkinlik başlığı ve açıklamasını küçük harfe çevir
      const title = (event.title || '').toLowerCase();
      const description = (event.description || '').toLowerCase();
      const hobbyName = event.hobby?.name ? event.hobby.name.toLowerCase() : '';
      
      // Tüm içeriği birleştirerek daha güçlü bir arama yap
      const allContent = `${title} ${description} ${hobbyName}`;
      
      // Kategori bazlı varsayılan görseller
      const categoryImages = {
        'müzik': 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'spor': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'sanat': 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'dans': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'yemek': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'seyahat': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'teknoloji': 'https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'doğa': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'eğitim': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'diğer': 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
      };
      
      // Kategori alt türleri için anahtar kelimeler ve görsel URL'leri
      const keywordMap = {
        // Spor alt türleri
        'futbol': 'https://images.unsplash.com/photo-1560272564-c83b665fa177?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'soccer': 'https://images.unsplash.com/photo-1560272564-c83b665fa177?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'football': 'https://images.unsplash.com/photo-1560272564-c83b665fa177?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'basketbol': 'https://images.unsplash.com/photo-1518650868956-c1098117c4ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'basketball': 'https://images.unsplash.com/photo-1518650868956-c1098117c4ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'tenis': 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'tennis': 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'voleybol': 'https://images.unsplash.com/photo-1592656094261-c49cafc9a48f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'volleyball': 'https://images.unsplash.com/photo-1592656094261-c49cafc9a48f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'yüzme': 'https://images.unsplash.com/photo-1560089000-7433a4ebbd64?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'swimming': 'https://images.unsplash.com/photo-1560089000-7433a4ebbd64?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'koşu': 'https://images.unsplash.com/photo-1487956382158-bb926046304a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'running': 'https://images.unsplash.com/photo-1487956382158-bb926046304a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'yoga': 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        
        // Müzik alt türleri
        'gitar': 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'guitar': 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'piyano': 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'piano': 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'konser': 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'concert': 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'rock': 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'jazz': 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        
        // Sanat alt türleri
        'resim': 'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'painting': 'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'fotoğraf': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'photography': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'sergi': 'https://images.unsplash.com/photo-1563349441-5ccf8952dca2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'exhibition': 'https://images.unsplash.com/photo-1563349441-5ccf8952dca2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        
        // Dans alt türleri
        'bale': 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'ballet': 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'salsa': 'https://images.unsplash.com/photo-1504609813442-a9c278baf893?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'tango': 'https://images.unsplash.com/photo-1516666248405-9737546ccea8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        
        // Yemek alt türleri
        'pasta': 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'kahve': 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'coffee': 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'sushi': 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        
        // Seyahat alt türleri
        'istanbul': 'https://images.unsplash.com/photo-1527838832700-5059252407fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'kapadokya': 'https://images.unsplash.com/photo-1570856033163-05f258ec9481?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'cappadocia': 'https://images.unsplash.com/photo-1570856033163-05f258ec9481?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'paris': 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'kamp': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'camping': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        
        // Teknoloji alt türleri
        'yazılım': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'software': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'yapay zeka': 'https://images.unsplash.com/photo-1507146153580-69a1fe6d8aa1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'artificial intelligence': 'https://images.unsplash.com/photo-1507146153580-69a1fe6d8aa1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'robotik': 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'robotics': 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        
        // Doğa alt türleri
        'dağ': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'mountain': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'deniz': 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'sea': 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'orman': 'https://images.unsplash.com/photo-1448375240586-882707db888b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'forest': 'https://images.unsplash.com/photo-1448375240586-882707db888b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        
        // Eğitim alt türleri
        'seminer': 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'seminar': 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'konferans': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'conference': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'kitap': 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'book': 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
      };
      
      // Anahtar kelimelere göre resim seç
      for (const [keyword, url] of Object.entries(keywordMap)) {
        if (allContent.includes(keyword)) {
          return url;
        }
      }
      
      // Anahtar kelime eşleşmezse, kategoriye göre seç
      const lowercaseCategory = category.toLowerCase();
      return categoryImages[lowercaseCategory] || categoryImages['diğer'];
      
    } catch (error) {
      console.error('Görsel belirlenirken hata oluştu:', error);
      return 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60';
    }
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
      // Tam adres varsa kullan
      if (location.address) {
        return location.address;
      }
      // Şehir bilgisi varsa kullan
      if (location.city) {
        // İlçe bilgisi de varsa, birleştirerek göster
        if (location.district) {
          return `${location.district}, ${location.city}`;
        }
        return location.city;
      }
      // Coordinates varsa ve address yoksa
      if (location.coordinates && Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
        return `${location.coordinates[1]}, ${location.coordinates[0]}`;
      }
    }
    
    // Hiçbir format uygun değilse
    return 'Konum belirtilmemiş';
  };
  
  // Konum rengini belirle (kullanıcı şehri ile aynı ise vurgula)
  const getLocationStyle = () => {
    try {
      // Kullanıcı bilgisi yoksa normal stil döndür
      if (!auth.userProfile || !auth.userProfile.location) {
        return styles.detailText;
      }
      
      // Etkinlik konumu alınamıyorsa normal stil döndür
      if (!event.location) {
        return styles.detailText;
      }
      
      // Kullanıcı şehrini belirle
      let userCity = null;
      const userProfile = auth.userProfile;
      
      if (typeof userProfile.location === 'string') {
        userCity = userProfile.location.toLowerCase();
      } else if (userProfile.location.city) {
        userCity = userProfile.location.city.toLowerCase();
      }
      
      // Etkinlik şehrini belirle
      let eventCity = null;
      
      if (typeof event.location === 'string') {
        // String içinde şehir adını ara
        const locationParts = event.location.split(',');
        eventCity = locationParts.length > 1 
          ? locationParts[1].trim().toLowerCase() 
          : event.location.toLowerCase();
      } else if (event.location.city) {
        eventCity = event.location.city.toLowerCase();
      } else if (event.location.address) {
        const addressParts = event.location.address.split(',');
        eventCity = addressParts.length > 1 
          ? addressParts[1].trim().toLowerCase() 
          : event.location.address.toLowerCase();
      }
      
      // Şehirler eşleşiyorsa vurgulu stil döndür
      if (userCity && eventCity && eventCity.includes(userCity)) {
        return [styles.detailText, styles.highlightedLocation];
      }
      
      return styles.detailText;
    } catch (error) {
      console.log('Location style error:', error);
      return styles.detailText;
    }
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
          source={{ uri: getEventImage(event) }} 
          style={styles.image} 
          resizeMode="cover"
        />
        
        {/* Category Badge */}
        <View style={styles.categoryBadge}>
          <Icon name={getCategoryIcon(event.category)} size={14} color="#fff" />
          <Text style={styles.categoryText}>
            {event.hobby?.name || event.category || event.hobbyName || 'Diğer'}
          </Text>
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
          <Text style={getLocationStyle()}>
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
  highlightedLocation: {
    fontWeight: 'bold',
    color: '#3f51b5',
    fontSize: 14,
  },
});

export default EventCard; 