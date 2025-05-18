import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AppState, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetworkUtils from '../shared/utils/networkUtils';
import api from '../shared/api/apiClient';
import { useNavigation, CommonActions } from '@react-navigation/native';

let SERVER_CONFIG = { PRIMARY_IP: '', PORT: '5000' };

try {
  // Otomatik oluşturulmuş yapılandırma dosyasını içe aktar
  const serverConfig = require('../shared/constants/ServerConfig').default;
  if (serverConfig) {
    SERVER_CONFIG = serverConfig;
  }
} catch (error) {
  console.log('Sunucu yapılandırması bulunamadı');
}

const NetworkMonitor = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionDetails, setConnectionDetails] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [ipAddress, setIpAddress] = useState(SERVER_CONFIG.PRIMARY_IP || '');
  
  // useNavigation hook'u doğru bir şekilde kullanılıyor
  const navigation = useNavigation();
  
  // Bağlantı kontrolü yapma
  const checkConnection = async () => {
    try {
      // API durumunu kontrol et
      const isApiConnected = await api.checkApiStatus();
      setIsConnected(isApiConnected);
      
      // Ağ bilgilerini al
      const networkState = await NetworkUtils.checkNetworkState();
      const ip = await NetworkUtils.getLocalIpAddress();
      setIpAddress(ip);
      
      // Bağlantı detaylarını güncelle
      const details = {
        serverIp: SERVER_CONFIG.PRIMARY_IP,
        deviceIp: ip,
        networkType: networkState?.type || 'unknown',
        isServerOnSameNetwork: ip.split('.').slice(0, 3).join('.') === 
                              SERVER_CONFIG.PRIMARY_IP.split('.').slice(0, 3).join('.')
      };
      
      setConnectionDetails(details);
      
      // Bağlantı hatası varsa ve farklı ağdaysalar kullanıcıya bildir
      if (!isApiConnected && details.serverIp && details.deviceIp && !details.isServerOnSameNetwork) {
        console.log('Farklı ağdasınız. Mobil cihaz:', details.deviceIp, 'Sunucu:', details.serverIp);
        showNetworkAlert(details);
      }
      
    } catch (error) {
      console.error('Bağlantı kontrolü sırasında hata:', error);
      setIsConnected(false);
    }
  };
  
  // Kullanıcıya ağ hatasını göster
  const showNetworkAlert = (details) => {
    try {
      Alert.alert(
        'Ağ Bağlantı Hatası',
        `Mobil cihazınız (${details.deviceIp}) ve backend sunucu (${details.serverIp}) farklı ağlarda görünüyor.\n\nLütfen şunları kontrol edin:\n1. Telefonunuz ve bilgisayarınız aynı WiFi ağına bağlı mı?\n2. Backend sunucu çalışıyor mu?`,
        [
          { 
            text: 'Ayarlar',
            onPress: goToSettings
          },
          { 
            text: 'Yeniden Dene',
            onPress: checkConnection
          },
          { 
            text: 'Tamam',
            style: 'cancel'
          }
        ]
      );
    } catch (alertError) {
      console.error('Alert gösterilirken hata:', alertError);
    }
  };
  
  // Ayarlar sayfasına git
  const goToSettings = () => {
    try {
      // Doğrudan Main stack ve Settings ekranına git
      navigation.dispatch(
        CommonActions.navigate({
          name: 'Main',
          params: {
            screen: 'Settings'
          }
        })
      );
    } catch (error) {
      console.error('Settings ekranına yönlendirme hatası:', error);
      // Alternatif yöntem
      Alert.alert(
        'Yönlendirme Hatası',
        'Ayarlar ekranına yönlendirilemedi. Lütfen ana menüden Ayarlar sekmesine gidin.'
      );
    }
  };
  
  // Uygulama aktif olduğunda veya durumu değiştiğinde bağlantıyı kontrol et
  useEffect(() => {
    // Başlangıçta kontrol et
    checkConnection();
    
    // AppState değişikliğini dinle
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('App aktif oldu, bağlantı kontrolü yapılıyor...');
        checkConnection();
      }
    });
    
    // Düzenli olarak kontrol et (60 saniyede bir)
    const interval = setInterval(() => {
      checkConnection();
    }, 60000);
    
    // Network değişikliklerini izle
    const startMonitoring = async () => {
      await NetworkUtils.startNetworkMonitoring(async (newIp) => {
        console.log('IP değişikliği algılandı, bağlantı kontrolü yapılıyor...');
        checkConnection();
      });
    };
    
    startMonitoring();
    
    // Cleanup
    return () => {
      clearInterval(interval);
      subscription.remove();
      NetworkUtils.stopNetworkMonitoring();
    };
  }, []);
  
  // Bağlantı durumu iyi ise bileşeni gösterme
  if (isConnected && !showDetails) {
    return null;
  }
  
  return (
    <View style={[
      styles.container, 
      isConnected ? styles.connectedContainer : styles.disconnectedContainer
    ]}>
      <TouchableOpacity 
        style={styles.content}
        onPress={() => setShowDetails(!showDetails)}
      >
        <View style={styles.iconContainer}>
          <Ionicons 
            name={isConnected ? "checkmark-circle" : "warning"} 
            size={20} 
            color={isConnected ? "#4CAF50" : "#F44336"} 
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.statusText}>
            {isConnected 
              ? "Backend sunucu bağlantısı aktif" 
              : "Backend sunucu bağlantısı yok!"}
          </Text>
          
          {showDetails && connectionDetails && (
            <View style={styles.detailsContainer}>
              <Text style={styles.detailText}>
                Sunucu: {connectionDetails.serverIp}:{SERVER_CONFIG.PORT}
              </Text>
              <Text style={styles.detailText}>
                Cihaz IP: {connectionDetails.deviceIp}
              </Text>
              <Text style={styles.detailText}>
                Ağ Türü: {connectionDetails.networkType}
              </Text>
              <Text style={[
                styles.detailText, 
                connectionDetails.isServerOnSameNetwork 
                  ? styles.goodDetail 
                  : styles.badDetail
              ]}>
                {connectionDetails.isServerOnSameNetwork 
                  ? "✓ Aynı ağdasınız" 
                  : "✗ Farklı ağdasınız"}
              </Text>
            </View>
          )}
        </View>
        
        {!isConnected && (
          <TouchableOpacity 
            style={styles.button}
            onPress={goToSettings}
          >
            <Text style={styles.buttonText}>Ayarlar</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 35, // Status bar yüksekliği
    paddingBottom: 10,
    zIndex: 999,
  },
  connectedContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  disconnectedContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  iconContainer: {
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailsContainer: {
    marginTop: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  goodDetail: {
    color: '#4CAF50',
  },
  badDetail: {
    color: '#F44336',
  },
  button: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default NetworkMonitor; 