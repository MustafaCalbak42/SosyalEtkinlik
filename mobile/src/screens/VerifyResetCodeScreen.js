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

const VerifyResetCodeScreen = ({ navigation, route }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Email adresi route param'dan al
  const email = route.params?.email || '';
  
  useEffect(() => {
    if (!email) {
      Alert.alert('Hata', 'E-posta adresi bulunamadı', [
        {
          text: 'Tamam',
          onPress: () => navigation.navigate('ForgotPassword')
        }
      ]);
    }
  }, [email, navigation]);

  const handleSubmit = async () => {
    if (!code || code.length < 6) {
      setError('Lütfen 6 haneli doğrulama kodunu girin');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await api.auth.verifyResetCode({
        email,
        code
      });
      
      if (response.data && response.data.success) {
        setSuccess(true);
        
        // Yeni şifre belirleme ekranına yönlendir
        setTimeout(() => {
          navigation.navigate('ResetPassword', {
            email,
            code: response.data.verificationId
          });
        }, 1000);
      } else {
        setError(response.data?.message || 'Doğrulama kodunuz geçersiz');
      }
    } catch (err) {
      console.error('Code verification error:', err);
      setError(
        err.response?.data?.message || 
        'Doğrulama işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Sadece rakam girişi için filtreleme
  const handleCodeChange = (text) => {
    // Sadece rakamları kabul et
    const formattedText = text.replace(/[^0-9]/g, '');
    setCode(formattedText);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="vpn-key" size={80} color="#1976d2" />
          <Text style={styles.title}>Doğrulama Kodu</Text>
          
          <View style={styles.emailContainer}>
            <MaterialIcons name="email" size={20} color="#555" />
            <Text style={styles.emailText}>{email}</Text>
          </View>
          
          <Text style={styles.subtitle}>
            E-posta adresinize gönderilen 6 haneli doğrulama kodunu girin
          </Text>
        </View>
        
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        
        {success ? (
          <View style={styles.successContainer}>
            <MaterialIcons name="check-circle" size={50} color="#4caf50" />
            <Text style={styles.successText}>
              Doğrulama başarılı! Yeni şifre belirleme ekranına yönlendiriliyorsunuz...
            </Text>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <Text style={styles.codeLabel}>Doğrulama Kodu</Text>
            <TextInput
              style={styles.codeInput}
              value={code}
              onChangeText={handleCodeChange}
              placeholder="_ _ _ _ _ _"
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
              autoFocus
            />
            
            <TouchableOpacity 
              style={[styles.submitButton, loading ? styles.disabledButton : null]}
              onPress={handleSubmit}
              disabled={loading || success}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Doğrula</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <MaterialIcons name="arrow-back" size={20} color="#1976d2" />
                <Text style={styles.actionButtonText}>Farklı bir e-posta kullan</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('ForgotPassword', { email })}
              >
                <MaterialIcons name="refresh" size={20} color="#1976d2" />
                <Text style={styles.actionButtonText}>Kodu tekrar gönder</Text>
              </TouchableOpacity>
            </View>
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
  subtitle: {
    fontSize: 14,
    color: '#666',
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
    marginTop: 15,
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
  codeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 10,
    textAlign: 'center',
  },
  codeInput: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    fontSize: 24,
    letterSpacing: 10,
    paddingVertical: 15,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#1976d2',
    borderRadius: 5,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionButtonText: {
    color: '#1976d2',
    marginLeft: 8,
  },
});

export default VerifyResetCodeScreen; 