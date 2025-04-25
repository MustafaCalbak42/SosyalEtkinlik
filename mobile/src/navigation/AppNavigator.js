import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, StatusBar, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import api from '../shared/api/apiClient';

// Navigatörler
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

const AppNavigator = ({ linking }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  // Deep link işleme
  const handleDeepLink = async (url) => {
    if (!url) return;
    
    console.log('Deep link işleniyor:', url);
    
    // E-posta doğrulama URL'si
    if (url.includes('verify-email')) {
      setIsLoading(true);
      
      try {
        // URL'den token'ı çıkar
        const token = url.split('/').pop(); // Son parçayı al
        
        // API'ye doğrulama isteği gönder
        const response = await api.auth.verifyEmail(token);
        
        if (response.data && response.data.success) {
          // Başarılı ise token'ları sakla
          if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            setUserToken(response.data.token);
          }
          
          Alert.alert(
            'Başarılı',
            'E-posta adresiniz başarıyla doğrulandı. Artık giriş yapabilirsiniz.',
            [{ text: 'Tamam' }]
          );
        } else {
          Alert.alert(
            'Hata',
            response.data?.message || 'E-posta doğrulama işlemi başarısız oldu.',
            [{ text: 'Tamam' }]
          );
        }
      } catch (error) {
        console.error('E-posta doğrulama hatası:', error);
        Alert.alert(
          'Doğrulama Hatası',
          'E-posta adresinizi doğrularken bir hata oluştu. Lütfen tekrar deneyin.',
          [{ text: 'Tamam' }]
        );
      } finally {
        setIsLoading(false);
      }
    }
    // E-posta doğrulandı URL'si (eski yöntem)
    else if (url.includes('email-verified')) {
      setIsLoading(true);
      try {
        // URL'den parametreleri çıkar
        const params = url.split('?')[1];
        const urlParams = new URLSearchParams(params);
        const success = urlParams.get('success');
        const token = urlParams.get('token');
        const refreshToken = urlParams.get('refreshToken');
        
        if (success === 'true' && token && refreshToken) {
          // Tokenleri saklama
          await AsyncStorage.setItem('token', token);
          await AsyncStorage.setItem('refreshToken', refreshToken);
          
          setUserToken(token);
          Alert.alert(
            'Başarılı',
            'E-posta adresiniz başarıyla doğrulandı.',
            [{ text: 'Tamam' }]
          );
        } else {
          Alert.alert(
            'Hata',
            'E-posta doğrulama işlemi başarısız oldu.',
            [{ text: 'Tamam' }]
          );
        }
      } catch (error) {
        console.error('Deep link işleme hatası:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    // Uygulama başladığında token kontrolü yap
    const bootstrapAsync = async () => {
      let token = null;
      
      try {
        // AsyncStorage'dan token'ı al
        token = await AsyncStorage.getItem('token');
      } catch (e) {
        console.log('Token yüklenirken hata oluştu:', e);
      }
      
      // Token durumunu ayarla
      setUserToken(token);
      setIsLoading(false);
    };

    bootstrapAsync();

    // Uygulama açıkken deep linkleri dinle
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Uygulama kapalıyken kullanılan deep link ile açıldı mı kontrol et
    Linking.getInitialURL()
      .then(url => {
        if (url) {
          handleDeepLink(url);
        }
      })
      .catch(err => console.error('Deep link başlatma hatası:', err));

    // Cleanup
    return () => {
      subscription.remove();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <StatusBar backgroundColor="#1976d2" barStyle="light-content" />
      {userToken ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator; 