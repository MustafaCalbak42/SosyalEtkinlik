import React, { useState, useEffect } from 'react';
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
import apiClient from '../shared/api/apiClient';
import EventCard from '../components/EventCard';
import { theme } from '../styles/theme';
import UserAvatar from '../components/UserAvatar';
import CategoryFilter from '../components/CategoryFilter';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();
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

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Discover Events</Text>
        <Text style={styles.subtitle}>Find events that match your interests</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color="#757575" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <CategoryFilter 
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
      />
      
      {renderRecommendedUsers()}
      {renderContent()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    padding: 16,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  eventsContainer: {
    padding: 16,
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
  searchContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
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
});

export default HomeScreen; 