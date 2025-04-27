import React, { useEffect } from 'react';
import { StatusBar, LogBox, DeviceEventEmitter } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import * as Linking from 'expo-linking';

// Performans iyileştirmesi için ekran kurulumunu etkinleştir
enableScreens();

// Deep link hata uyarılarını gösterme
LogBox.ignoreLogs([
  'Linking requires a build-time setting `scheme` in the project\'s Expo config',
  'Some dependencies are incompatible with the installed expo version',
]);

const App = () => {
  // Expo Go'da deep link uyumsuzluklarını gidermek için event listener ekle
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'url', 
      data => {
        console.log("Deep Link Event:", data);
      }
    );
    
    return () => {
      subscription.remove();
    };
  }, []);

  const linking = {
    prefixes: ['sosyaletkinlik://', 'exp://'],
    config: {
      screens: {
        Login: 'login',
        Register: 'register',
        Main: 'main',
        AuthNavigation: {
          screens: {
            Login: 'login',
            Register: 'register',
            EmailVerified: 'email-verified',
            VerifyEmail: 'verify-email/:token'
          }
        }
      }
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#1976d2" />
      <AuthProvider>
        <AppNavigator linking={linking} />
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App; 