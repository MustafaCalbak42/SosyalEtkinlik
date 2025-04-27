import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, StatusBar, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoLinking from 'expo-linking';

// Navigatörler
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

const AppNavigator = ({ linking }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  // Deep link yapılandırması
  const linkingConfig = {
    prefixes: [
      'sosyaletkinlik://', 
      'exp://sosyaletkinlik', 
      'exp://', 
      'http://localhost',
      'https://localhost'
    ],
    config: {
      screens: {
        AuthNavigator: {
          screens: {
            Login: 'login',
            Register: 'register',
            EmailVerified: {
              path: 'email-verified',
              parse: {
                success: (success) => success === 'true', // string -> boolean
                token: (token) => token,
                refreshToken: (refreshToken) => refreshToken,
                error: (error) => error,
                email: (email) => email,
                message: (message) => message
              }
            }
          }
        },
        MainNavigator: {
          screens: {
            Home: 'home',
            Profile: 'profile',
          }
        }
      }
    },
    // Deep link'i yakalamak için
    async getInitialURL() {
      try {
        // Uygulama kapalıyken açıldıysa
        const url = await ExpoLinking.getInitialURL();
        console.log('Initial URL:', url);
        
        // Doğrudan URL açma olaylarını da yakalayalım (app-to-app linking)
        const initialUrl = await Linking.getInitialURL();
        console.log('Initial URL from Linking API:', initialUrl);
        
        return url || initialUrl;
      } catch (e) {
        console.error('Deep link getInitialURL hatası:', e);
        return null;
      }
    },
    // URL olaylarını dinlemek için abonelik ayarı
    subscribe(listener) {
      // Hem Expo hem de React Native Linking kullanmayı deneyelim
      
      // Expo Linking
      const expoSubscription = ExpoLinking.addEventListener('url', ({ url }) => {
        console.log('Expo received URL:', url);
        listener(url);
      });
      
      // React Native Linking
      const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
        console.log('RN received URL:', url);
        listener(url);
      });

      return () => {
        // Abonelikten çıkma
        expoSubscription.remove();
        linkingSubscription.remove();
      };
    }
  };

  useEffect(() => {
    // Uygulama başladığında token kontrolü
    const bootstrapAsync = async () => {
      // Token kontrolünü devre dışı bırakıyoruz, her zaman login ekranı gösterilecek
      setUserToken(null);
      setIsLoading(false);
    };

    bootstrapAsync();
    
    // URL'den gelen parametreleri dinleyelim
    const handleDeepLink = ({ url }) => {
      console.log('Deep Link URL event:', url);
      
      // URL parametrelerini kontrol et
      if (url && url.includes('email-verified')) {
        console.log('Email verification deep link detected');
        // URL parametrelerini alıp işleyeceğiz
      }
    };
    
    // Deep link dinleyicisi ekle
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // İlk açılışta URL kontrolü
    Linking.getInitialURL().then(url => {
      if (url) {
        console.log('Initial URL on mount:', url);
        handleDeepLink({ url });
      }
    });
    
    return () => {
      subscription.remove();
    };
  }, []);

  // Oturum durumunu değiştirmek için fonksiyonlar
  const authContext = React.useMemo(
    () => ({
      signIn: async (token, refreshToken) => {
        try {
          // Token'ı AsyncStorage'a kaydet
          await AsyncStorage.setItem('token', token);
          if (refreshToken) {
            await AsyncStorage.setItem('refreshToken', refreshToken);
          }
          // Kullanıcı state'ini güncelle
          setUserToken(token);
        } catch (e) {
          console.error('Token kaydedilirken hata:', e);
        }
      },
      signOut: async () => {
        try {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('refreshToken');
          await AsyncStorage.removeItem('user');
          setUserToken(null);
        } catch (e) {
          console.error('Çıkış yapılırken hata:', e);
        }
      }
    }),
    []
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linkingConfig}>
      <StatusBar backgroundColor="#1976d2" barStyle="light-content" />
      {userToken ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator; 