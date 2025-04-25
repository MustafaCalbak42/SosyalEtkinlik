import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../shared/api/apiClient';

const ResetPasswordScreen = ({ navigation, route }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Route params
  const email = route.params?.email || '';
  const verificationId = route.params?.verificationId || '';
  
  useEffect(() => {
    if (!email || !verificationId) {
      Alert.alert('Hata', 'Geçersiz şifre sıfırlama isteği', [
        {
          text: 'Tamam',
          onPress: () => navigation.navigate('ForgotPassword')
        }
      ]);
    }
  }, [email, verificationId, navigation]);

  const validateInputs = () => {
    if (!password) {
      setError('Şifre boş olamaz');
      return false;
    }
    
    if (password.length < 6) {
      setError('Şifre en az 6 karakter uzunluğunda olmalıdır');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return false;
    }
    
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateInputs()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await api.auth.resetPassword({
        email,
        verificationId,
        newPassword: password
      });
      
      if (response.data && response.data.success) {
        setSuccess(true);
        
        // Giriş sayfasına yönlendir
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ 
              name: 'Login',
              params: { 
                message: 'Şifreniz başarıyla değiştirildi. Lütfen yeni şifrenizle giriş yapın.' 
              }
            }],
          });
        }, 2000);
      } else {
        setError(response.data?.message || 'Şifre sıfırlama işlemi başarısız oldu');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError(
        err.response?.data?.message || 
        'Şifre sıfırlama sırasında bir hata oluştu. Lütfen tekrar deneyin.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.iconContainer}>
          <MaterialIcons name={success ? "check-circle" : "lock-reset"} size={80} color={success ? "#4caf50" : "#1976d2"} />
          <Text style={styles.title}>{success ? 'Şifre Değiştirildi' : 'Yeni Şifre Belirle'}</Text>
          
          {!success && (
            <View style={styles.emailContainer}>
              <MaterialIcons name="email" size={20} color="#555" />
              <Text style={styles.emailText}>{email}</Text>
            </View>
          )}
        </View>
        
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        
        {success ? (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>
              Şifreniz başarıyla değiştirildi! Giriş sayfasına yönlendiriliyorsunuz...
            </Text>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Yeni Şifre</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="lock" size={24} color="#777" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Yeni şifre"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
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
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Şifre Tekrar</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="lock" size={24} color="#777" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Şifre tekrar"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
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
            </View>
            
            <Text style={styles.passwordHelperText}>
              Şifreniz en az 6 karakter uzunluğunda olmalıdır
            </Text>
            
            <TouchableOpacity 
              style={[styles.submitButton, loading ? styles.disabledButton : null]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Şifreyi Değiştir</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 15,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginBottom: 15,
  },
  emailText: {
    marginLeft: 8,
    color: '#1976d2',
    fontWeight: 'bold',
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
  successContainer: {
    backgroundColor: '#e8f5e9',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#a5d6a7',
    alignItems: 'center',
  },
  successText: {
    color: '#2e7d32',
    textAlign: 'center',
    lineHeight: 20,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
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
  visibilityIcon: {
    paddingHorizontal: 10,
  },
  passwordHelperText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
    marginLeft: 5,
  },
  submitButton: {
    backgroundColor: '#1976d2',
    borderRadius: 5,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ResetPasswordScreen; 