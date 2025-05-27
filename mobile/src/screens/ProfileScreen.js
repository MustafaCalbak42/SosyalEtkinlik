import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Switch,
  FlatList,
  RefreshControl
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../shared/api/apiClient';
import { getUserCreatedEvents } from '../services/eventService';
import AuthContext from '../contexts/AuthContext';
import { CommonActions } from '@react-navigation/native';
import colors from '../shared/theme/colors';

const ProfileScreen = ({ navigation }) => {
  const { logout, userProfile, refreshUserProfile } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [hobbies, setHobbies] = useState([]);
  const [userEvents, setUserEvents] = useState([]);
  const [participatedEvents, setParticipatedEvents] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingParticipatedEvents, setLoadingParticipatedEvents] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // Şifre değiştirme state'leri
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (userProfile) {
      console.log('Using profile from AuthContext:', userProfile);
      setUser(userProfile);
      setName(userProfile.fullName || '');
      setEmail(userProfile.email || '');
      setBio(userProfile.bio || '');
      
      // Konum bilgisini ayarla
      if (userProfile.location) {
        if (typeof userProfile.location === 'string') {
          setLocation(userProfile.location);
        } else if (userProfile.location.address) {
          setLocation(userProfile.location.address);
        } else if (userProfile.location.city) {
          setLocation(userProfile.location.city);
        }
      }
      
      // Hobiler
      if (userProfile.hobbies && Array.isArray(userProfile.hobbies)) {
        setHobbies(userProfile.hobbies);
      }
      
      setLoading(false);
    }
  }, [userProfile]);
  
  // Komponentin yüklenmesinde ve token değiştiğinde profili yeniden yükle
  useEffect(() => {
    const loadProfileData = async () => {
      console.log('ProfileScreen mount - loading profile data');
      
      try {
        const token = await AsyncStorage.getItem('token');
        console.log('ProfileScreen - Token mevcut:', !!token);
        
        if (token) {
          fetchUserProfile();
          fetchUserEvents();
          fetchParticipatedEvents();
        } else {
          console.warn('ProfileScreen - Token bulunamadı, profil yüklenemiyor');
          setError('Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
        }
      } catch (error) {
        console.error('ProfileScreen token check error:', error);
      }
    };
    
    loadProfileData();
  }, []);
  
  // Kullanıcı profil bilgilerini getir
  const fetchUserProfile = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Fetching user profile...');
      const response = await api.user.getProfile();
      console.log('API Yanıtı:', JSON.stringify(response.data, null, 2));
      
      // Backend yanıt yapısı doğrudan { success: true, data: user } şeklinde
      if (response.data && response.data.success && response.data.data) {
        // Backend API'nin döndürdüğü yapıyı doğru şekilde kullan
        const userData = response.data.data;
        
        setUser(userData);
        setName(userData.fullName || '');
        setEmail(userData.email || '');
        setBio(userData.bio || '');
        
        // Konum bilgisini ayarla
        if (userData.location) {
          if (typeof userData.location === 'string') {
            setLocation(userData.location);
          } else if (userData.location.address) {
            setLocation(userData.location.address);
          } else if (userData.location.city) {
            setLocation(userData.location.city);
          }
        }
        
        // Hobiler
        if (userData.hobbies && Array.isArray(userData.hobbies)) {
          setHobbies(userData.hobbies);
        }
        
        // AuthContext'i güncelle
        if (refreshUserProfile) {
          await refreshUserProfile();
        }
        
        setLoading(false);
        return true;
      } else {
        console.error('User data not found in response:', response.data);
        
        // Eğer AuthContext'te userProfile varsa onu kullan
        if (userProfile) {
          console.log('Falling back to userProfile from AuthContext');
          setUser(userProfile);
          setName(userProfile.fullName || '');
          setEmail(userProfile.email || '');
          setBio(userProfile.bio || '');
          
          if (userProfile.location) {
            if (typeof userProfile.location === 'string') {
              setLocation(userProfile.location);
            } else if (userProfile.location.address) {
              setLocation(userProfile.location.address);
            } else if (userProfile.location.city) {
              setLocation(userProfile.location.city);
            }
          }
          
          if (userProfile.hobbies && Array.isArray(userProfile.hobbies)) {
            setHobbies(userProfile.hobbies);
          }
        } else {
          setError('Kullanıcı bilgileri alınamadı');
        }
        
        setLoading(false);
        return false;
      }
    } catch (err) {
      console.error('Profil bilgisi alma hatası:', err);
      
      if (err.response?.status === 401) {
        console.log('401 Unauthorized error - redirecting to login');
        Alert.alert(
          'Oturum Süresi Doldu',
          'Lütfen tekrar giriş yapın.',
          [
            {
              text: 'Tamam',
              onPress: () => {
                logout();
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  })
                );
              },
            },
          ]
        );
      } else {
        setError('Profil bilgisi alınamadı: ' + err.message);
      }
      
      setLoading(false);
      return false;
    }
  };
  
  // Kullanıcının etkinliklerini getir
  const fetchUserEvents = async () => {
    setLoadingEvents(true);
    
    try {
      console.log('[ProfileScreen] Kullanıcının oluşturduğu etkinlikler yükleniyor...');
      
      // Kullanıcının oluşturduğu etkinlikleri getir
      const response = await getUserCreatedEvents();
      
      console.log('[ProfileScreen] Oluşturulan etkinlikler API yanıtı:', JSON.stringify(response, null, 2));
      
      if (response.success && Array.isArray(response.data)) {
        setUserEvents(response.data);
        console.log(`[ProfileScreen] ${response.data.length} oluşturulan etkinlik bulundu`);
        
        // İlk 3 etkinliği detaylı olarak logla
        if (response.data.length > 0) {
          console.log('[ProfileScreen] İlk oluşturulan etkinlikler:');
          response.data.slice(0, 3).forEach((event, index) => {
            console.log(`${index + 1}. ${event.title} - ${new Date(event.startDate).toLocaleString('tr-TR')}`);
          });
        }
      } else {
        console.error('[ProfileScreen] Beklenmeyen yanıt formatı:', response);
        setUserEvents([]);
      }
    } catch (error) {
      console.error('[ProfileScreen] Oluşturulan etkinlikleri yükleme hatası:', error);
      setUserEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Kullanıcının katıldığı etkinlikleri getir
  const fetchParticipatedEvents = async () => {
    setLoadingParticipatedEvents(true);
    
    try {
      console.log('[ProfileScreen] Katıldığı etkinlikler yükleniyor...');
      
      // Token kontrolü
      const token = await AsyncStorage.getItem('token');
      if (!token || token.trim().length === 0) {
        console.warn('[ProfileScreen] Token bulunamadı, katıldığı etkinlikler yüklenemiyor');
        setParticipatedEvents([]);
        setLoadingParticipatedEvents(false);
        return;
      }
      
      // Kullanıcının katıldığı etkinlikleri getir
      const response = await api.events.getParticipatedEvents();
      console.log('[ProfileScreen] Katıldığı etkinlikler API yanıtı:', JSON.stringify(response.data, null, 2));
      
      // Check for different response formats
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        // Standard API format with success and data properties
        const events = response.data.data;
        setParticipatedEvents(events);
        console.log(`[ProfileScreen] ${events.length} katıldığı etkinlik bulundu`);
        
        // İlk 3 etkinliği detaylı olarak logla
        if (events.length > 0) {
          console.log('[ProfileScreen] İlk katıldığı etkinlikler:');
          events.slice(0, 3).forEach((event, index) => {
            console.log(`${index + 1}. ${event.title} - ${new Date(event.startDate).toLocaleString('tr-TR')}`);
          });
        }
      } else if (response.data && Array.isArray(response.data)) {
        // Direct array format
        setParticipatedEvents(response.data);
        console.log(`[ProfileScreen] ${response.data.length} katıldığı etkinlik bulundu (direct array)`);
      } else {
        console.error('[ProfileScreen] Beklenmeyen yanıt formatı:', response.data);
        setParticipatedEvents([]);
      }
    } catch (error) {
      console.error('[ProfileScreen] Katıldığı etkinlikleri yükleme hatası:', error);
      
      // API hatası detaylarını logla
      if (error.response) {
        console.error('[ProfileScreen] API hatası status:', error.response.status);
        console.error('[ProfileScreen] API hatası data:', error.response.data);
      }
      
      setParticipatedEvents([]);
    } finally {
      setLoadingParticipatedEvents(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      setError('Ad ve soyad alanı boş olamaz');
      return;
    }
    
    setUpdatingProfile(true);
    setError('');
    setSuccess('');
    
    try {
      const updateData = {
        name,
        bio,
        location: {
          type: 'Point',
          coordinates: [0, 0], // Koordinatlar boş bırakılabilir ya da kullanıcının konumu alınabilir
          address: location // Kullanıcının girdiği konum bilgisi
        }
      };
      
      console.log('Gönderilen profil güncelleme verisi:', JSON.stringify(updateData, null, 2));
      
      const response = await api.user.updateProfile(updateData);
      
      if (response.data && response.data.success) {
        setSuccess('Profil başarıyla güncellendi');
        setUser({...user, ...updateData});
        setIsEditing(false);
        
        // AuthContext'i güncelle
        if (refreshUserProfile) {
          await refreshUserProfile();
        }
      } else {
        setError(response.data?.message || 'Profil güncellenemedi');
      }
    } catch (err) {
      console.error('Profil güncelleme hatası:', err);
      setError(
        err.response?.data?.message || 
        'Profil güncellenirken bir hata oluştu'
      );
    } finally {
      setUpdatingProfile(false);
    }
  };
  
  // Şifre değiştirme işlemi
  const handleChangePassword = async () => {
    // Validasyon
    setPasswordError('');
    
    if (!currentPassword) {
      setPasswordError('Mevcut şifrenizi girmelisiniz');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Yeni şifre en az 6 karakter olmalıdır');
      return;
    }
    
    // Backend'den gelen şifre validasyonuna uygunluk kontrolleri
    if (!/\d/.test(newPassword)) {
      setPasswordError('Yeni şifre en az bir rakam içermelidir');
      return;
    }
    
    if (!/[a-z]/.test(newPassword)) {
      setPasswordError('Yeni şifre en az bir küçük harf içermelidir');
      return;
    }
    
    if (!/[A-Z]/.test(newPassword)) {
      setPasswordError('Yeni şifre en az bir büyük harf içermelidir');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Şifreler eşleşmiyor');
      return;
    }
    
    setUpdatingPassword(true);
    
    try {
      console.log('Şifre değiştirme isteği gönderiliyor...');
      
      const response = await api.user.changePassword({
        currentPassword,
        newPassword
      });
      
      console.log('Şifre değiştirme yanıtı:', JSON.stringify(response.data, null, 2));
      
      if (response.data && response.data.success) {
        Alert.alert('Başarılı', 'Şifreniz başarıyla değiştirildi');
        setShowPasswordModal(false);
        resetPasswordForm();
      } else {
        console.error('Şifre değiştirme başarısız:', response.data);
        setPasswordError(
          response.data?.message || 
          response.data?.errors?.[0]?.msg || 
          'Şifre değiştirme işlemi başarısız'
        );
      }
    } catch (err) {
      console.error('Şifre değiştirme hatası:', err);
      
      // API yanıt hata detaylarını al
      const errorMessage = 
        err.response?.data?.message || 
        err.response?.data?.errors?.[0]?.msg || 
        'Şifre değiştirilirken bir hata oluştu';
      
      console.error('Hata detayı:', JSON.stringify(err.response?.data, null, 2));
      
      setPasswordError(errorMessage);
    } finally {
      setUpdatingPassword(false);
    }
  };
  
  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setShowPassword(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Çıkış Yap', 
      'Hesabınızdan çıkış yapmak istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            try {
              // Token'ları temizle
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('refreshToken');
              
              // AuthContext üzerinden logout çağır
              await logout();
              
              console.log('Logging out... Navigating to Auth screen');
              
              // Ana navigatör üzerinden Auth ekranına yönlendir
              navigation.dispatch(
                CommonActions.navigate({
                  name: 'Auth',
                  params: {},
                })
              );
            } catch (err) {
              console.error('Çıkış yapma hatası:', err);
              Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu');
            }
          }
        }
      ]
    );
  };

  const toggleEditMode = () => {
    if (isEditing) {
      // Değişiklikleri iptal et
      setName(user?.name || '');
      setBio(user?.bio || '');
      setLocation(user?.location?.address || user?.location?.city || '');
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };
  
  // Etkinlik detayına git
  const navigateToEventDetail = (eventId) => {
    navigation.navigate('EventDetail', { eventId });
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

  // Profil sayfasını yenileme
  const onRefresh = async () => {
    setRefreshing(true);
    
    try {
      console.log('[ProfileScreen] Sayfa yenileniyor...');
      await Promise.all([
        fetchUserProfile(),
        fetchUserEvents(),
        fetchParticipatedEvents()
      ]);
      console.log('[ProfileScreen] Sayfa yenileme tamamlandı');
    } catch (error) {
      console.error('[ProfileScreen] Sayfa yenileme hatası:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Profil bilgileri yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary.main]}
        />
      }
    >
      {/* Üst Profil Alanı */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(name)}
              </Text>
            </View>
            {!isEditing ? (
              <Text style={styles.userName}>{name}</Text>
            ) : (
              <TextInput
                style={styles.userNameInput}
                value={name}
                onChangeText={setName}
                placeholder="Ad Soyad"
              />
            )}
          </View>
          
          {!isEditing ? (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={toggleEditMode}
            >
              <MaterialIcons name="edit" size={20} color="#1976d2" />
              <Text style={styles.editButtonText}>Düzenle</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={toggleEditMode}
            >
              <MaterialIcons name="cancel" size={20} color="#f44336" />
              <Text style={styles.cancelButtonText}>İptal</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.userStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userEvents.length}</Text>
            <Text style={styles.statLabel}>Oluşturduğu Etkinlik</Text>
          </View>
        </View>
      </View>
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      
      {success ? (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>{success}</Text>
        </View>
      ) : null}
      
      <View style={styles.formContainer}>
        {/* E-posta */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>E-posta Adresi</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={24} color="#777" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={email}
              editable={false}
            />
          </View>
          <Text style={styles.helperText}>E-posta adresiniz değiştirilemez</Text>
        </View>
        
        {/* Konum */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Konum</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="location-on" size={24} color="#777" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={location}
              onChangeText={setLocation}
              placeholder="Şehir, İlçe"
              editable={isEditing}
            />
          </View>
        </View>
        
        {/* Biyografi */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hakkımda</Text>
          <View style={[styles.inputContainer, { height: 100 }]}>
            <MaterialIcons name="description" size={24} color="#777" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.textArea, !isEditing && styles.disabledInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Kendiniz hakkında kısa bir bilgi"
              editable={isEditing}
              multiline={true}
              textAlignVertical="top"
            />
          </View>
        </View>
        
        {/* Kullanıcının İlgi Alanları/Hobileri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İlgi Alanlarım</Text>
          <View style={styles.hobbiesContainer}>
            {hobbies.length > 0 ? (
              hobbies.map((hobby, index) => (
                <View key={index} style={styles.hobbyTag}>
                  <Text style={styles.hobbyText}>
                    {typeof hobby === 'string' ? hobby : hobby.name}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Henüz ilgi alanı eklenmemiş</Text>
            )}
          </View>
          {isEditing && (
            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.addButtonText}>İlgi Alanı Ekle</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Kullanıcının Etkinlikleri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Etkinliklerim</Text>
          
          {loadingEvents ? (
            <ActivityIndicator size="small" color={colors.primary.main} />
          ) : userEvents.length > 0 ? (
            <View style={styles.eventsContainer}>
              {userEvents.slice(0, 3).map((event, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.eventItem}
                  onPress={() => navigateToEventDetail(event._id)}
                >
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventDate}>
                      {new Date(event.startDate).toLocaleString('tr-TR')}
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color="#777" />
                </TouchableOpacity>
              ))}
              
              {userEvents.length > 3 && (
                <TouchableOpacity style={styles.showMoreButton}>
                  <Text style={styles.showMoreText}>Tüm Etkinliklerim</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Text style={styles.emptyText}>Henüz etkinliğiniz bulunmuyor</Text>
          )}
        </View>
        
        {/* Kullanıcının Katıldığı Etkinlikler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Katıldığım Etkinlikler</Text>
          
          {loadingParticipatedEvents ? (
            <ActivityIndicator size="small" color={colors.primary.main} />
          ) : participatedEvents.length > 0 ? (
            <View style={styles.eventsContainer}>
              {participatedEvents.slice(0, 3).map((event, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.eventItem}
                  onPress={() => navigateToEventDetail(event._id)}
                >
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventDate}>
                      {new Date(event.startDate).toLocaleString('tr-TR')}
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color="#777" />
                </TouchableOpacity>
              ))}
              
              {participatedEvents.length > 3 && (
                <TouchableOpacity 
                  style={styles.showMoreButton}
                  onPress={() => navigation.navigate('ParticipatedEvents')}
                >
                  <Text style={styles.showMoreText}>Tüm Katıldığım Etkinlikler</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Text style={styles.emptyText}>Henüz katıldığınız etkinlik bulunmuyor</Text>
          )}
        </View>
        
        {isEditing && (
          <TouchableOpacity 
            style={[styles.saveButton, updatingProfile ? styles.disabledButton : null]}
            onPress={handleUpdateProfile}
            disabled={updatingProfile}
          >
            {updatingProfile ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialIcons name="save" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Değişiklikleri Kaydet</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        
        <View style={styles.divider} />
        
        {/* Hesap İşlemleri Bölümü */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hesap İşlemleri</Text>
          
          <TouchableOpacity 
            style={styles.accountActionButton}
            onPress={() => setShowPasswordModal(true)}
          >
            <MaterialIcons name="lock" size={24} color="#1976d2" />
            <Text style={styles.accountActionText}>Şifre Değiştir</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.accountActionButton, {borderBottomWidth: 0}]}
            onPress={handleLogout}
          >
            <MaterialIcons name="exit-to-app" size={24} color="#f44336" />
            <Text style={[styles.accountActionText, {color: '#f44336'}]}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Şifre Değiştirme Modal */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowPasswordModal(false);
          resetPasswordForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Şifre Değiştir</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowPasswordModal(false);
                  resetPasswordForm();
                }}
              >
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {passwordError ? (
              <View style={styles.errorContainerSmall}>
                <Text style={styles.errorText}>{passwordError}</Text>
              </View>
            ) : null}
            
            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mevcut Şifre</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry={!showPassword}
                    placeholder="Mevcut şifreniz"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <MaterialIcons
                      name={showPassword ? "visibility-off" : "visibility"}
                      size={24}
                      color="#777"
                    />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Yeni Şifre</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                    placeholder="Yeni şifreniz"
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Yeni Şifre (Tekrar)</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    placeholder="Yeni şifrenizi tekrar girin"
                  />
                </View>
              </View>
              
              <View style={styles.passwordOptions}>
                <Text>Şifreyi Göster</Text>
                <Switch
                  value={showPassword}
                  onValueChange={setShowPassword}
                  trackColor={{ false: "#ccc", true: "#81b0ff" }}
                  thumbColor={showPassword ? "#1976d2" : "#f4f3f4"}
                />
              </View>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => {
                  setShowPasswordModal(false);
                  resetPasswordForm();
                }}
              >
                <Text style={styles.cancelModalButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitModalButton, updatingPassword && styles.disabledButton]}
                onPress={handleChangePassword}
                disabled={updatingPassword}
              >
                {updatingPassword ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitModalButtonText}>Değiştir</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  headerCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userNameInput: {
    fontSize: 18,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1976d2',
    minWidth: 150,
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  editButtonText: {
    color: '#1976d2',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  cancelButtonText: {
    color: '#f44336',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 5,
    margin: 10,
    borderWidth: 1,
    borderColor: '#ef9a9a',
  },
  errorContainerSmall: {
    backgroundColor: '#ffebee',
    padding: 8,
    borderRadius: 5,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#ef9a9a',
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
  },
  successContainer: {
    backgroundColor: '#e8f5e9',
    padding: 10,
    borderRadius: 5,
    margin: 10,
    borderWidth: 1,
    borderColor: '#a5d6a7',
  },
  successText: {
    color: '#2e7d32',
    textAlign: 'center',
  },
  formContainer: {
    padding: 15,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#444',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputIcon: {
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 5,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#999',
  },
  helperText: {
    fontSize: 12,
    color: '#777',
    marginTop: 5,
    marginLeft: 5,
  },
  hobbiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  hobbyTag: {
    backgroundColor: '#e3f2fd',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  hobbyText: {
    color: '#1976d2',
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
  addButton: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 10,
  },
  addButtonText: {
    color: '#1976d2',
    fontWeight: '500',
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
  showMoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 5,
  },
  showMoreText: {
    color: '#1976d2',
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#1976d2',
    borderRadius: 5,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 20,
  },
  accountActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  accountActionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    marginBottom: 20,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 10,
  },
  passwordInput: {
    flex: 1,
    height: 50,
  },
  passwordOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 10,
  },
  submitModalButton: {
    backgroundColor: '#1976d2',
  },
  cancelModalButtonText: {
    color: '#333',
  },
  submitModalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ProfileScreen; 