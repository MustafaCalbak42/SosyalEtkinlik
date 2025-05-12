import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, StatusBar, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoLinking from 'expo-linking';
import { createStackNavigator } from '@react-navigation/stack';

// Context
import AuthContext from '../contexts/AuthContext';

// Navigatörler
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

const Stack = createStackNavigator();

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
        Main: {
          screens: {
            Home: 'home',
            Profile: 'profile',
          }
        },
        Auth: {
          screens: {
            Login: 'login',
            Register: 'register',
            ForgotPassword: 'forgot-password',
            EmailVerified: {
              path: 'email-verified',
              parse: {
                success: (success) => success === 'true',
                token: (token) => token,
                refreshToken: (refreshToken) => refreshToken,
                error: (error) => error,
                email: (email) => email,
                message: (message) => message
              }
            }
          }
        }
      }
    },
    async getInitialURL() {
      try {
        const url = await ExpoLinking.getInitialURL();
        console.log('Initial URL:', url);
        
        const initialUrl = await Linking.getInitialURL();
        console.log('Initial URL from Linking API:', initialUrl);
        
        return url || initialUrl;
      } catch (e) {
        console.error('Deep link getInitialURL hatası:', e);
        return null;
      }
    },
    subscribe(listener) {
      const expoSubscription = ExpoLinking.addEventListener('url', ({ url }) => {
        console.log('Expo received URL:', url);
        listener(url);
      });
      
      const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
        console.log('RN received URL:', url);
        listener(url);
      });

      return () => {
        expoSubscription.remove();
        linkingSubscription.remove();
      };
    }
  };

  useEffect(() => {
    // Uygulama başladığında token kontrolü
    const bootstrapAsync = async () => {
      try {
        // AsyncStorage'dan token'ı al
        // LoginScreen'de 'token' olarak kaydedildiği için aynı key'i kullanıyoruz
        const token = await AsyncStorage.getItem('token');
        console.log('Stored token:', token ? 'Found' : 'Not found');
        
        // Token varsa kullanıcı oturum açmış demektir
        setUserToken(token); // Token varsa değeri atanır, yoksa null kalır
      } catch (e) {
        console.error('Token kontrolü sırasında hata:', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
    
    // URL'den gelen parametreleri dinleyelim
    const handleDeepLink = ({ url }) => {
      console.log('Deep Link URL event:', url);
      
      if (url && url.includes('email-verified')) {
        console.log('Email verification deep link detected');
      }
    };
    
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
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
          console.log('Signing in with token:', token ? 'Token exists' : 'No token');
          
          // Önce token'ı AsyncStorage'a kaydet
          await AsyncStorage.setItem('token', token);
          
          if (refreshToken) {
            await AsyncStorage.setItem('refreshToken', refreshToken);
          }
          
          // Sonra state'i güncelle - bu navigasyonu tetikleyecek
          setUserToken(token);
          
          console.log('Sign-in complete, user token set');
          return true;
        } catch (e) {
          console.error('Token kaydedilirken hata:', e);
          return false;
        }
      },
      signOut: async () => {
        try {
          console.log('Logging out...');
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('refreshToken');
          await AsyncStorage.removeItem('user');
          setUserToken(null);
        } catch (e) {
          console.error('Çıkış yapılırken hata:', e);
        }
      },
      logout: async () => {
        try {
          console.log('Logging out from everywhere...');
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
    <AuthContext.Provider value={authContext}>
      <NavigationContainer linking={linkingConfig}>
        <StatusBar backgroundColor="#1976d2" barStyle="light-content" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {userToken ? (
            <Stack.Screen name="Main" component={MainNavigator} />
          ) : (
            <Stack.Screen 
              name="Auth" 
              component={AuthNavigator}
              options={{
                animationEnabled: true,
              }}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
};

export default AppNavigator; 