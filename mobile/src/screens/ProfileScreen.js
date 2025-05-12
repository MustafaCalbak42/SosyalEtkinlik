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
  Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../shared/api/apiClient';
import AuthContext from '../contexts/AuthContext';
import { CommonActions } from '@react-navigation/native';

const ProfileScreen = ({ navigation }) => {
  const { signOut } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.user.getProfile();
      
      if (response.data && response.data.user) {
        setUser(response.data.user);
        setName(response.data.user.name);
        setEmail(response.data.user.email);
      } else {
        setError('Kullanıcı bilgileri alınamadı');
      }
    } catch (err) {
      console.error('Profil bilgisi alma hatası:', err);
      
      if (err.response?.status === 401) {
        Alert.alert(
          'Oturum Süresi Doldu',
          'Lütfen tekrar giriş yapın.',
          [
            {
              text: 'Tamam',
              onPress: () => navigation.dispatch(
                CommonActions.navigate({
                  name: 'Auth',
                  params: {},
                })
              )
            }
          ]
        );
      } else {
        setError(
          err.response?.data?.message || 
          'Profil bilgileri alınırken bir hata oluştu'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      setError('Ad ve soyad alanı boş olamaz');
      return;
    }
    
    setUpdating(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await api.user.updateProfile({
        name
      });
      
      if (response.data && response.data.success) {
        setSuccess('Profil başarıyla güncellendi');
        setUser({...user, name});
        setIsEditing(false);
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
      setUpdating(false);
    }
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
              
              // AuthContext üzerinden signOut çağır
              await signOut();
              
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
      setName(user.name);
      setIsEditing(false);
    } else {
      setIsEditing(true);
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {name ? name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
        </View>
        
        {!isEditing ? (
          <TouchableOpacity 
            style={styles.editButton}
            onPress={toggleEditMode}
          >
            <MaterialIcons name="edit" size={24} color="#1976d2" />
            <Text style={styles.editButtonText}>Düzenle</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={toggleEditMode}
          >
            <MaterialIcons name="cancel" size={24} color="#f44336" />
            <Text style={styles.cancelButtonText}>İptal</Text>
          </TouchableOpacity>
        )}
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
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ad Soyad</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="person" size={24} color="#777" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              editable={isEditing}
            />
          </View>
        </View>
        
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
        
        {isEditing && (
          <TouchableOpacity 
            style={[styles.saveButton, updating ? styles.disabledButton : null]}
            onPress={handleUpdateProfile}
            disabled={updating}
          >
            {updating ? (
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
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <MaterialIcons name="exit-to-app" size={20} color="#f44336" />
          <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
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
  },
  avatarText: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
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
  logoutButton: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#f44336',
    borderRadius: 5,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default ProfileScreen; 