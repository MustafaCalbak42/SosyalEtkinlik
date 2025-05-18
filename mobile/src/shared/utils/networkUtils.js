/**
 * Network Utilities
 * IPv4 adresini algılama ve yönetme işlemleri için yardımcı fonksiyonlar
 */

import { Platform } from 'react-native';
import { NetworkInfo } from 'react-native-network-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as Network from 'expo-network';

// IP adresinin saklandığı async storage anahtarı
const IP_STORAGE_KEY = '@network_local_ip_address';
const DEFAULT_PORT = '5000';

// Ağ bağlantı durumu değişikliğini dinleyen bir unsubscribe fonksiyonu
let netInfoUnsubscribe = null;

/**
 * Cihaz için IPv4 adresini algılar ve saklar
 * @returns {Promise<string>} Algılanan IPv4 adresi
 */
export const detectLocalIpAddress = async () => {
  try {
    console.log('Yerel IP adresi algılanıyor...');
    
    let ipAddress = '';
    
    // Platform'a göre IP adresini al
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      try {
        // Önce Expo Network kullanarak dene (daha güvenilir)
        ipAddress = await Network.getIpAddressAsync();
        console.log('Expo Network ile algılanan IP adresi:', ipAddress);
      } catch (expoError) {
        console.log('Expo Network IP algılama hatası:', expoError);
        
        // Expo başarısız olursa NetworkInfo kullan
        try {
          ipAddress = await NetworkInfo.getIPV4Address();
          console.log('NetworkInfo ile algılanan IP adresi:', ipAddress);
        } catch (networkInfoError) {
          console.log('NetworkInfo IP algılama hatası:', networkInfoError);
        }
      }
      
      // IP bulunamadıysa alternatif yöntemler dene
      if (!ipAddress) {
        // Yedek yöntem: Expo ile ağ türünü kontrol et
        try {
          const networkType = await Network.getNetworkStateAsync();
          console.log('Ağ durumu:', networkType);
          
          if (networkType.type === Network.NetworkStateType.WIFI && networkType.isConnected) {
            console.log('WiFi bağlantısı tespit edildi');
          }
        } catch (networkStateError) {
          console.log('Ağ durumu algılama hatası:', networkStateError);
        }
        
        // Yedek yöntem: Gateway IP'yi al ve ağ bölümünü kullan
        try {
          const gateway = await NetworkInfo.getGatewayIPAddress();
          if (gateway) {
            // Gateway IP'den ağ bölümünü çıkar (örn: 192.168.1.1 -> 192.168.1)
            const networkPart = gateway.split('.').slice(0, 3).join('.');
            console.log('Ağ bölümü (gateway üzerinden):', networkPart);
            // Şu an için sadece ağ bilgisini logladık, tam IP adresini belirleyemiyoruz
          }
        } catch (gatewayError) {
          console.log('Gateway IP algılama hatası:', gatewayError);
        }
        
        // Yedek yöntem başarısız olursa önbellekteki son IP'yi kullan
        const cachedIp = await AsyncStorage.getItem(IP_STORAGE_KEY);
        if (cachedIp) {
          console.log('Önbellekten alınan IP kullanılıyor:', cachedIp);
          ipAddress = cachedIp;
        } else {
          // Son çare olarak varsayılan IP kullan (localhost veya yaygın ev ağı IP'si)
          ipAddress = '192.168.1.0'; // Varsayılan IP (kullanıcı manuel değiştirmeli)
          console.log('IP adresi belirlenemedi, varsayılan değer kullanılıyor:', ipAddress);
        }
      } else {
        // Algılanan IP'yi sakla
        await AsyncStorage.setItem(IP_STORAGE_KEY, ipAddress);
        console.log('IP adresi başarıyla saklandı:', ipAddress);
      }
    } else {
      // Web veya başka platformlar için localhost kullan
      ipAddress = 'localhost';
    }
    
    return ipAddress;
  } catch (error) {
    console.error('IP adresi algılanırken hata oluştu:', error);
    // Hata durumunda varsayılan yerel adres döndür
    return 'localhost';
  }
};

/**
 * Saklanan IP adresini al veya yoksa algıla
 */
export const getLocalIpAddress = async () => {
  try {
    // Önce saklanan IP'yi kontrol et
    const storedIp = await AsyncStorage.getItem(IP_STORAGE_KEY);
    
    if (storedIp) {
      console.log('Saklanan IP adresi kullanılıyor:', storedIp);
      return storedIp;
    }
    
    // Saklanan IP yoksa yeni IP algıla
    return await detectLocalIpAddress();
  } catch (error) {
    console.error('IP adresi alınırken hata oluştu:', error);
    return 'localhost';
  }
};

