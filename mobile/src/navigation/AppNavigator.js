import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, StatusBar } from 'react-native';
import * as ExpoLinking from 'expo-linking';
import { createStackNavigator } from '@react-navigation/stack';

// Context
import { AuthProvider, useAuth } from '../contexts/AuthContext';

// Navigatörler
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

// Bileşenler
import NetworkMonitor from '../components/NetworkMonitor';

const Stack = createStackNavigator();

const AppNavigator = ({ linking }) => {
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
            Settings: 'settings',
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
        return url;
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
      
      return () => {
        expoSubscription.remove();
      };
    }
  };

  return (
    <AuthProvider>
      <NavigationContainer linking={linkingConfig}>
        <StatusBar backgroundColor="#1976d2" barStyle="light-content" />
        <AuthConsumer />
        <NetworkMonitor />
      </NavigationContainer>
    </AuthProvider>
  );
};

// Oturum durumuna göre navigasyon yapısını belirleyen bileşen
const AuthConsumer = () => {
  const { isLoggedIn, loading } = useAuth();
  const Stack = createStackNavigator();

  console.log('[AppNavigator] Auth durumu - isLoggedIn:', isLoggedIn, 'loading:', loading);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={isLoggedIn ? 'Main' : 'Auth'}>
      {isLoggedIn ? (
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
      {/* Alternatif ekranlar için */}
      {isLoggedIn ? (
        <Stack.Screen 
          name="Auth" 
          component={AuthNavigator}
          options={{
            animationEnabled: true,
          }}
        />
      ) : (
        <Stack.Screen name="Main" component={MainNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator; 