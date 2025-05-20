import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../shared/api/apiClient';
import colors from '../shared/theme/colors';

const EventDetailScreen = ({ route, navigation }) => {
  const { eventId } = route.params;
  const { userProfile, isLoggedIn } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  
  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);
  
  const fetchEventDetails = async (retryCount = 0) => {
    setLoading(true);
    setError('');
    
    try {
      console.log(`[EventDetail] Fetching event details for ID: ${eventId} (attempt: ${retryCount + 1})`);
      
      // Make sure we have a valid event ID
      if (!eventId) {
        setError('Etkinlik ID\'si geçersiz');
        setLoading(false);
        return;
      }
      
      const response = await api.events.getById(eventId);
      console.log('[EventDetail] API response received');
      
      if (response.data && response.data.success) {
        console.log('[EventDetail] Successfully loaded event data');
        setEvent(response.data.data);
      } else if (response.data) {
        console.log('[EventDetail] Direct data format received');
        // Handle alternative API response format
        setEvent(response.data);
      } else {
        throw new Error(response.data?.message || 'Etkinlik bilgileri alınamadı');
      }
    } catch (err) {
      console.error('[EventDetail] Error fetching event details:', err.message);
      
      // Implement retry logic - max 3 retries
      if (retryCount < 2) {
        console.log(`[EventDetail] Retrying... (${retryCount + 1}/3)`);
        setTimeout(() => {
          fetchEventDetails(retryCount + 1);
        }, 1000); // Wait 1 second before retry
        return;
      }
      
      setError(err.message || 'Etkinlik detayları yüklenirken bir hata oluştu');
    } finally {
      if (retryCount === 0 || retryCount >= 2) {
        setLoading(false);
      }
    }
  };
  
  // Kullanıcının etkinliğe katılıp katılmadığını kontrol et
  const isUserJoined = () => {
    if (!event || !isLoggedIn || !userProfile) return false;
    
    // API yanıtına göre katılımcılar listesini kontrol et
    const participants = event.participants || event.attendees || [];
    
    // Katılımcılar ID listesiyse
    if (participants.length > 0 && typeof participants[0] === 'string') {
      return participants.includes(userProfile._id);
    }
    
    // Katılımcılar nesne listesiyse
    return participants.some(participant => 
      (participant._id === userProfile._id) || (participant.id === userProfile._id)
    );
  };
  
  // Etkinliğe katılma/ayrılma işlemi
  const handleJoinOrLeave = async () => {
    if (!isLoggedIn) {
      Alert.alert(
        'Giriş Gerekli',
        'Etkinliğe katılmak için giriş yapmalısınız',
        [
          { text: 'İptal', style: 'cancel' },
          { 
            text: 'Giriş Yap', 
            onPress: () => navigation.navigate('Auth', { screen: 'Login' }) 
          }
        ]
      );
      return;
    }
    
    setJoining(true);
    
    try {
      const joined = isUserJoined();
      const response = joined 
        ? await api.events.leave(eventId)
        : await api.events.join(eventId);
      
      if (response.data && response.data.success) {
        // Etkinlik verilerini güncelle
        fetchEventDetails();
        
        // Başarı mesajı göster
        Alert.alert(
          'İşlem Başarılı',
          joined ? 'Etkinlikten ayrıldınız' : 'Etkinliğe katıldınız'
        );
      } else {
        Alert.alert(
          'Hata',
          response.data?.message || 'İşlem sırasında bir hata oluştu'
        );
      }
    } catch (err) {
      console.error('Etkinlik katılım hatası:', err);
      Alert.alert(
        'Hata',
        'İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.'
      );
    } finally {
      setJoining(false);
    }
  };
  
  // Tarih formatla
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      console.error('Date formatting error:', err);
      return '';
    }
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Etkinlik yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#c62828" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchEventDetails}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Etkinlik bulunamadı</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  // Etkinlik organizatörünün adını al
  const getOrganizerName = () => {
    if (!event.organizer) return 'Anonim';
    
    if (typeof event.organizer === 'object') {
      return event.organizer.name || 'İsimsiz Kullanıcı';
    }
    
    return 'Kullanıcı';
  };
  
  // Katılımcı sayısı
  const getParticipantCount = () => {
    const participants = event.participants || event.attendees || [];
    return participants.length;
  };
  
  // Etkinlik görseli için URL al
  const getEventImage = () => {
    // Doğrudan event.image kullanılabilirse
    if (event.image) {
      return event.image;
    }
    
    // Etkinliğin kategorisine göre varsayılan görseller
    const categoryImages = {
      'müzik': 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      'spor': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      'sanat': 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      'dans': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      'yemek': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      'seyahat': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      'teknoloji': 'https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      'doğa': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      'eğitim': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      'diğer': 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    };
    
    const category = (event.hobby?.category || event.category || '').toLowerCase();
    return categoryImages[category] || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-social-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* Etkinlik Banner (eğer resim varsa) */}
        <View style={styles.bannerContainer}>
          <Image 
            source={{ uri: getEventImage() }}
            style={styles.bannerImage}
            resizeMode="cover"
            onError={() => console.log('Image loading error')}
          />
          <View style={styles.banner}>
            <Text style={styles.eventCategory}>
              {(event.hobby?.category || event.category || 'Etkinlik')}
            </Text>
          </View>
        </View>
        
        {/* Etkinlik Başlığı */}
        <View style={styles.contentContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{event.title}</Text>
            <View style={styles.organizerContainer}>
              <MaterialIcons name="person" size={16} color="#777" />
              <Text style={styles.organizerText}>
                Organizatör: {getOrganizerName()}
              </Text>
            </View>
          </View>
          
          {/* Etkinlik Bilgileri */}
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <MaterialIcons name="event" size={20} color={colors.primary.main} />
              <Text style={styles.infoText}>
                {formatDate(event.startDate || event.date) || 'Tarih belirtilmemiş'}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <MaterialIcons name="location-on" size={20} color={colors.primary.main} />
              <Text style={styles.infoText}>
                {typeof event.location === 'object' 
                  ? (event.location?.address || 'Konum belirtilmemiş') 
                  : (event.address || event.location || 'Konum belirtilmemiş')}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <MaterialIcons name="group" size={20} color={colors.primary.main} />
              <Text style={styles.infoText}>
                {getParticipantCount()} Katılımcı / {event.maxParticipants ? event.maxParticipants : '∞'} Kapasite
              </Text>
            </View>
            
            {event.price && Number(event.price) > 0 ? (
              <View style={styles.infoItem}>
                <MaterialIcons name="attach-money" size={20} color={colors.primary.main} />
                <Text style={styles.infoText}>
                  {event.price} TL
                </Text>
              </View>
            ) : null}
          </View>
          
          {/* Etkinlik Açıklaması */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Etkinlik Açıklaması</Text>
            <Text style={styles.descriptionText}>
              {event.description ? event.description : 'Bu etkinlik için açıklama bulunmuyor.'}
            </Text>
          </View>
          
          {/* Etikeller */}
          {event.tags && Array.isArray(event.tags) && event.tags.length > 0 ? (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Etiketler</Text>
              <View style={styles.tagsContainer}>
                {event.tags.map((tag, index) => (
                  <View key={`tag-${index}`} style={styles.tag}>
                    <Text style={styles.tagText}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
          
          {/* Gereksinimler */}
          {event.requirements && Array.isArray(event.requirements) && event.requirements.length > 0 ? (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Katılım Gereksinimleri</Text>
              {event.requirements.map((requirement, index) => (
                <View key={`req-${index}`} style={styles.requirementItem}>
                  <MaterialIcons name="check-circle" size={18} color={colors.primary.main} />
                  <Text style={styles.requirementText}>{requirement}</Text>
                </View>
              ))}
            </View>
          ) : null}
          
          {/* Etkinliğe Katıl/Ayrıl Butonu */}
          <TouchableOpacity 
            style={[
              styles.joinButton, 
              isUserJoined() ? styles.leaveButton : null,
              joining ? styles.disabledButton : null
            ]}
            onPress={joining ? null : handleJoinOrLeave}
            disabled={joining}
            activeOpacity={0.8}
          >
            {joining ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.joinButtonText}>
                {isUserJoined() ? 'Etkinlikten Ayrıl' : 'Etkinliğe Katıl'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
    marginVertical: 10,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
    marginTop: 15,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerContainer: {
    height: 200,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  banner: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  eventCategory: {
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  contentContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  titleContainer: {
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  organizerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizerText: {
    marginLeft: 5,
    color: '#555',
    fontSize: 14,
  },
  infoContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    marginLeft: 10,
    color: '#333',
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  descriptionText: {
    color: '#555',
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#e3f2fd',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#1976d2',
    fontSize: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    marginLeft: 8,
    color: '#555',
  },
  joinButton: {
    backgroundColor: colors.primary.main,
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  leaveButton: {
    backgroundColor: '#f44336',
  },
  disabledButton: {
    opacity: 0.7,
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default EventDetailScreen; 