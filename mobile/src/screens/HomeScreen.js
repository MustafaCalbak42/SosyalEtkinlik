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
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  const { isLoggedIn, userProfile } = useAuth();
  
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
    
    if (isLoggedIn) {
      console.log('[HomeScreen] Kullanıcı giriş yaptı, önerilen etkinlikler yükleniyor...');
      fetchRecommendedEvents();
    }
  }, [isLoggedIn, selectedCategory]);

  // Etkinlikleri getir
  const fetchEvents = async (page = 1, limit = pagination.limit, category = selectedCategory) => {
    setLoading(page === 1);
    setError('');
    
    try {
      // Kategori 'Tümü' ise API'ye kategori parametresi gönderme
      const categoryParam = category === 'Tümü' ? null : category;
      const response = await getAllEvents(page, limit, categoryParam);
      
      if (response && response.success) {
        // API'den gelen verileri doğrula
        const validEvents = (response.data || []).filter(event => 
          event && typeof event === 'object' && event._id
        );
        
        // Her sayfa değişikliğinde, veri setini yenile (artık sonsuz kaydırma yapmıyoruz)
        setEvents(validEvents);
        
        // Popüler etkinlikleri ayarla (en çok katılımcısı olanlar)
        if (validEvents.length > 0) {
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
      console.log('[HomeScreen] Kullanıcı profili:', userProfile ? 'mevcut' : 'yok');
      console.log('[HomeScreen] isLoggedIn durumu:', isLoggedIn);
      
      // İlk olarak login durumunu kontrol et
      if (!isLoggedIn) {
        console.warn('[HomeScreen] Kullanıcı giriş yapmamış, önerilen etkinlikler yüklenemiyor');
        setRecommendedLoading(false);
        return;
      }
      
      // Token kontrolü
      const token = await AsyncStorage.getItem('token');
      if (!token || token.trim().length === 0) {
        console.warn('[HomeScreen] Token bulunamadı veya geçersiz, önerilen etkinlikler yüklenemiyor');
        setRecommendedLoading(false);
        return;
      }
      
      console.log('[HomeScreen] Token mevcut, uzunluk:', token.trim().length);
      
      // Kullanıcının şehir/il bilgisini al
      let userCity = null;
      if (userProfile && userProfile.location) {
        // Konum bilgisi farklı formatlarda olabilir
        if (typeof userProfile.location === 'string') {
          // Doğrudan şehir adı ise
          userCity = userProfile.location;
        } else if (userProfile.location.city) {
          // Nesne içinde city alanı varsa
          userCity = userProfile.location.city;
        } else if (userProfile.location.address) {
          // Adres bilgisi varsa (il adını çıkarmaya çalış)
          const addressParts = userProfile.location.address.split(',');
          if (addressParts.length > 0) {
            // İl adı genellikle ilk parçadır - Türkiye adres formatına göre
            userCity = addressParts[0].trim();
          } else {
            userCity = userProfile.location.address.trim();
          }
        }
      }
      
      console.log(`[HomeScreen] Kullanıcının ili: ${userCity || 'Bilinmiyor'}`);
      
      try {
        // Şehir bilgisini getRecommendedEvents fonksiyonuna aktar
        const response = await getRecommendedEvents(1, 4, userCity);
        
        if (response && response.success) {
          // API'den gelen verileri doğrula
          const validEvents = (response.data || []).filter(event => 
            event && typeof event === 'object' && event._id
          );
          
          console.log(`[HomeScreen] ${validEvents.length} önerilen etkinlik yüklendi`);
          
          // İl bazlı mı kontrol et
          if (response.message && response.message.includes('ilinizdeki')) {
            console.log('[HomeScreen] Etkinlikler il bazlı filtrelendi:', response.message);
          }
          
          setRecommendedEvents(validEvents);
        } else {
          console.warn('Önerilen etkinlikler yüklenemedi:', response?.message);
          // Alternatif olarak, tüm etkinlikleri kullan (en son eklenen 4 etkinlik)
          if (events && events.length > 0) {
            console.log('[HomeScreen] Alternatif olarak en son etkinlikler gösteriliyor');
            const recentEvents = [...events].sort((a, b) => 
              new Date(b.createdAt) - new Date(a.createdAt)
            ).slice(0, 4);
            setRecommendedEvents(recentEvents);
          }
        }
      } catch (apiError) {
        console.error('[HomeScreen] API hatası:', apiError.message);
        // Alternatif olarak, tüm etkinlikleri kullan (en son eklenen 4 etkinlik)
        if (events && events.length > 0) {
          console.log('[HomeScreen] API hatası sonrası alternatif olarak en son etkinlikler gösteriliyor');
          const recentEvents = [...events].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          ).slice(0, 4);
          setRecommendedEvents(recentEvents);
        }
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
    // Sayfa 1'e dön ve verileri yenile
    setPagination({
      ...pagination,
      page: 1
    });
    
    Promise.all([
      fetchEvents(1, pagination.limit, selectedCategory),
      isLoggedIn ? fetchRecommendedEvents() : Promise.resolve()
    ]).finally(() => {
      setRefreshing(false);
    });
  }, [isLoggedIn, selectedCategory, pagination.limit]);

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
    if (isLoggedIn) {
      navigation.navigate('CreateEvent');
    } else {
      navigateToLogin();
    }
  };

  // Tab değiştirme
  const handleTabChange = (index) => {
    setTabValue(index);
  };
  
  // Kategoriler için düz görünüm oluşturma
  const renderCategories = () => {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesList}
      >
        {categories.map((item) => (
          <TouchableOpacity 
            key={item.id}
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
        ))}
      </ScrollView>
    );
  };

  // Etkinlik listesini render et
  const renderEventItem = ({ item }) => {
    console.log(`[EventItem] Etkinlik: ${item.title}, Hobi: ${item.hobby?.name || 'Bilinmiyor'}, Kategori: ${item.hobby?.category || item.category || 'Bilinmiyor'}`);
    return (
      <View style={styles.eventCardContainer}>
        <EventCard event={item} />
      </View>
    );
  };

  // Kategori filtresi güvenli şekilde uygula
  const getFilteredEvents = () => {
    if (!events || !Array.isArray(events)) return [];
    
    // Tümü seçiliyse filtreleme yapmadan tüm etkinlikleri döndür
    if (selectedCategory === 'Tümü') {
      return events;
    }
    
    console.log(`[HomeScreen] ${selectedCategory} için etkinlikler filtreleniyor`);
    console.log('[HomeScreen] İlk 3 etkinliğin hobi bilgileri:', events.slice(0, 3).map(event => ({
      title: event.title,
      hobbyName: event.hobby?.name,
      hobbyCategory: event.hobby?.category,
      category: event.category
    })));
    
    // Kategori filtrelemesi yap
    return events.filter(event => {
      // Normalde backend'den olması gereken filtremeyi öncelikle kontrol et
      // Bu, backend kategoriye göre filtrelemenin yeterli olmadığı durumda ikincil filtre olarak çalışır
      
      // 1. İlk olarak hobby objesi içinde category alanını kontrol et (en güvenilir yöntem)
      if (event.hobby && typeof event.hobby === 'object' && event.hobby.category) {
        const hobbyCategory = event.hobby.category.trim().toLowerCase();
        const selectedCategoryLower = selectedCategory.trim().toLowerCase();
        
        if (hobbyCategory === selectedCategoryLower) {
          return true;
        }
      }
      
      // 2. Eğer hobby objesi içinde kategori yoksa, hobby adını kontrol et
      // Bazı hobi adları kategori olarak da kullanılabiliyor
      if (event.hobby && typeof event.hobby === 'object' && event.hobby.name) {
        const hobbyName = event.hobby.name.trim().toLowerCase();
        const selectedCategoryLower = selectedCategory.trim().toLowerCase();
        
        if (hobbyName === selectedCategoryLower) {
          return true;
        }
      }
      
      // 3. Eski API formatı için düz category alanını kontrol et
      if (event.category) {
        const categoryField = event.category.trim().toLowerCase();
        const selectedCategoryLower = selectedCategory.trim().toLowerCase();
        
        if (categoryField === selectedCategoryLower) {
          return true;
        }
      }
      
      // 4. Son olarak hobbyName alanını kontrol et
      if (event.hobbyName) {
        const hobbyNameField = event.hobbyName.trim().toLowerCase();
        const selectedCategoryLower = selectedCategory.trim().toLowerCase();
        
        if (hobbyNameField === selectedCategoryLower) {
          return true;
        }
      }
      
      // Hiçbir kriter eşleşmedi, bu etkinliği filtrelenmiş listede gösterme
      return false;
    });
  };

  // Önerilen etkinlikler listesini yatay olarak göster
  const renderRecommendedEvents = () => {
    if (!isLoggedIn) {
      return (
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
      );
    }

    if (recommendedLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary.main} />
        </View>
      );
    }

    if (recommendedEvents.length === 0) {
      return (
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            {userProfile && userProfile.city 
              ? `${userProfile.city} ilinde hobilerinize uygun etkinlik bulunamadı. Farklı hobiler ekleyebilir veya yeni etkinlikler oluşturabilirsiniz.` 
              : 'Hobilerinize uygun etkinlik bulunamadı. Farklı hobiler ekleyebilir veya yeni etkinlikler oluşturabilirsiniz.'}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.recommendedEventsList}
      >
        {recommendedEvents.map((item) => (
          <View key={item._id} style={styles.recommendedEventCardContainer}>
            <EventCard event={item} />
          </View>
        ))}
      </ScrollView>
    );
  };

  // Ana ekran içeriklerini header'a render et
  const renderHeader = () => {
    return (
      <>
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
          {renderCategories()}
        </View>

        {/* Size Özel Etkinlikler */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="flame" size={20} color="#FF7043" />
              <Text style={styles.sectionTitle}>
                {isLoggedIn && userProfile && userProfile.city 
                  ? `${userProfile.city} İlindeki Etkinlikler` 
                  : 'Size Özel Etkinlikler'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.sectionSubtitle}>
            {isLoggedIn 
              ? userProfile && userProfile.city 
                ? `${userProfile.city} ili ve ilgi alanlarınıza göre önerilen etkinlikler`
                : 'Hobi ve ilgi alanlarınıza göre, bulunduğunuz ildeki etkinlikler burada listelenir.' 
              : 'Giriş yaparak hobilerinize ve bulunduğunuz ile göre etkinlikleri görebilirsiniz.'}
          </Text>
          
          <View style={styles.divider} />
          
          <View style={styles.recommendedEventsContainer}>
            {renderRecommendedEvents()}
            
            {recommendedEvents.length > 0 && (
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => setSelectedCategory('Tümü')}
              >
                <Text style={styles.viewAllButtonText}>Tüm Etkinlikleri Görüntüle</Text>
              </TouchableOpacity>
            )}
          </View>
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
      </>
    );
  };

  // Sayfalandırma Komponenti
  const Pagination = () => {
    // Gösterilecek sayfa sayısı (sayfa numarası butonları)
    const pageButtonsToShow = 5;
    const currentPage = pagination.page;
    const totalPages = pagination.pages;
    
    // Kullanıcı henüz yüklenmemişse veya tek sayfa varsa sayfalandırmayı gösterme
    if (loading || totalPages <= 1) {
      return null;
    }
    
    // Hangi sayfa numaralarını göstereceğimizi hesapla
    const calculatePageNumbers = () => {
      // Toplam sayfa sayısı gösterilecek sayfa sayısından az ise hepsini göster
      if (totalPages <= pageButtonsToShow) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }
      
      // Aksi halde, mevcut sayfayı ortada tutmaya çalış
      let start = Math.max(currentPage - Math.floor(pageButtonsToShow / 2), 1);
      let end = start + pageButtonsToShow - 1;
      
      // Eğer son sayfa toplam sayfa sayısını aşıyorsa, düzelt
      if (end > totalPages) {
        end = totalPages;
        start = Math.max(end - pageButtonsToShow + 1, 1);
      }
      
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    };
    
    // Sayfa değiştirme işlemi
    const handlePageChange = (page) => {
      if (page === currentPage || page < 1 || page > totalPages) {
        return;
      }
      
      // Sayfayı değiştir ve verileri yükle
      setPagination({
        ...pagination,
        page: page
      });
      fetchEvents(page, pagination.limit, selectedCategory);
      
      // Listeyi en başa kaydır
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: true });
      }
    };
    
    const pageNumbers = calculatePageNumbers();
    
    return (
      <View style={styles.paginationContainer}>
        {/* Önceki Sayfa Butonu */}
        <TouchableOpacity
          style={[
            styles.paginationButton,
            currentPage === 1 ? styles.paginationButtonDisabled : null
          ]}
          onPress={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? "#999" : "#333"} />
        </TouchableOpacity>
        
        {/* Sayfa Numaraları */}
        {pageNumbers.map(pageNumber => (
          <TouchableOpacity
            key={pageNumber}
            style={[
              styles.paginationButton,
              currentPage === pageNumber ? styles.paginationButtonActive : null
            ]}
            onPress={() => handlePageChange(pageNumber)}
          >
            <Text
              style={[
                styles.paginationButtonText,
                currentPage === pageNumber ? styles.paginationButtonTextActive : null
              ]}
            >
              {pageNumber}
            </Text>
          </TouchableOpacity>
        ))}
        
        {/* Sonraki Sayfa Butonu */}
        <TouchableOpacity
          style={[
            styles.paginationButton,
            currentPage === totalPages ? styles.paginationButtonDisabled : null
          ]}
          onPress={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <Ionicons name="chevron-forward" size={16} color={currentPage === totalPages ? "#999" : "#333"} />
        </TouchableOpacity>
      </View>
    );
  };

  const flatListRef = React.useRef(null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#4A56E2" barStyle="light-content" />
      {loading && events.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            ref={flatListRef}
            data={getFilteredEvents()}
            keyExtractor={(item) => item._id.toString()}
            renderItem={renderEventItem}
            contentContainerStyle={styles.eventsGrid}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={renderHeader}
            ListFooterComponent={renderFooter}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
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
          <Pagination />
        </View>
      )}
      
      {/* Etkinlik Oluşturma Butonu - FAB */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={navigateToCreateEvent}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
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
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20,
    backgroundColor: colors.primary.main,
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 999,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  paginationButton: {
    minWidth: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  paginationButtonActive: {
    backgroundColor: colors.primary.main,
  },
  paginationButtonDisabled: {
    backgroundColor: '#f0f0f0',
    opacity: 0.7,
  },
  paginationButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  paginationButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default HomeScreen; 