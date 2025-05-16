import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshControl,
  StatusBar,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import EventCard from '../components/EventCard';
import colors from '../shared/theme/colors';
import { getAllEvents, getRecommendedEvents } from '../services/eventService';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  // States
  const [events, setEvents] = useState([]);
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [popularEvents, setPopularEvents] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [recommendedLoading, setRecommendedLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0); // 0: Etkinlikler, 1: Yakınımdaki, 2: Arkadaşlarım
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 6,
    total: 0,
    pages: 1
  });

  const { isAuthenticated, user } = useAuth();
  const userProfile = user;
  
  // Dummy kategoriler
  const categories = [
    { id: 1, name: 'Tümü', icon: 'apps' },
    { id: 2, name: 'Müzik', icon: 'musical-notes' },
    { id: 3, name: 'Spor', icon: 'basketball' },
    { id: 4, name: 'Sanat', icon: 'color-palette' },
    { id: 5, name: 'Dans', icon: 'footsteps' },
    { id: 6, name: 'Yemek', icon: 'fast-food' },
    { id: 7, name: 'Teknoloji', icon: 'laptop' },
    { id: 8, name: 'Doğa', icon: 'leaf' }
  ];
  
  // İlgi alanları dummy data
  const userInterests = ['Müzik', 'Teknoloji', 'Seyahat', 'Doğa', 'Spor'];

  useEffect(() => {
    // Kategori değiştiğinde sayfa numarasını sıfırla ve etkinlikleri yeniden getir
    setPagination({
      ...pagination,
      page: 1
    });
    fetchEvents(1, pagination.limit, selectedCategory);
    
    if (isAuthenticated) {
      fetchRecommendedEvents();
    }
  }, [isAuthenticated, selectedCategory]);

  // Etkinlikleri getir
  const fetchEvents = async (page = 1, limit = pagination.limit, category = selectedCategory) => {
    setLoading(page === 1);
    setError('');
    
    try {
      const response = await getAllEvents(page, limit, category);
      
      if (response && response.success) {
        // API'den gelen verileri doğrula
        const validEvents = (response.data || []).filter(event => 
          event && typeof event === 'object' && event._id
        );
        
        // Sayfa 1'se yeniden başlat, değilse mevcut listeye ekle
        if (page === 1) {
          setEvents(validEvents);
        } else {
          setEvents(prevEvents => [...prevEvents, ...validEvents]);
        }
        
        // Popüler etkinlikleri ayarla (en çok katılımcısı olanlar)
        if (page === 1 && validEvents.length > 0) {
          const sorted = [...validEvents].sort((a, b) => {
            const aCount = a.participants?.length || a.attendees?.length || 0;
            const bCount = b.participants?.length || b.attendees?.length || 0;
            return bCount - aCount;
          });
          setPopularEvents(sorted.slice(0, 3));
        }
        
        // Sayfalandırma bilgilerini güncelle
        setPagination({
          page: response.pagination?.page || page,
          limit: response.pagination?.limit || limit,
          total: response.pagination?.total || (response.data ? response.data.length : 0),
          pages: response.pagination?.pages || 1
        });
      } else {
        setError(response?.message || 'Etkinlikler yüklenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Etkinlikler yüklenirken hata:', error);
      setError(`Etkinlikler yüklenirken hata: ${error.message}`);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Önerilen etkinlikleri getir
  const fetchRecommendedEvents = async () => {
    setRecommendedLoading(true);
    
    try {
      const response = await getRecommendedEvents(1, 4);
      
      if (response && response.success) {
        // API'den gelen verileri doğrula
        const validEvents = (response.data || []).filter(event => 
          event && typeof event === 'object' && event._id
        );
        setRecommendedEvents(validEvents);
      } else {
        console.warn('Önerilen etkinlikler yüklenemedi:', response?.message);
      }
    } catch (error) {
      console.error('Önerilen etkinlikler yüklenirken hata:', error);
    } finally {
      setRecommendedLoading(false);
    }
  };

  // Yenileme işlemi
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPagination({
      ...pagination,
      page: 1
    });
    
    Promise.all([
      fetchEvents(1, pagination.limit, selectedCategory),
      isAuthenticated ? fetchRecommendedEvents() : Promise.resolve()
    ]).finally(() => {
      setRefreshing(false);
    });
  }, [isAuthenticated, selectedCategory, pagination.limit]);

  // Daha fazla etkinlik yükle
  const loadMoreEvents = () => {
    // Daha fazla sayfa yoksa veya yükleme zaten devam ediyorsa çık
    if (pagination.page >= pagination.pages || loading || loadingMore) {
      return;
    }
    
    setLoadingMore(true);
    fetchEvents(pagination.page + 1, pagination.limit, selectedCategory);
  };

  // Footer komponenti (yükleme göstergesi)
  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary.main} />
        <Text style={styles.footerText}>Daha fazla etkinlik yükleniyor...</Text>
      </View>
    );
  };

  // Giriş sayfasına yönlendir
  const navigateToLogin = () => {
    navigation.navigate('Auth', { screen: 'Login' });
  };

  // Etkinlik oluşturma sayfasına yönlendir
  const navigateToCreateEvent = () => {
    if (isAuthenticated) {
      navigation.navigate('CreateEvent');
    } else {
      navigateToLogin();
    }
  };

  // Tab değiştirme
  const handleTabChange = (index) => {
    setTabValue(index);
  };
  
  // Kategori geçişlerini render et
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.categoryItem,
        selectedCategory === item.name && styles.selectedCategoryItem
      ]}
      onPress={() => setSelectedCategory(item.name)}
    >
      <Ionicons 
        name={item.icon} 
        size={22} 
        color={selectedCategory === item.name ? '#fff' : colors.primary.main} 
      />
      <Text 
        style={[
          styles.categoryText,
          selectedCategory === item.name && styles.selectedCategoryText
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  // Etkinlik listesini render et
  const renderEventItem = ({ item }) => (
    <View style={styles.eventCardContainer}>
      <EventCard event={item} />
    </View>
  );

  // Kategori filtresi güvenli şekilde uygula
  const getFilteredEvents = () => {
    if (!events || !Array.isArray(events)) return [];
    
    return events.filter(event => {
      // Kategori filtresi
      if (selectedCategory !== 'Tümü' && event.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#4A56E2" barStyle="light-content" />
      <View style={styles.container}>
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary.main]}
            />
          }
          stickyHeaderIndices={[2]} // Kategori bölümünü sabitlemek için
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Hobinize Uygun Etkinlikleri Keşfedin</Text>
            <Text style={styles.heroSubtitle}>
              İlgi alanlarınıza göre etkinlik bulun, yeni insanlarla tanışın, organizasyonlar oluşturun.
            </Text>
            <TouchableOpacity 
              style={styles.createEventButton}
              onPress={navigateToCreateEvent}
            >
              <Text style={styles.createEventButtonText}>Etkinlik Oluştur</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#777" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Etkinlik ara veya ilgi alanı gir..."
              placeholderTextColor="#999"
            />
          </View>

          {/* Kategoriler */}
          <View style={styles.categoriesSection}>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={renderCategoryItem}
              contentContainerStyle={styles.categoriesList}
            />
          </View>

          {/* Size Özel Etkinlikler */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="flame" size={20} color="#FF7043" />
                <Text style={styles.sectionTitle}>Size Özel Etkinlikler</Text>
              </View>
            </View>
            
            <Text style={styles.sectionSubtitle}>
              {isAuthenticated 
                ? 'Hobi ve ilgi alanlarınıza göre, bulunduğunuz ildeki etkinlikler burada listelenir.' 
                : 'Giriş yaparak hobilerinize ve bulunduğunuz ile göre etkinlikleri görebilirsiniz.'}
            </Text>
            
            <View style={styles.divider} />
            
            {!isAuthenticated ? (
              <View style={styles.infoCard}>
                <Text style={styles.infoText}>
                  Hobilerinize uygun etkinlikleri görmek için giriş yapın
                </Text>
                <TouchableOpacity 
                  style={styles.loginButtonSmall}
                  onPress={navigateToLogin}
                >
                  <Text style={styles.loginButtonSmallText}>Giriş Yap</Text>
                </TouchableOpacity>
              </View>
            ) : recommendedLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary.main} />
              </View>
            ) : recommendedEvents.length === 0 ? (
              <View style={styles.infoCard}>
                <Text style={styles.infoText}>
                  Hobilerinize uygun etkinlik bulunamadı. Farklı hobiler ekleyebilir veya yeni etkinlikler oluşturabilirsiniz.
                </Text>
              </View>
            ) : (
              <View style={styles.recommendedEventsContainer}>
                <FlatList
                  data={recommendedEvents}
                  keyExtractor={(item) => item._id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <View style={styles.recommendedEventCardContainer}>
                      <EventCard event={item} />
                    </View>
                  )}
                  contentContainerStyle={styles.recommendedEventsList}
                />
                
                {recommendedEvents.length > 0 && (
                  <TouchableOpacity 
                    style={styles.viewAllButton}
                    onPress={() => setSelectedCategory('Tümü')}
                  >
                    <Text style={styles.viewAllButtonText}>Tüm Etkinlikleri Görüntüle</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tab, tabValue === 0 && styles.activeTab]}
              onPress={() => handleTabChange(0)}
            >
              <Ionicons 
                name="calendar" 
                size={20} 
                color={tabValue === 0 ? colors.primary.main : '#777'} 
              />
              <Text 
                style={[styles.tabText, tabValue === 0 && styles.activeTabText]}
              >
                Etkinlikler
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, tabValue === 1 && styles.activeTab]}
              onPress={() => handleTabChange(1)}
            >
              <Ionicons 
                name="location" 
                size={20} 
                color={tabValue === 1 ? colors.primary.main : '#777'} 
              />
              <Text 
                style={[styles.tabText, tabValue === 1 && styles.activeTabText]}
              >
                Yakınımdaki
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, tabValue === 2 && styles.activeTab]}
              onPress={() => handleTabChange(2)}
            >
              <Ionicons 
                name="people" 
                size={20} 
                color={tabValue === 2 ? colors.primary.main : '#777'} 
              />
              <Text 
                style={[styles.tabText, tabValue === 2 && styles.activeTabText]}
              >
                Arkadaşlarım
              </Text>
            </TouchableOpacity>
          </View>

          {/* Etkinlikler Başlığı */}
          <View style={styles.eventsHeader}>
            <Text style={styles.eventsTitle}>
              {selectedCategory === 'Tümü' ? 'Tüm Etkinlikler' : `${selectedCategory} Etkinlikleri`}
            </Text>
            {!loading && (
              <Text style={styles.eventCount}>
                {pagination.total} etkinlik bulundu
              </Text>
            )}
          </View>

          {/* İlgi Alanları */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="bookmark" size={20} color={colors.primary.main} />
                <Text style={styles.sectionTitle}>İlgi Alanlarınız</Text>
              </View>
            </View>
            
            <View style={styles.interestsContainer}>
              {userInterests.map(interest => (
                <TouchableOpacity 
                  key={interest} 
                  style={styles.interestTag}
                >
                  <Text style={styles.interestTagText}>{interest}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.addInterestButton}>
                <Text style={styles.addInterestText}>+ Düzenle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        
        {/* Etkinlikler Listesi - Sayfalandırmalı */}
        {loading && events.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary.main} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={getFilteredEvents()}
            keyExtractor={(item) => item._id.toString()}
            renderItem={renderEventItem}
            contentContainerStyle={styles.eventsGrid}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMoreEvents}
            onEndReachedThreshold={0.3}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Bu kategoride şu anda etkinlik bulunmuyor.</Text>
                <TouchableOpacity 
                  style={styles.createEventButtonSmall}
                  onPress={navigateToCreateEvent}
                >
                  <Text style={styles.createEventButtonSmallText}>Etkinlik Oluştur</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  heroSection: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 0,
    marginBottom: 16,
    backgroundColor: '#4A56E2',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  createEventButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  createEventButtonText: {
    color: colors.primary.main,
    fontWeight: 'bold',
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#777',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    color: '#2196F3',
    textAlign: 'center',
    marginBottom: 8,
  },
  loginButtonSmall: {
    backgroundColor: colors.primary.main,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'center',
  },
  loginButtonSmallText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  recommendedEventsContainer: {
    marginTop: 8,
  },
  recommendedEventsList: {
    paddingBottom: 8,
  },
  recommendedEventCardContainer: {
    width: width * 0.7,
    marginRight: 12,
  },
  viewAllButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.primary.main,
    borderRadius: 6,
    marginTop: 12,
  },
  viewAllButtonText: {
    color: colors.primary.main,
    fontWeight: 'bold',
  },
  categoriesSection: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1,
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedCategoryItem: {
    backgroundColor: colors.primary.main,
  },
  categoryText: {
    marginLeft: 6,
    color: '#333',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary.main,
  },
  tabText: {
    marginLeft: 4,
    color: '#777',
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary.main,
  },
  eventsHeader: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  eventsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  eventCount: {
    color: '#777',
    fontSize: 14,
    marginTop: 4,
  },
  eventsGrid: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  eventCardContainer: {
    marginBottom: 16,
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
  },
  emptyContainer: {
    margin: 16,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyText: {
    color: '#777',
    marginBottom: 16,
    textAlign: 'center',
  },
  createEventButtonSmall: {
    backgroundColor: colors.primary.main,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  createEventButtonSmallText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  interestTag: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  interestTagText: {
    color: '#555',
    fontSize: 14,
  },
  addInterestButton: {
    borderWidth: 1,
    borderColor: colors.primary.main,
    borderStyle: 'dashed',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  addInterestText: {
    color: colors.primary.main,
    fontSize: 14,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  footerText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  }
});

export default HomeScreen; 