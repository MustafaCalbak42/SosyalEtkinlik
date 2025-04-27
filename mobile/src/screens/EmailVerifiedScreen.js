import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Image, 
  TouchableOpacity, 
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../shared/api/apiClient';
import { processVerificationDeepLink } from '../services/authService';

const EmailVerifiedScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    processParams();
  }, []);

  const processParams = async () => {
    try {
      // Route params'dan verileri al
      const params = route.params || {};
      console.log('Email verification params:', params);
      
      // Doğrulama parametrelerini işle
      const result = await processVerificationDeepLink(params);
      
      if (result.success) {
        setSuccess(true);
      } else {
        setSuccess(false);
        setError(result.message);
        
        if (result.email) {
          setEmail(result.email);
        }
      }
    } catch (err) {
      console.error('E-posta doğrulama parametreleri işlenirken hata:', err);
      setSuccess(false);
      setError('E-posta doğrulama bağlantısı işlenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Doğrulama e-postasını yeniden gönder
  const handleResendVerification = async () => {
    if (!email) {
      Alert.alert(
        'E-posta Adresi Gerekli', 
        'Doğrulama e-postasını yeniden göndermek için lütfen e-posta adresinizi girin.'
      );
      return;
    }

    setResendLoading(true);

    try {
      const response = await api.auth.resendVerification({ email });
      
      if (response.data && response.data.success) {
        Alert.alert(
          'Başarılı',
          'Doğrulama e-postası e-posta adresinize yeniden gönderildi. Lütfen e-posta kutunuzu kontrol edin.',
          [{ text: 'Tamam', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        Alert.alert('Hata', response.data?.message || 'Doğrulama e-postası gönderilemedi.');
      }
    } catch (error) {
      console.error('Resend verification error:', error.response?.data || error);
      Alert.alert('Hata', error.response?.data?.message || 'Doğrulama e-postası gönderilemedi.');
    } finally {
      setResendLoading(false);
    }
  };

  // Ana sayfaya git
  const handleGoToHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  // Giriş sayfasına git
  const handleGoToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>E-posta doğrulama sonucu alınıyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        {success ? (
          <>
            <MaterialIcons name="check-circle" size={80} color="#4CAF50" />
            <Text style={styles.title}>E-posta Doğrulandı</Text>
            <Text style={styles.message}>
              Hesabınız başarıyla aktifleştirildi. Artık Sosyal Etkinlik uygulamasını
              kullanmaya başlayabilirsiniz.
            </Text>
            <TouchableOpacity style={styles.button} onPress={handleGoToHome}>
              <Text style={styles.buttonText}>Ana Sayfaya Git</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <MaterialIcons name="error" size={80} color="#F44336" />
            <Text style={styles.title}>Doğrulama Hatası</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <Text style={styles.message}>
              Doğrulama bağlantısı geçersiz veya süresi dolmuş olabilir. Yeni bir doğrulama
              bağlantısı istemek için aşağıdaki butona tıklayabilirsiniz.
            </Text>

            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={[styles.button, styles.outlineButton]} 
                onPress={handleGoToLogin}
              >
                <Text style={styles.outlineButtonText}>Giriş Sayfasına Git</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.button} 
                onPress={handleResendVerification}
                disabled={resendLoading}
              >
                {resendLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Doğrulama Bağlantısını Yeniden Gönder</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorMessage: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginVertical: 8,
    padding: 10,
    backgroundColor: '#FFEBEE',
    borderRadius: 4,
    width: '100%',
  },
  button: {
    backgroundColor: '#1976d2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonGroup: {
    width: '100%',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  outlineButtonText: {
    color: '#1976d2',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EmailVerifiedScreen; 