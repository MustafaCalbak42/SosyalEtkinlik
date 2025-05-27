import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../shared/api/apiClient';
import colors from '../shared/theme/colors';

const UserProfileScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  
  const [user, setUser] = useState(null);
  const [participatedEvents, setParticipatedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingEvents, setLoadingEvents] = useState(false);
  
  useEffect(() => {
    fetchUserProfile();
  }, [userId]);
  
  const fetchUserProfile = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log(`[UserProfile] Fetching profile for user ID: ${userId}`);
      
      // Kullanıcı profil bilgisini getir
      const response = await api.user.getUserById(userId);
      
      if (response.data && response.data.success) {
        setUser(response.data.data);
        fetchUserEvents(response.data.data._id);
      } else if (response.data) {
        setUser(response.data);
        fetchUserEvents(response.data._id);
      } else {
        throw new Error('Kullanıcı bilgileri alınamadı');
      }
    } catch (err) {
      console.error('[UserProfile] Error fetching user profile:', err);
      setError('Kullanıcı profili yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUserEvents = async (userId) => {
    setLoadingEvents(true);
    
    try {
      console.log(`[UserProfile] Fetching events for user ID: ${userId}`);
      
      // Kullanıcının katıldığı etkinlikleri getir
      const response = await api.events.getAll({ userId });
      
      if (response.data && Array.isArray(response.data)) {
        setParticipatedEvents(response.data);
      } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setParticipatedEvents(response.data.data);
      }
    } catch (err) {
      console.error('[UserProfile] Error fetching user events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };
  
  // Profil fotoğrafı için ilk harfleri al
  const getInitials = (name) => {
    if (!name) return '?';
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };
  
  // Etkinlik detayına git
  const navigateToEventDetail = (eventId) => {
    navigation.navigate('EventDetail', { eventId });
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Profil bilgileri yükleniyor...</Text>
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
            onPress={fetchUserProfile}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Kullanıcı bulunamadı</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kullanıcı Profili</Text>
        <View style={styles.rightHeaderSpace} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Üst Profil Alanı */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(user.fullName || user.username)}
            </Text>
          </View>
          <Text style={styles.userName}>{user.fullName || user.username}</Text>
          
          {user.username && (
            <Text style={styles.userHandle}>@{user.username}</Text>
          )}
          
          {user.bio && (
            <Text style={styles.userBio}>{user.bio}</Text>
          )}
          
          <View style={styles.userStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{participatedEvents.length}</Text>
              <Text style={styles.statLabel}>Katıldığı Etkinlik</Text>
            </View>
          </View>
        </View>
        
        {/* Kullanıcının Etkinlikleri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Katıldığı Etkinlikler</Text>
          
          {loadingEvents ? (
            <ActivityIndicator size="small" color={colors.primary.main} style={styles.eventsLoading} />
          ) : participatedEvents.length > 0 ? (
            <View style={styles.eventsContainer}>
              {participatedEvents.map((event, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.eventItem}
                  onPress={() => navigateToEventDetail(event._id)}
                >
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventDate}>
                      {new Date(event.startDate).toLocaleString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color="#777" />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Bu kullanıcının henüz katıldığı etkinlik bulunmuyor</Text>
          )}
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
  header: {
    backgroundColor: colors.primary.main,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  rightHeaderSpace: {
    width: 30,
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
  profileHeader: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userHandle: {
    fontSize: 16,
    color: '#777',
    marginBottom: 10,
  },
  userBio: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#777',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    margin: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  eventsLoading: {
    padding: 20,
  },
  eventsContainer: {
    marginTop: 5,
  },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: '#777',
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 15,
  },
});

export default UserProfileScreen; 