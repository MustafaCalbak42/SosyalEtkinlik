import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Modal
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
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [loadingParticipant, setLoadingParticipant] = useState(false);
  const [participantError, setParticipantError] = useState(null);
  
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
        console.log('[EventDetail] Successfully loaded event data with success format');
        setEvent(response.data.data);
      } else if (response.data && response.data.data) {
        console.log('[EventDetail] Successfully loaded event data with data property');
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
    
    // Öncelikle formattedParticipants array'ini kontrol et
    if (event.formattedParticipants && Array.isArray(event.formattedParticipants)) {
      return event.formattedParticipants.some(participant => 
        participant._id === userProfile._id
      );
    }
    
    // API yanıtına göre katılımcılar listesini kontrol et
    const participants = event.participants || event.attendees || [];
    
    // Katılımcılar ID listesiyse
    if (participants.length > 0 && typeof participants[0] === 'string') {
      return participants.includes(userProfile._id);
    }
    
    // Katılımcılar nesne listesiyse
    return participants.some(participant => {
      if (typeof participant === 'object') {
        if (participant.user) {
          // Eğer participant.user bir obje ise
          if (typeof participant.user === 'object') {
            return participant.user._id === userProfile._id;
          }
          // Eğer participant.user bir string ise
          return participant.user === userProfile._id;
        }
        return participant._id === userProfile._id;
      }
      return participant === userProfile._id;
    });
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
  
  // Participant profile handling
  const handleParticipantPress = async (participant) => {
    console.log('Participant pressed:', participant);
    
    // Katılımcı ID'sini tespit et
    let participantId;
    
    if (typeof participant === 'string') {
      participantId = participant;
    } else if (participant?._id) {
      participantId = participant._id;
    } else if (participant?.id) {
      participantId = participant.id;
    } else if (participant?.user && typeof participant.user === 'object') {
      participantId = participant.user._id;
    } else if (participant?.user && typeof participant.user === 'string') {
      participantId = participant.user;
    } else {
      console.error('Could not determine participant ID format:', participant);
      // ID bulunamadığında doğrudan mevcut veriyi kullan
      setSelectedParticipant(participant);
      setShowParticipantModal(true);
      return;
    }
    
    // Geçici veriyi hemen göster
    setSelectedParticipant(participant);
    setShowParticipantModal(true);
    setLoadingParticipant(true);
    setParticipantError(null);
    
    // MongoDB ObjectId doğrulaması
    const isValidObjectId = participantId && 
                         typeof participantId === 'string' && 
                         participantId.match(/^[0-9a-fA-F]{24}$/);
    
    if (!isValidObjectId) {
      console.log('Geçersiz kullanıcı ID formatı, sadece mevcut veriyi kullanıyoruz');
      setLoadingParticipant(false);
      return;
    }
    
    // API'den tam kullanıcı bilgilerini al
    try {
      console.log(`API'den kullanıcı bilgileri alınıyor, ID: ${participantId}`);
      const response = await api.user.getUserById(participantId);
      
      if (response.data && response.data.success) {
        console.log('Kullanıcı bilgileri başarıyla alındı');
        setSelectedParticipant(response.data.data);
      } else {
        console.log('API başarısız yanıt döndürdü:', response.data);
        // Hata durumunda mevcut veriyi kullanmaya devam et
        setParticipantError('Tam kullanıcı bilgileri alınamadı');
      }
    } catch (error) {
      console.error('Kullanıcı bilgileri alınırken hata:', error);
      setParticipantError('Kullanıcı bilgileri alınamadı');
    } finally {
      setLoadingParticipant(false);
    }
  };
  
  const closeParticipantModal = () => {
    setShowParticipantModal(false);
    setSelectedParticipant(null);
    setParticipantError(null);
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
    if (event.formattedParticipants && Array.isArray(event.formattedParticipants)) {
      return event.formattedParticipants.length;
    }
    
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
          
          {/* Etkinliğe Katılanlar */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Katılımcılar</Text>
            {event.formattedParticipants && event.formattedParticipants.length > 0 ? (
              <View style={styles.participantsContainer}>
                {event.formattedParticipants.map((participant, index) => {
                  // Katılımcı adını al
                  const participantName = 
                    participant.fullName || 
                    participant.username || 
                    `Katılımcı ${index + 1}`;
                  
                  return (
                    <TouchableOpacity
                      key={`participant-${index}`}
                      style={styles.participantItem}
                      onPress={() => handleParticipantPress(participant)}
                    >
                      <View style={styles.participantAvatar}>
                        <Text style={styles.participantInitials}>
                          {participantName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.participantName}>{participantName}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (event.participants || event.attendees || []).length > 0 ? (
              <View style={styles.participantsContainer}>
                {(event.participants || event.attendees || []).map((participant, index) => {
                  // Katılımcı bir obje olabilir veya doğrudan string ID olabilir
                  const participantObj = typeof participant === 'object' && participant.user ? 
                    participant.user : participant;
                  
                  const participantName = typeof participantObj === 'object' ? 
                    (participantObj.fullName || participantObj.username || 'İsimsiz Kullanıcı') : 
                    `Katılımcı ${index + 1}`;
                  
                  return (
                    <TouchableOpacity
                      key={`participant-${index}`}
                      style={styles.participantItem}
                      onPress={() => handleParticipantPress(participantObj)}
                    >
                      <View style={styles.participantAvatar}>
                        <Text style={styles.participantInitials}>
                          {participantName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.participantName}>{participantName}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.emptyText}>Henüz katılımcı bulunmuyor.</Text>
            )}
          </View>
          
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
      
      {/* Katılımcı Profil Modalı */}
      <Modal
        visible={showParticipantModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeParticipantModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Katılımcı Profili</Text>
              <TouchableOpacity onPress={closeParticipantModal}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {selectedParticipant ? (
              <View style={styles.modalContent}>
                {/* Profile header with name/avatar */}
                <View style={styles.profileHeader}>
                  <View style={styles.largeAvatar}>
                    <Text style={styles.largeAvatarText}>
                      {(selectedParticipant.fullName || selectedParticipant.username || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.profileName}>
                    {selectedParticipant.fullName || selectedParticipant.username || 'İsimsiz Kullanıcı'}
                  </Text>
                  
                  {selectedParticipant.username && (
                    <Text style={styles.profileUsername}>
                      @{selectedParticipant.username}
                    </Text>
                  )}
                  
                  {selectedParticipant.isActive && (
                    <View style={styles.activeUserBadge}>
                      <MaterialIcons name="stars" size={14} color="#fff" />
                      <Text style={styles.activeUserText}>Aktif Kullanıcı</Text>
                    </View>
                  )}
                </View>
                
                {/* Loading indicator */}
                {loadingParticipant && (
                  <View style={styles.loadingIndicator}>
                    <ActivityIndicator size="small" color={colors.primary.main} />
                    <Text style={styles.loadingIndicatorText}>Kullanıcı bilgileri yükleniyor...</Text>
                  </View>
                )}
                
                {/* Error message */}
                {participantError && (
                  <View style={styles.errorMessage}>
                    <MaterialIcons name="error-outline" size={18} color="#d32f2f" />
                    <Text style={styles.errorMessageText}>{participantError}</Text>
                  </View>
                )}
                
                {/* User information */}
                <View style={styles.profileInfoContainer}>
                  {selectedParticipant.bio && (
                    <View style={styles.profileInfoItem}>
                      <MaterialIcons name="info" size={20} color={colors.primary.main} />
                      <Text style={styles.profileInfoText}>
                        {selectedParticipant.bio}
                      </Text>
                    </View>
                  )}
                  
                  {selectedParticipant.location && selectedParticipant.location.address && (
                    <View style={styles.profileInfoItem}>
                      <MaterialIcons name="place" size={20} color={colors.primary.main} />
                      <Text style={styles.profileInfoText}>
                        Konum: {typeof selectedParticipant.location === 'object' 
                          ? selectedParticipant.location.address 
                          : selectedParticipant.location}
                      </Text>
                    </View>
                  )}
                  
                  {selectedParticipant.joinedAt && (
                    <View style={styles.profileInfoItem}>
                      <MaterialIcons name="event" size={20} color={colors.primary.main} />
                      <Text style={styles.profileInfoText}>
                        Katılma Tarihi: {new Date(selectedParticipant.joinedAt).toLocaleDateString('tr-TR')}
                      </Text>
                    </View>
                  )}
                  
                  {selectedParticipant.createdAt && (
                    <View style={styles.profileInfoItem}>
                      <MaterialIcons name="today" size={20} color={colors.primary.main} />
                      <Text style={styles.profileInfoText}>
                        Üyelik Tarihi: {new Date(selectedParticipant.createdAt).toLocaleDateString('tr-TR')}
                      </Text>
                    </View>
                  )}
                  
                  {selectedParticipant.participatedEvents && (
                    <View style={styles.profileInfoItem}>
                      <MaterialIcons name="event-available" size={20} color={colors.secondary.main} />
                      <Text style={styles.profileInfoText}>
                        Katıldığı Etkinlik Sayısı: {selectedParticipant.participatedEvents?.length || 0}
                      </Text>
                    </View>
                  )}
                </View>
                
                {selectedParticipant.hobbies && selectedParticipant.hobbies.length > 0 && (
                  <View style={styles.hobbiesContainer}>
                    <Text style={styles.hobbiesTitle}>İlgi Alanları</Text>
                    <View style={styles.hobbyTags}>
                      {selectedParticipant.hobbies.map((hobby, index) => (
                        <View 
                          key={`hobby-${index}`}
                          style={styles.hobbyTag}
                        >
                          <Text style={styles.hobbyText}>
                            {typeof hobby === 'object' ? hobby.name : hobby}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                
                {/* If minimal data, show limited data notice */}
                {!selectedParticipant.participatedEvents && !selectedParticipant.hobbies && !loadingParticipant && (
                  <View style={styles.limitedDataInfo}>
                    <MaterialIcons name="info-outline" size={20} color="#ff9800" />
                    <Text style={styles.limitedDataText}>
                      Sınırlı kullanıcı bilgileri gösteriliyor
                    </Text>
                  </View>
                )}
                
                <TouchableOpacity 
                  style={styles.profileActionButton}
                  onPress={() => {
                    closeParticipantModal();
                    navigation.navigate('UserProfile', { userId: selectedParticipant._id });
                  }}
                >
                  <Text style={styles.profileActionButtonText}>Profili Görüntüle</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary.main} />
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    color: '#444',
    marginLeft: 10,
    fontSize: 14,
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
  // Katılımcılar için stiller
  participantsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginRight: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    padding: 5,
    paddingRight: 12,
    elevation: 2, // Add shadow on Android
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  participantAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  participantInitials: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  participantName: {
    fontSize: 14,
    color: '#444',
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
    marginTop: 10,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '65%',
    maxHeight: '80%',
    width: '100%',
    padding: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  largeAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  largeAvatarText: {
    color: 'white',
    fontSize: 40,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 22,
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  profileUsername: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  activeUserBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 10,
  },
  activeUserText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
  profileInfoContainer: {
    marginBottom: 20,
  },
  profileInfoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  profileInfoText: {
    marginLeft: 12,
    color: '#333',
    fontSize: 16,
    flex: 1,
  },
  hobbiesContainer: {
    marginBottom: 24,
  },
  hobbiesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  hobbyTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  hobbyTag: {
    backgroundColor: colors.primary.light,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  hobbyText: {
    color: colors.primary.contrastText,
    fontSize: 14,
  },
  profileActionButton: {
    backgroundColor: colors.primary.main,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  profileActionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  loadingIndicatorText: {
    marginLeft: 10,
    color: '#666',
  },
  errorMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  errorMessageText: {
    marginLeft: 10,
    color: '#d32f2f',
  },
  limitedDataInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  limitedDataText: {
    marginLeft: 10,
    color: '#ff9800',
  },
});

export default EventDetailScreen; 