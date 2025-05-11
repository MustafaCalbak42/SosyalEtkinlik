import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, StatusBar, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoLinking from 'expo-linking';
import { createStackNavigator } from '@react-navigation/stack';

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
        AuthNavigator: {
          screens: {
            Login: 'login',
            Register: 'register',
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
        },
        MainNavigator: {
          screens: {
            Home: 'home',
            Profile: 'profile',
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
        // Her zaman login ekranını göster
        setUserToken(null);
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
          await AsyncStorage.setItem('token', token);
          if (refreshToken) {
            await AsyncStorage.setItem('refreshToken', refreshToken);
          }
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
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken ? (
          <Stack.Screen name="MainNavigator" component={MainNavigator} />
        ) : (
          <Stack.Screen 
            name="AuthNavigator" 
            component={AuthNavigator}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 