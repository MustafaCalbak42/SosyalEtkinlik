import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import api from '../shared/api/apiClient';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation, route }) => {
  const { login, setIsLoggedIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);

  // Route parametresinden gelen mesajı kontrol et
  useEffect(() => {
    if (route.params?.message) {
      setError(route.params.message);
    }
  }, [route.params]);

  const validateInputs = () => {
    if (!email.trim()) {
      setError('E-posta adresi boş olamaz');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Geçerli bir e-posta adresi giriniz');
      return false;
    }
    
    if (!password.trim()) {
      setError('Şifre boş olamaz');
      return false;
    }
    
    return true;
  };

  const handleLogin = async () => {
    // Temel validasyon
    if (!email || !password) {
      setError('Lütfen e-posta ve şifre giriniz');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Giriş yapılıyor...');
      const response = await api.auth.login({ email, password });
      console.log('Login API yanıtı:', JSON.stringify(response.data, null, 2));
      
      if (response.data.success) {
        console.log('Giriş başarılı, token alındı.');
        
        // Tokenleri doğru şekilde al
        const token = response.data.data.token;
        const refreshToken = response.data.data.refreshToken;
        
        if (!token) {
          setError('Sunucudan token alınamadı');
          setLoading(false);
          return;
        }
        
        console.log('Token alındı, uzunluk:', token.length);
        
        // Önce token'ı doğrudan AsyncStorage'a kaydet
        try {
          await AsyncStorage.setItem('token', token.toString().trim());
          console.log('Token doğrudan AsyncStorage\'a kaydedildi');
          
          // API'ye token'ı ayarla
          api.setAuthToken(token);
          
          // AuthContext'e token'ı gönder
          const loginResult = await login(token, refreshToken);
          
          if (loginResult.success) {
            console.log('AuthContext login başarılı, ana sayfaya yönlendiriliyor');
            
            // Token'ın kaydedildiğinden emin ol
            const storedToken = await AsyncStorage.getItem('token');
            console.log('AsyncStorage\'da token var mı:', !!storedToken);
            
            // Kısa bir bekleme süresi ekle (state update'lerinin tamamlanması için)
            setTimeout(() => {
              // Ana ekrana yönlendir
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }]
              });
            }, 100);
          } else {
            console.error('AuthContext login hatası:', loginResult.message);
            setError('Oturum açılamadı: ' + loginResult.message);
          }
        } catch (storageError) {
          console.error('Token saklama hatası:', storageError);
          setError('Token saklanırken hata: ' + storageError.message);
        }
      } else {
        // Handle different API response errors
        const errorMessage = response.data.message || 'Giriş başarısız';
        console.error('Login API hatası:', errorMessage);
        
        // E-posta doğrulama hatası için özel mesaj
        if (errorMessage.includes('doğrulanmamış') || errorMessage.includes('verified')) {
          setShowResendVerification(true);
          setVerificationEmail(email);
          setError('E-posta adresiniz doğrulanmamış. Doğrulama e-postası gönderilmesi için aşağıdaki butona tıklayın.');
        } else {
          setError(errorMessage);
        }
      }
    } catch (err) {
      console.error('Login hatası:', err);
      setError(
        err.response?.data?.message || 
        'Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.'
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleSecureTextEntry = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  const handleResendVerification = async () => {
    // Doğrulama için e-posta kontrol et
    if (!verificationEmail) {
      setError('Doğrulama e-postası göndermek için lütfen önce e-posta adresinizi girin');
      return;
    }

    setResendLoading(true);
    try {
      const response = await api.auth.resendVerification({ email: verificationEmail });
      if (response.data && response.data.success) {
        Alert.alert(
          'Başarılı',
          'Doğrulama e-postası adresinize gönderildi. Lütfen e-posta kutunuzu kontrol edin.',
          [{ text: 'Tamam' }]
        );
        setNeedsVerification(false);
        setError('');
      } else {
        setError(response.data?.message || 'Doğrulama e-postası gönderilemedi.');
      }
    } catch (error) {
      console.error('Resend verification error:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Doğrulama e-postası gönderilirken bir hata oluştu.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.logoText}>Sosyal Etkinlik</Text>
        </View>
        
        <View style={styles.formContainer}>
          <Text style={styles.title}>Giriş Yap</Text>
          
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              {showResendVerification && (
                <TouchableOpacity 
                  style={styles.resendButton} 
                  onPress={handleResendVerification}
                  disabled={resendLoading}
                >
                  {resendLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.resendButtonText}>Doğrulama Bağlantısını Yeniden Gönder</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ) : null}
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-posta Adresi</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={24} color="#777" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="E-posta"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Şifre</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={24} color="#777" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Şifre"
                secureTextEntry={secureTextEntry}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity 
                style={styles.visibilityIcon} 
                onPress={toggleSecureTextEntry}
              >
                <MaterialIcons
                  name={secureTextEntry ? 'visibility' : 'visibility-off'}
                  size={24}
                  color="#777"
                />
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.forgotPasswordLink}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotPasswordText}>Şifremi Unuttum</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.loginButton, loading ? styles.disabledButton : null]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Giriş Yap</Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Hesabınız yok mu?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signupLink}>Kayıt Ol</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
    paddingBottom: 30,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
    backgroundColor: '#1976d2',
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ef9a9a',
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
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
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
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
  visibilityIcon: {
    paddingHorizontal: 10,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#1976d2',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#1976d2',
    borderRadius: 10,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: '#777',
    fontSize: 14,
  },
  signupLink: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  resendButton: {
    backgroundColor: '#1976d2',
    borderRadius: 10,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  resendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    padding: 10,
  },
});

export default LoginScreen; 