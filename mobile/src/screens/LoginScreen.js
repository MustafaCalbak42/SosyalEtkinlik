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
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../shared/api/apiClient';

const LoginScreen = ({ navigation, route }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);

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
    setError('');
    
    if (!validateInputs()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await api.auth.login({
        email,
        password
      });
      
      if (response.data && response.data.token) {
        await AsyncStorage.setItem('token', response.data.token);
        
        if (response.data.refreshToken) {
          await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
        }
        
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } else {
        setError('Giriş yaparken bir hata oluştu');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Hata mesajını göster
      setError(
        err.response?.data?.message || 
        'Giriş yaparken bir hata oluştu. Lütfen bilgilerinizi kontrol edin.'
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleSecureTextEntry = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Sosyal Etkinlik</Text>
        </View>
        
        <View style={styles.formContainer}>
          <Text style={styles.title}>Giriş Yap</Text>
          
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
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
});

export default LoginScreen; 