import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  FlatList,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { getSimilarUsers } from '../services/userService';
import colors from '../shared/theme/colors';
import { API_URL } from '../shared/constants';

const SimilarUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { isLoggedIn } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    if (isLoggedIn) {
      fetchSimilarUsers();
    }
  }, [isLoggedIn]);

  const fetchSimilarUsers = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await getSimilarUsers(1, 5);
      if (response.success) {
        setUsers(response.data);
        console.log(`[SimilarUsers] ${response.data.length} benzer kullanıcı yüklendi`);
      } else {
        setError(response.message || 'Benzer kullanıcılar yüklenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Benzer kullanıcıları yüklerken hata:', error);
      setError('Benzer kullanıcılar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Giriş yapılmamışsa bilgi mesajı göster
  if (!isLoggedIn) {
    return (
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color={colors.primary.main} />
        <Text style={styles.infoText}>
          Sizinle aynı hobilere sahip kullanıcıları görmek için giriş yapın
        </Text>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
        >
          <Text style={styles.loginButtonText}>Giriş Yap</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Yükleme durumu
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary.main} />
        <Text style={styles.loadingText}>Benzer kullanıcılar yükleniyor...</Text>
      </View>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchSimilarUsers}
        >
          <Text style={styles.retryButtonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Kullanıcı yoksa
  if (users.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="person" size={36} color={colors.text.secondary} />
        <Text style={styles.emptyText}>
          Sizinle aynı hobilere sahip kullanıcı bulunamadı.
        </Text>
        <Text style={styles.emptySubText}>
          Profilinizde hobi bilgilerinizi ekleyerek benzer kullanıcıları keşfedebilirsiniz.
        </Text>
      </View>
    );
  }

  // Kullanıcı profiline git
  const handleUserPress = (username) => {
    navigation.navigate('UserProfile', { username });
  };

  // Kullanıcı initials oluştur (profil resmi yoksa)
  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const renderUserItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.userCard} 
        onPress={() => handleUserPress(item.username)}
      >
        <View style={styles.userHeader}>
          {item.profilePicture ? (
            <Image 
              source={{ uri: `${API_URL}/${item.profilePicture}` }} 
              style={styles.userAvatar} 
            />
          ) : (
            <View style={styles.userAvatarPlaceholder}>
              <Text style={styles.userAvatarText}>
                {getInitials(item.fullName || item.username)}
              </Text>
            </View>
          )}
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.fullName || item.username}</Text>
            <Text style={styles.userUsername}>@{item.username}</Text>
            {item.bio && (
              <Text style={styles.userBio} numberOfLines={1}>
                {item.bio}
              </Text>
            )}
          </View>
        </View>
        
        {/* Ortak hobiler */}
        {item.commonHobbies && item.commonHobbies.length > 0 && (
          <View style={styles.hobbiesContainer}>
            <Text style={styles.hobbiesLabel}>
              <Text style={styles.hobbiesCount}>{item.commonHobbiesCount || item.commonHobbies.length}</Text> ortak hobi
            </Text>
            <View style={styles.hobbiesList}>
              {item.commonHobbies.map((hobby, index) => (
                <View key={index} style={styles.hobbyChip}>
                  <Text style={styles.hobbyText}>
                    {typeof hobby === 'object' ? hobby.name : hobby}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listContainer: {
    paddingBottom: 12,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: colors.text.secondary,
    fontSize: 14,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: colors.error.main,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary.main,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.primary,
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 2,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: colors.text.primary,
  },
  userUsername: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  userBio: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  hobbiesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  hobbiesLabel: {
    fontSize: 12,
    color: colors.success.main,
    fontWeight: '500',
    marginBottom: 6,
  },
  hobbiesCount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  hobbiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  hobbyChip: {
    backgroundColor: colors.success.light,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  hobbyText: {
    fontSize: 11,
    color: colors.success.dark,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginVertical: 12,
  },
  loginButton: {
    backgroundColor: colors.primary.main,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default SimilarUsers; 