/**
 * API URL oluşturur
 * @param {string} port - Backend port numarası (varsayılan: 5000)
 * @returns {Promise<string>} Oluşturulan tam API URL'i
 */
export const getApiBaseUrl = async (port = DEFAULT_PORT) => {
  const ipAddress = await getLocalIpAddress();
  const apiUrl = `http://${ipAddress}:${port}/api`;
  console.log('Oluşturulan API URL:', apiUrl);
  return apiUrl;
};

/**
 * IP adresini manuel olarak güncelle
 * @param {string} newIpAddress - Yeni IP adresi
 */
export const updateIpAddress = async (newIpAddress) => {
  if (!newIpAddress) return;
  
  try {
    await AsyncStorage.setItem(IP_STORAGE_KEY, newIpAddress);
    console.log('IP adresi manuel olarak güncellendi:', newIpAddress);
  } catch (error) {
    console.error('IP adresi güncellenirken hata oluştu:', error);
  }
};

/**
 * Ağ bağlantı durumunu kontrol et
 * @returns {Promise<Object>} Ağ bağlantı durumu bilgisi
 */
export const checkNetworkState = async () => {
  try {
    // Önce NetInfo ile temel bağlantı bilgisini al
    const state = await NetInfo.fetch();
    console.log('NetInfo ile ağ bağlantı durumu:', state);
    
    // Daha detaylı bilgi için Expo Network kullan
    try {
      const networkState = await Network.getNetworkStateAsync();
      console.log('Expo Network ile ağ durumu:', networkState);
      
      // İki sonucu birleştir
      const combinedState = {
        ...state,
        expoNetworkInfo: networkState
      };
      
      // WiFi bağlantısı varsa IP adresini algıla
      if ((state.type === 'wifi' || networkState.type === Network.NetworkStateType.WIFI) && 
          (state.isConnected || networkState.isConnected)) {
        console.log('WiFi bağlantısı algılandı, IP adresi güncelleniyor...');
        await detectLocalIpAddress();
      }
      
      return combinedState;
    } catch (expoError) {
      console.log('Expo Network durumu alınamadı:', expoError);
      
      // WiFi bağlantısı varsa IP adresini algıla
      if (state.type === 'wifi' && state.isConnected) {
        console.log('WiFi bağlantısı algılandı, IP adresi güncelleniyor...');
        await detectLocalIpAddress();
      }
      
      return state;
    }
  } catch (error) {
    console.error('Ağ durumu kontrol edilirken hata oluştu:', error);
    return null;
  }
};

/**
 * IP değişikliğini izlemek için Network State değişikliğini dinle
 * @param {Function} onIpChanged - IP değiştiğinde çağrılacak callback fonksiyonu
 */
export const startNetworkMonitoring = async (onIpChanged) => {
  // Önceki aboneliği iptal et
  if (netInfoUnsubscribe) {
    netInfoUnsubscribe();
  }
  
  // İlk IP tespitini yap
  const initialIp = await detectLocalIpAddress();
  
  // Callback fonksiyonu varsa çağır
  if (onIpChanged && typeof onIpChanged === 'function') {
    onIpChanged(initialIp);
  }
  
  // Ağ değişikliklerini dinle
  netInfoUnsubscribe = NetInfo.addEventListener(async (state) => {
    console.log('Ağ durumu değişti:', state.type, state.isConnected);
    
    // WiFi bağlantısı varsa IP adresini güncelle
    if (state.type === 'wifi' && state.isConnected) {
      console.log('WiFi bağlantısı algılandı, IP adresi güncelleniyor...');
      const newIp = await detectLocalIpAddress();
      
      // IP değişikliği varsa callback fonksiyonunu çağır
      if (newIp && onIpChanged && typeof onIpChanged === 'function') {
        onIpChanged(newIp);
      }
    }
  });
  
  console.log('Ağ izleme başlatıldı');
};

/**
 * Ağ izlemeyi durdur
 */
export const stopNetworkMonitoring = () => {
  if (netInfoUnsubscribe) {
    netInfoUnsubscribe();
    netInfoUnsubscribe = null;
    console.log('Ağ izleme durduruldu');
  }
};

export default {
  detectLocalIpAddress,
  getLocalIpAddress,
  getApiBaseUrl,
  updateIpAddress,
  startNetworkMonitoring,
  stopNetworkMonitoring,
  checkNetworkState
}; 