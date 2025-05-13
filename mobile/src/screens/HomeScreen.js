import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  Dimensions,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import AuthContext from '../contexts/AuthContext';
import apiClient from '../shared/api/apiClient';
import EventCard from '../components/EventCard';
import { theme } from '../styles/theme';
import UserAvatar from '../components/UserAvatar';
import CategoryFilter from '../components/CategoryFilter';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { userProfile } = useAuth();
  const { signOut } = useContext(AuthContext);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [recommendedUsers, setRecommendedUsers] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.events.getEvents();
      setEvents(response.data);
      setFilteredEvents(response.data);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendedUsers = async () => {
    try {
      const response = await apiClient.users.getRecommendedUsers();
      if (response.data) {
        setRecommendedUsers(response.data);
      }
    } catch (error) {
      console.error('Error loading recommended users:', error);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchRecommendedUsers();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [selectedCategory, searchQuery, events]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    await fetchRecommendedUsers();
    setRefreshing(false);
  };

  const handleUserPress = (userId) => {
    navigation.navigate('UserProfile', { userId });
  };

  const filterEvents = () => {
    if (!events.length) return;
    
    let filtered = [...events];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(event => 
        event.hobby && event.hobby.category === selectedCategory
      );
    }

    setFilteredEvents(filtered);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const renderRecommendedUsers = () => {
    if (!recommendedUsers.length) return null;

    return (
      <View style={styles.recommendedUsersSection}>
        <Text style={styles.sectionTitle}>Recommended Users</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recommendedUsersList}
        >
          {recommendedUsers.map(user => (
            <TouchableOpacity 
              key={user._id}
              style={styles.recommendedUserItem}
              onPress={() => handleUserPress(user._id)}
            >
              <UserAvatar 
                size={50} 
                uri={user.profilePicture} 
                name={user.name} 
              />
              <Text style={styles.recommendedUserName} numberOfLines={1}>
                {user.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Icon name="alert-circle-outline" size={50} color="#f44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchEvents}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (filteredEvents.length === 0) {
      return (
        <View style={styles.noEventsContainer}>
          <Icon 
            name="calendar-remove" 
            size={80} 
            color={theme.colors.primary}
            style={styles.noEventsIcon}
          />
          <Text style={styles.noEventsText}>
            {selectedCategory === 'All' 
              ? 'No events available at the moment' 
              : `No ${selectedCategory} events available`}
          </Text>
          {selectedCategory !== 'All' && (
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => setSelectedCategory('All')}
            >
              <Text style={styles.viewAllButtonText}>View All Events</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <View style={styles.eventsContainer}>
        {filteredEvents.map(event => (
          <EventCard key={event._id} event={event} />
        ))}
      </View>
    );
  };

  const navigateToLogin = () => {
    // Directly navigate to the Auth stack
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1976d2']}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Sosyal Etkinlik</Text>
            {!userProfile ? (
              <TouchableOpacity 
                style={styles.loginButton}
                onPress={navigateToLogin}
              >
                <Text style={styles.loginButtonText}>Giriş Yap</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  style={styles.headerButton}
                  onPress={() => navigation.navigate('Profile')}
                >
                  <Ionicons name="person" size={20} color="#fff" />
                  <Text style={styles.headerButtonText}>Profil</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.headerButton}
                  onPress={() => signOut()}
                >
                  <Ionicons name="log-out" size={20} color="#fff" />
                  <Text style={styles.headerButtonText}>Çıkış</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <Text style={styles.searchText}>Etkinlik ara...</Text>
        </View>

        {/* Featured Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Öne Çıkan Etkinlikler</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.eventScroll}
          >
            {[1, 2, 3].map((item) => (
              <TouchableOpacity key={item} style={styles.eventCard}>
                <Image
                  source={{ uri: 'https://via.placeholder.com/200x150' }}
                  style={styles.eventImage}
                />
                <View style={styles.eventOverlay} />
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>Etkinlik {item}</Text>
                  <View style={styles.eventDetails}>
                    <Ionicons name="calendar" size={14} color="#fff" />
                    <Text style={styles.eventDate}>23 Mart 2024</Text>
                    <Ionicons name="location" size={14} color="#fff" style={styles.locationIcon} />
                    <Text style={styles.eventLocation}>İstanbul</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kategoriler</Text>
          <View style={styles.categoriesGrid}>
            {[
              { name: 'Müzik', icon: 'musical-notes' },
              { name: 'Spor', icon: 'basketball' },
              { name: 'Sanat', icon: 'color-palette' },
              { name: 'Teknoloji', icon: 'laptop' }
            ].map((category) => (
              <TouchableOpacity key={category.name} style={styles.categoryCard}>
                <View style={styles.categoryIconContainer}>
                  <Ionicons name={category.icon} size={24} color="#1976d2" />
                </View>
                <Text style={styles.categoryTitle}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Upcoming Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Yaklaşan Etkinlikler</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>
          {[1, 2, 3].map((item) => (
            <TouchableOpacity key={item} style={styles.upcomingEventCard}>
              <Image
                source={{ uri: 'https://via.placeholder.com/100x100' }}
                style={styles.upcomingEventImage}
              />
              <View style={styles.upcomingEventInfo}>
                <Text style={styles.upcomingEventTitle}>Yaklaşan Etkinlik {item}</Text>
                <View style={styles.upcomingEventDetails}>
                  <View style={styles.eventDetail}>
                    <Ionicons name="calendar" size={14} color="#666" />
                    <Text style={styles.upcomingEventDate}>24 Mart 2024</Text>
                  </View>
                  <View style={styles.eventDetail}>
                    <Ionicons name="location" size={14} color="#666" />
                    <Text style={styles.upcomingEventLocation}>Ankara</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#1976d2',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  loginButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  loginButtonText: {
    color: '#1976d2',
    fontWeight: '600',
    fontSize: 16,
  },
  profileButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchText: {
    color: '#666',
    fontSize: 16,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '500',
  },
  eventScroll: {
    marginHorizontal: -16,
  },
  eventCard: {
    width: 280,
    marginRight: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  eventImage: {
    width: '100%',
    height: 180,
  },
  eventOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  eventInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  eventDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventDate: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 4,
    marginRight: 12,
  },
  locationIcon: {
    marginLeft: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 4,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoryIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  upcomingEventCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  upcomingEventImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  upcomingEventInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  upcomingEventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  upcomingEventDetails: {
    gap: 4,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upcomingEventDate: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  upcomingEventLocation: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  recommendedUsersSection: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  recommendedUsersList: {
    paddingVertical: 10,
  },
  recommendedUserItem: {
    alignItems: 'center',
    marginRight: 20,
    width: 80,
  },
  recommendedUserName: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    width: 80,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.primary,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  noEventsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  noEventsIcon: {
    marginBottom: 20,
  },
  noEventsText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.primary,
    borderRadius: 25,
  },
  viewAllButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  eventsContainer: {
    padding: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default HomeScreen; 