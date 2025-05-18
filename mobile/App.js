import React, { useEffect } from 'react';
import { StatusBar, LogBox, DeviceEventEmitter, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import * as Linking from 'expo-linking';
import NetworkUtils from './src/shared/utils/networkUtils';
import api from './src/shared/api/apiClient';
import NetworkMonitor from './src/components/NetworkMonitor';

// Performans iyileştirmesi için ekran kurulumunu etkinleştir
enableScreens();

// Deep link hata uyarılarını gösterme
LogBox.ignoreLogs([
  'Linking requires a build-time setting `scheme` in the project\'s Expo config',
  'Some dependencies are incompatible with the installed expo version',
  'Non-serializable values were found in the navigation state',
]);

const App = () => {
  // Uygulama başlatıldığında network izlemeyi başlat
  useEffect(() => {
    const setupNetwork = async () => {
      try {
        // Ağ durumunu kontrol et
        const networkState = await NetworkUtils.checkNetworkState();
        
        // IP adresini otomatik algıla
        const ipAddress = await NetworkUtils.detectLocalIpAddress();
        console.log('Algılanan IP adresi:', ipAddress);
        
        // API URL'i güncelle
        await api.updateApiUrl();
        
        // Sunucu bağlantısını kontrol et
        const isConnected = await api.checkApiStatus();
        
        if (!isConnected) {
          console.log('Sunucu bağlantısı kurulamadı');
          Alert.alert(
            'Sunucu Bağlantısı',
            'Backend sunucuya bağlantı kurulamadı. Lütfen aynı WiFi ağında olduğunuzu ve sunucunun çalıştığını kontrol edin.\n\nAyarlar ekranına giderek bağlantı durumunu kontrol edebilirsiniz.'
          );
        }
      } catch (error) {
        console.error('Network ayarlanırken hata:', error);
      }
    };
    
    // Network izlemeyi başlat
    setupNetwork();
    
    return () => {
      // Uygulama kapatıldığında izlemeyi durdur
      NetworkUtils.stopNetworkMonitoring();
    };
  }, []);

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
        Auth: {
          screens: {
            Login: 'login',
            Register: 'register',
            ForgotPassword: 'forgot-password',
            EmailVerified: 'email-verified',
            VerifyEmail: 'verify-email/:token'
          }
        },
        Main: {
          screens: {
            Home: 'home',
            Profile: 'profile',
            Settings: 'settings'
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