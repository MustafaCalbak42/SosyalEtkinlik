import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { verifyEmailCode } from '../services/userService';
import colors from '../shared/theme/colors';
import { useAuth } from '../contexts/AuthContext';

const VerifyEmailScreen = ({ route, navigation }) => {
  // Email parametresini navigation state'inden al
  const email = route.params?.email || '';
  
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { login } = useAuth();
  
  // Email yoksa kayıt sayfasına yönlendir
  useEffect(() => {
    if (!email) {
      navigation.navigate('Register');
    }
  }, [email, navigation]);
  
  const handleSubmit = async () => {
    setError('');
    
    if (!code || code.length < 6) {
      setError('Lütfen size gönderilen 6 haneli kodu girin');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await verifyEmailCode({
        email,
        code
      });
      
      if (response.success) {
        setSuccess(true);
        
        // Kullanıcı tokenları varsa giriş yap
        if (response.accessToken) {
          login(response.accessToken, response.refreshToken, response.data);
        }
        
        // Email doğrulandı ekranına yönlendir
        setTimeout(() => {
          navigation.navigate('EmailVerified', { 
            success: true,
            email: email,
            verified: true
          });
        }, 1500);
      } else {
        setError(response.message || 'E-posta doğrulaması başarısız oldu');
      }
    } catch (err) {
      const errorMessage = err.data?.message || 
                         'Doğrulama işlemi sırasında bir hata oluştu, lütfen tekrar deneyin';
      setError(errorMessage);
      
      // Hata durumunda EmailVerifiedScreen'e yönlendir
      setTimeout(() => {
        navigation.navigate('EmailVerified', {
          success: false,
          error: errorMessage,
          email: email
        });
      }, 1500);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="mark-email-read" size={64} color={colors.primary} />
          </View>
          
          <Text style={styles.title}>E-posta Doğrulama</Text>
          
          <View style={styles.emailContainer}>
            <MaterialIcons name="email" size={20} color={colors.textSecondary} style={styles.emailIcon} />
            <Text style={styles.emailText}>
              <Text style={styles.emailBold}>{email}</Text> adresine gönderilen 6 haneli kodu girin
            </Text>
          </View>
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {success ? <Text style={styles.successText}>E-posta doğrulaması başarılı! Yönlendiriliyorsunuz...</Text> : null}
          
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <MaterialIcons name="vpn-key" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="_ _ _ _ _ _"
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={(text) => setCode(text.replace(/[^\d]/g, ''))}
                editable={!loading && !success}
              />
            </View>
            
            <Text style={styles.helperText}>
              E-posta kutunuzu ve spam klasörünüzü kontrol edin
            </Text>
            
            <TouchableOpacity
              style={[
                styles.button,
                (loading || success) && styles.buttonDisabled
              ]}
              onPress={handleSubmit}
              disabled={loading || success}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>E-Postamı Doğrula</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.textButton}
              onPress={() => navigation.navigate('Login')}
              disabled={loading || success}
            >
              <Text style={styles.textButtonText}>Giriş sayfasına dön</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    width: '100%',
  },
  emailIcon: {
    marginRight: 10,
  },
  emailText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  emailBold: {
    fontWeight: 'bold',
  },
  formContainer: {
    width: '100%',
    marginTop: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    padding: 10,
    marginBottom: 10,
  },
  inputIcon: {
    marginHorizontal: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 20,
    letterSpacing: 10,
    textAlign: 'center',
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(25, 118, 210, 0.6)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textButton: {
    marginTop: 20,
    padding: 10,
    alignItems: 'center',
  },
  textButtonText: {
    color: colors.primary,
    fontSize: 14,
  },
  errorText: {
    color: '#f44336',
    marginBottom: 10,
    textAlign: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: 10,
    borderRadius: 4,
    width: '100%',
  },
  successText: {
    color: '#4caf50',
    marginBottom: 10,
    textAlign: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 10,
    borderRadius: 4,
    width: '100%',
  },
});

export default VerifyEmailScreen; 