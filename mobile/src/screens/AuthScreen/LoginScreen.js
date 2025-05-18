import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../shared/api/apiClient';
import colors from '../../shared/theme/colors';

const LoginScreen = () => {
  const navigation = useNavigation();
  const { login, refreshUserProfile, isLoggedIn } = useAuth();
  
  const [values, setValues] = useState({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  const handleChange = (field, value) => {
    setValues({
      ...values,
      [field]: value
    });
    
    // Clear error when typing
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: null
      });
    }
  };

  const handleSubmit = async () => {
    // Form validation
    setErrors({});
    const validationErrors = {};
    
    if (!values.email) {
      validationErrors.email = 'Email adresi gereklidir';
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      validationErrors.email = 'Geçerli bir email adresi girin';
    }
    
    if (!values.password) {
      validationErrors.password = 'Şifre gereklidir';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Submission
    setLoading(true);
    
    try {
      console.log('[LoginScreen] Giriş yapılıyor...');
      const response = await api.auth.login(values);
      
      console.log('[LoginScreen] Giriş yanıtı:', {
        success: response.data?.success,
        hasToken: !!response.data?.data?.token,
        hasRefreshToken: !!response.data?.data?.refreshToken,
        status: response.status
      });
      
      if (response.data && response.data.success) {
        const { token, refreshToken } = response.data.data;
        
        console.log('[LoginScreen] Token alındı, oturum açılıyor...');
        const loginResult = await login(token, refreshToken);
        
        if (loginResult.success) {
          console.log('[LoginScreen] Giriş başarılı, kullanıcı profili güncel mi kontrol ediliyor');
          await refreshUserProfile();
          console.log('[LoginScreen] Profil güncellendi, isLoggedIn durumu:', isLoggedIn);
          
          // Ana ekrana git
          console.log('[LoginScreen] Ana ekrana yönlendiriliyor');
          navigation.navigate('App', { screen: 'Home' });
        } else {
          console.error('[LoginScreen] Login işlemi hatası:', loginResult.message);
          setMessage({
            type: 'error',
            content: loginResult.message || 'Giriş yapılırken bir hata oluştu'
          });
        }
      } else {
        console.error('[LoginScreen] API hatası:', response.data?.message);
        setMessage({
          type: 'error',
          content: response.data?.message || 'Giriş yapılırken bir hata oluştu'
        });
      }
    } catch (error) {
      console.error('[LoginScreen] Giriş hatası:', error);
      setMessage({
        type: 'error',
        content: error.message || 'Bağlantı hatası. Lütfen tekrar deneyin.'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const navigateToRegister = () => {
    navigation.navigate('Register');
  };
  
  const navigateToForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Giriş Yap</Text>
        <Text style={styles.subtitle}>Hesabınıza giriş yaparak etkinliklere katılabilir ve kendi etkinliklerinizi oluşturabilirsiniz.</Text>
      </View>
      
      {message && (
        <View style={[styles.messageContainer, message.type === 'error' ? styles.errorMessage : styles.successMessage]}>
          <Text style={styles.messageText}>{message.content}</Text>
        </View>
      )}
      
      <View style={styles.form}>
        <TextInput
          label="Email"
          value={values.email}
          onChangeText={(text) => handleChange('email', text)}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          error={!!errors.email}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        
        <TextInput
          label="Şifre"
          value={values.password}
          onChangeText={(text) => handleChange('password', text)}
          style={styles.input}
          secureTextEntry
          error={!!errors.password}
        />
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        
        <TouchableOpacity onPress={navigateToForgotPassword} style={styles.forgotPasswordLink}>
          <Text style={styles.forgotPasswordText}>Şifremi Unuttum</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.loginButtonText}>Giriş Yap</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Hesabınız yok mu?</Text>
          <TouchableOpacity onPress={navigateToRegister}>
            <Text style={styles.registerLink}>Kaydolun</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary.main,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    marginBottom: 20,
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
    marginTop: -5,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: colors.primary.main,
  },
  loginButton: {
    backgroundColor: colors.primary.main,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerText: {
    color: '#666',
    marginRight: 5,
  },
  registerLink: {
    color: colors.primary.main,
    fontWeight: 'bold',
  },
  messageContainer: {
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
  },
  errorMessage: {
    backgroundColor: '#ffebee',
  },
  successMessage: {
    backgroundColor: '#e8f5e9',
  },
  messageText: {
    fontSize: 14,
  }
});

export default LoginScreen; 