import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../shared/api/apiClient';

const RegisterScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form validation states
  const [fullNameError, setFullNameError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const validateInputs = () => {
    let isValid = true;
    
    // Ad Soyad kontrolü
    if (!fullName.trim()) {
      setFullNameError('Ad ve soyad gereklidir');
      isValid = false;
    } else if (fullName.trim().length < 3) {
      setFullNameError('Ad ve soyad en az 3 karakter olmalıdır');
      isValid = false;
    } else {
      setFullNameError('');
    }
    
    // Kullanıcı adı kontrolü
    if (!username.trim()) {
      setUsernameError('Kullanıcı adı gereklidir');
      isValid = false;
    } else if (username.trim().length < 3) {
      setUsernameError('Kullanıcı adı en az 3 karakter olmalıdır');
      isValid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir');
      isValid = false;
    } else {
      setUsernameError('');
    }
    
    // Email kontrolü
    if (!email) {
      setEmailError('E-posta adresi gereklidir');
      isValid = false;
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(email)) {
      setEmailError('Geçerli bir e-posta adresi girin');
      isValid = false;
    } else {
      setEmailError('');
    }
    
    // Şifre kontrolü
    if (!password) {
      setPasswordError('Şifre gereklidir');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Şifre en az 6 karakter olmalıdır');
      isValid = false;
    } else if (!/\d/.test(password)) {
      setPasswordError('Şifre en az bir rakam içermelidir');
      isValid = false;
    } else if (!/[a-z]/.test(password)) {
      setPasswordError('Şifre en az bir küçük harf içermelidir');
      isValid = false;
    } else if (!/[A-Z]/.test(password)) {
      setPasswordError('Şifre en az bir büyük harf içermelidir');
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    // Şifre onayı kontrolü
    if (!confirmPassword) {
      setConfirmPasswordError('Şifre onayı gereklidir');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Şifreler eşleşmiyor');
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }
    
    return isValid;
  };

  const handleRegister = async () => {
    // Form alanlarını doğrula
    if (!validateInputs()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await api.auth.register({
        username,
        email,
        password,
        fullName
      });
      
      if (response.data && response.data.success) {
        // API'den gelen UI mesajını kullan
        const uiMessage = response.data.uiMessage || {
          title: 'Kayıt Başarılı',
          body: 'Hesabınız oluşturuldu. Lütfen e-posta adresinizi doğrulayın.',
          type: 'success'
        };
        
        // Ek geliştirici bilgilerini ekleme (sadece geliştirme ortamında)
        let additionalInfo = '';
        
        // Test ortamı için email önizleme bağlantısı varsa mesaja ekle
        if (response.data.emailPreviewUrl) {
          additionalInfo += '\n\nGeliştirme ortamında olduğunuz için, test e-posta önizlemesine aşağıdaki bağlantıdan ulaşabilirsiniz:\n' + 
            response.data.emailPreviewUrl;
          
          console.log('Doğrulama E-postası Önizleme:', response.data.emailPreviewUrl);
        }
        
        // Eğer token bilgisi varsa onu da göster (sadece DEV ortamı)
        if (response.data.developerInfo && response.data.developerInfo.verificationToken) {
          const token = response.data.developerInfo.verificationToken;
          const emailType = response.data.developerInfo.emailSendingType || 'test';
          
          console.log('Doğrulama Token\'ı:', token);
          console.log('E-posta Türü:', emailType);
          console.log('API URL:', `http://10.0.2.2:5000/api/users/verify-email/${token}`);
          
          additionalInfo += '\n\nDoğrulama token: ' + token;
          additionalInfo += '\nE-posta tipi: ' + (emailType === 'real' ? 'Gerçek e-posta' : 'Test e-posta');
        }
        
        Alert.alert(
          uiMessage.title,
          uiMessage.body + additionalInfo,
          [
            {
              text: 'Tamam',
              onPress: () => navigation.navigate('Login', {
                message: 'Lütfen giriş yapmadan önce e-posta adresinizi doğrulayın.'
              })
            }
          ]
        );
      } else {
        setError(response.data?.message || 'Kayıt işlemi başarısız oldu');
      }
    } catch (err) {
      console.error('Register error:', err);
      setError(
        err.response?.data?.message || 
        'Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <MaterialIcons name="person-add" size={64} color="#1976d2" />
          <Text style={styles.title}>Hesap Oluştur</Text>
        </View>
        
        {/* Hata mesajı */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        
        <View style={styles.formContainer}>
          {/* Ad Soyad giriş alanı */}
          <View style={styles.inputContainer}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="person" size={24} color="#777" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Ad Soyad"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>
          {fullNameError ? <Text style={styles.fieldError}>{fullNameError}</Text> : null}
          
          {/* Kullanıcı adı giriş alanı */}
          <View style={styles.inputContainer}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="account-circle" size={24} color="#777" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Kullanıcı Adı"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {usernameError ? <Text style={styles.fieldError}>{usernameError}</Text> : null}
          
          {/* E-posta giriş alanı */}
          <View style={styles.inputContainer}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="email" size={24} color="#777" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="E-posta Adresi"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
          
          {/* Şifre giriş alanı */}
          <View style={styles.inputContainer}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="lock" size={24} color="#777" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Şifre"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.visibilityIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <MaterialIcons 
                name={showPassword ? "visibility-off" : "visibility"} 
                size={24} 
                color="#777" 
              />
            </TouchableOpacity>
          </View>
          {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
          
          {/* Şifre Onayı giriş alanı */}
          <View style={styles.inputContainer}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="lock" size={24} color="#777" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Şifre Onayı"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.visibilityIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <MaterialIcons 
                name={showConfirmPassword ? "visibility-off" : "visibility"} 
                size={24} 
                color="#777" 
              />
            </TouchableOpacity>
          </View>
          {confirmPasswordError ? <Text style={styles.fieldError}>{confirmPasswordError}</Text> : null}
          
          {/* Kayıt Ol butonu */}
          <TouchableOpacity 
            style={[styles.registerButton, loading ? styles.disabledButton : null]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.registerButtonText}>Kayıt Ol</Text>
            )}
          </TouchableOpacity>
          
          {/* Giriş yap linki */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Zaten bir hesabınız var mı? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Giriş yapın</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
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
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 5,
    marginBottom: 5,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  iconContainer: {
    padding: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 5,
  },
  visibilityIcon: {
    padding: 10,
  },
  fieldError: {
    color: '#c62828',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
  },
  registerButton: {
    backgroundColor: '#1976d2',
    borderRadius: 5,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  loginText: {
    color: '#666',
  },
  loginLink: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
});

export default RegisterScreen; 