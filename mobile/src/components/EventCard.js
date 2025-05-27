import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../contexts/AuthContext';
import api from '../shared/api/apiClient';

const EventCard = ({ event, showRecommendationBadge = false, onEventUpdated }) => {
  const navigation = useNavigation();
  const auth = useAuth(); // AuthContext'i kullan
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  
  // Kullanıcının bu etkinliğe katılıp katılmadığını kontrol et
  useEffect(() => {
    if (auth.userProfile && event.participants) {
      const isParticipant = event.participants.some(
        p => p.user === auth.userProfile._id || p.user._id === auth.userProfile._id
      );
      setHasJoined(isParticipant);
    }
  }, [auth.userProfile, event.participants]);
  
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
  
  // Etkinlik için kategori ve içeriğe göre görsel URL'si belirle - İyileştirilmiş versiyon
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
      
      // Kategori bazlı varsayılan görseller - Güncellenmiş ve test edilmiş URL'ler
      const categoryImages = {
        'müzik': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'spor': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'sanat': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'dans': 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'yemek': 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'seyahat': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'teknoloji': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'doğa': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'eğitim': 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'diğer': 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60'
      };
      
      // Kategori alt türleri için anahtar kelimeler ve görsel URL'leri
      const keywordMap = {
        // Spor alt türleri
        'futbol': 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'soccer': 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'football': 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'basketbol': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'basketball': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'tenis': 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'tennis': 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'voleybol': 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'volleyball': 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'yüzme': 'https://images.unsplash.com/photo-1530549387789-4c1017266635?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'swimming': 'https://images.unsplash.com/photo-1530549387789-4c1017266635?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'koşu': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'running': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'yoga': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'bisiklet': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'cycling': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        
        // Müzik alt türleri
        'gitar': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'guitar': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'piyano': 'https://images.unsplash.com/photo-1552422535-c45813c61732?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'piano': 'https://images.unsplash.com/photo-1552422535-c45813c61732?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'konser': 'https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'concert': 'https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'rock': 'https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'jazz': 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        
        // Sanat alt türleri
        'resim': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'painting': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'fotoğraf': 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'photography': 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'sergi': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'exhibition': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        
        // Dans alt türleri
        'bale': 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'ballet': 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'salsa': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'tango': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        
        // Yemek alt türleri
        'pasta': 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'kahve': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'coffee': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'pizza': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'sushi': 'https://images.unsplash.com/photo-1553621042-f6e147245754?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        
        // Seyahat alt türleri
        'istanbul': 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'kapadokya': 'https://images.unsplash.com/photo-1570856033163-05f258ec9481?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'cappadocia': 'https://images.unsplash.com/photo-1570856033163-05f258ec9481?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'paris': 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'kamp': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'camping': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        
        // Teknoloji alt türleri
        'yazılım': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'software': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'yapay zeka': 'https://images.unsplash.com/photo-1507146153580-69a1fe6d8aa1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'artificial intelligence': 'https://images.unsplash.com/photo-1507146153580-69a1fe6d8aa1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'robotik': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'robotics': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        
        // Doğa alt türleri
        'dağ': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'mountain': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'deniz': 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'sea': 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'orman': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'forest': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        
        // Eğitim alt türleri
        'seminer': 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'seminar': 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'konferans': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'conference': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'kitap': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        'book': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60'
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
      return 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60';
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
  
  // Etkinliğe katılma/ayrılma işlemi
  const handleJoinToggle = async () => {
    if (!auth.userProfile) {
      navigation.navigate('Login');
      return;
    }
    
    setIsJoining(true);
    
    try {
      if (hasJoined) {
        // Etkinlikten ayrıl
        await api.events.leave(event._id);
        setHasJoined(false);
        console.log('[EventCard] Etkinlikten ayrıldı:', event.title);
      } else {
        // Etkinliğe katıl
        await api.events.join(event._id);
        setHasJoined(true);
        console.log('[EventCard] Etkinliğe katıldı:', event.title);
      }
      
      // Eğer callback varsa çağır (profil sayfasını yenilemek için)
      if (onEventUpdated) {
        onEventUpdated();
      }
    } catch (error) {
      console.error('[EventCard] Katılım işlemi hatası:', error);
      
      // Hata mesajını göster
      const errorMessage = error.response?.data?.message || 'Bir hata oluştu';
      Alert.alert('Hata', errorMessage);
    } finally {
      setIsJoining(false);
    }
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

        {/* Recommendation Badge */}
        {showRecommendationBadge && (
          <View style={styles.recommendationBadge}>
            <Icon name="star" size={12} color="#fff" />
            <Text style={styles.recommendationText}>Size Özel</Text>
          </View>
        )}
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
        
        {/* Distance Info - Yakınımdaki etkinlikler için */}
        {event.distance && (
          <View style={styles.detailItem}>
            <Icon name="walk" size={16} color="#3f51b5" />
            <Text style={[styles.detailText, styles.distanceText]}>
              {typeof event.distance === 'string' ? event.distance : `${event.distance} km uzaklıkta`}
            </Text>
          </View>
        )}
        
        <View style={styles.footer}>
          <View style={styles.attendeesInfo}>
            <Icon name="account-group" size={16} color="#666" />
            <Text style={styles.attendeesText}>
              {getAttendeeCount()} attending
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.joinButton, 
              hasJoined && styles.joinedButton,
              isJoining && styles.disabledButton
            ]}
            onPress={handleJoinToggle}
            disabled={isJoining}
          >
            <Text style={[
              styles.joinButtonText,
              hasJoined && styles.joinedButtonText
            ]}>
              {isJoining ? 'Yükleniyor...' : hasJoined ? 'Ayrıl' : 'Katıl'}
            </Text>
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
  recommendationBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FF7043',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  joinedButton: {
    backgroundColor: '#f44336',
  },
  joinedButtonText: {
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.6,
  },
  distanceText: {
    fontWeight: 'bold',
    color: '#3f51b5',
  },
});

export default EventCard; 