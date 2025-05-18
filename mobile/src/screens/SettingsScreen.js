import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  ActivityIndicator,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetworkUtils from '../shared/utils/networkUtils';
import api from '../shared/api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = () => {
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('5000');
  const [isLoading, setIsLoading] = useState(false);
  const [useAutoDetection, setUseAutoDetection] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('unknown'); // 'success', 'error', 'unknown'
  const [networkInfo, setNetworkInfo] = useState(null);

  // Ayarları yükle
  useEffect(() => {
    loadSettings();
  }, []);

  // Ayarları yükle
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      // IP adresini al
      const savedIp = await NetworkUtils.getLocalIpAddress();
      setIpAddress(savedIp);
      
      // Otomatik algılama ayarını al
      const autoDetect = await AsyncStorage.getItem('@network_auto_detection');
      setUseAutoDetection(autoDetect !== 'false');
      
      // Ağ durumunu kontrol et
      const networkState = await NetworkUtils.checkNetworkState();
      setNetworkInfo(networkState);
      
      // API durumunu kontrol et
      const apiStatus = await api.checkApiStatus();
      setConnectionStatus(apiStatus ? 'success' : 'error');
    } catch (error) {
      console.error('Ayarlar yüklenirken hata:', error);
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // IP adresini manuel olarak güncelle
  const updateIpAddress = async () => {
    if (!ipAddress) {
      Alert.alert('Hata', 'Lütfen geçerli bir IP adresi girin.');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // IP adresini güncelle
      await NetworkUtils.updateIpAddress(ipAddress);
      
      // Otomatik algılama ayarını kaydet
      await AsyncStorage.setItem('@network_auto_detection', useAutoDetection ? 'true' : 'false');
      
      // API URL'i güncelle
      await api.updateApiUrl();
      
      // API durumunu kontrol et
      const apiStatus = await api.checkApiStatus();
      setConnectionStatus(apiStatus ? 'success' : 'error');
      
      Alert.alert(
        'Başarılı', 
        `IP adresi başarıyla güncellendi: ${ipAddress}\nBackend bağlantısı: ${apiStatus ? 'Başarılı' : 'Başarısız'}`
      );
    } catch (error) {
      console.error('IP adresi güncellenirken hata:', error);
      Alert.alert('Hata', 'IP adresi güncellenirken bir hata oluştu: ' + error.message);
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // IP adresini otomatik algıla
  const detectIpAddress = async () => {
    try {
      setIsLoading(true);
      
      // IP adresini otomatik algıla
      const detectedIp = await NetworkUtils.detectLocalIpAddress();
      setIpAddress(detectedIp);
      
      // API URL'i güncelle
      await api.updateApiUrl();
      
      // API durumunu kontrol et
      const apiStatus = await api.checkApiStatus();
      setConnectionStatus(apiStatus ? 'success' : 'error');
      
      Alert.alert(
        'IP Algılama', 
        `Algılanan IP adresi: ${detectedIp}\nBackend bağlantısı: ${apiStatus ? 'Başarılı' : 'Başarısız'}`
      );
    } catch (error) {
      console.error('IP adresi otomatik algılanırken hata:', error);
      Alert.alert('Hata', 'IP adresi otomatik algılanırken bir hata oluştu: ' + error.message);
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Bağlantı durumunu yeniden kontrol et
  const checkConnection = async () => {
    try {
      setIsLoading(true);
      setConnectionStatus('unknown');
      
      // API URL'i güncelle
      await api.updateApiUrl();
      
      // API durumunu kontrol et
      const apiStatus = await api.checkApiStatus();
      setConnectionStatus(apiStatus ? 'success' : 'error');
      
      Alert.alert(
        'Bağlantı Durumu', 
        `Backend bağlantısı: ${apiStatus ? 'Başarılı' : 'Başarısız'}`
      );
    } catch (error) {
      console.error('Bağlantı kontrol edilirken hata:', error);
      setConnectionStatus('error');
      Alert.alert('Hata', 'Bağlantı kontrol edilirken bir hata oluştu: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Bağlantı durumu göstergesi
  const renderConnectionStatus = () => {
    let icon, color, text;
    
    switch (connectionStatus) {
      case 'success':
        icon = 'checkmark-circle';
        color = '#4CAF50';
        text = 'Bağlantı Başarılı';
        break;
      case 'error':
        icon = 'close-circle';
        color = '#F44336';
        text = 'Bağlantı Hatası';
        break;
      default:
        icon = 'help-circle';
        color = '#FFC107';
        text = 'Bağlantı Durumu Bilinmiyor';
    }
    
    return (
      <View style={styles.statusContainer}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={[styles.statusText, { color }]}>{text}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ağ Ayarları</Text>
        <Text style={styles.subtitle}>
          Backend sunucu bağlantınızı yapılandırın
        </Text>
      </View>
      
      {renderConnectionStatus()}
      
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Backend Bağlantısı</Text>
        
        <View style={styles.switchContainer}>
          <Text style={styles.label}>Otomatik IP Algılama</Text>
          <Switch
            value={useAutoDetection}
            onValueChange={(value) => setUseAutoDetection(value)}
          />
        </View>
        
        <Text style={styles.label}>IP Adresi</Text>
        <TextInput
          style={styles.input}
          value={ipAddress}
          onChangeText={setIpAddress}
          placeholder="192.168.1.x"
          keyboardType="numeric"
          editable={!useAutoDetection}
        />
        
        <Text style={styles.label}>Port</Text>
        <TextInput
          style={styles.input}
          value={port}
          onChangeText={setPort}
          placeholder="5000"
          keyboardType="numeric"
        />
        
        <View style={styles.buttonRow}>
          {useAutoDetection ? (
            <TouchableOpacity
              style={styles.button}
              onPress={detectIpAddress}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="refresh" size={18} color="#fff" />
                  <Text style={styles.buttonText}>IP Algıla</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.button}
              onPress={updateIpAddress}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="save" size={18} color="#fff" />
                  <Text style={styles.buttonText}>Kaydet</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={checkConnection}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#1976d2" />
            ) : (
              <>
                <Ionicons name="globe" size={18} color="#1976d2" />
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  Bağlantıyı Test Et
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Ağ Bilgisi</Text>
        
        {networkInfo ? (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Bağlantı Türü:</Text>
              <Text style={styles.infoValue}>{networkInfo.type}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Bağlı:</Text>
              <Text style={styles.infoValue}>
                {networkInfo.isConnected ? 'Evet' : 'Hayır'}
              </Text>
            </View>
            
            {networkInfo.type === 'wifi' && networkInfo.details && (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>WiFi SSID:</Text>
                  <Text style={styles.infoValue}>
                    {networkInfo.details.ssid || 'Bilinmiyor'}
                  </Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>WiFi Gücü:</Text>
                  <Text style={styles.infoValue}>
                    {networkInfo.details.strength 
                      ? `${networkInfo.details.strength}%` 
                      : 'Bilinmiyor'}
                  </Text>
                </View>
              </>
            )}
          </>
        ) : (
          <Text style={styles.infoValue}>Ağ bilgisi alınamadı</Text>
        )}
        
        <TouchableOpacity
          style={[styles.button, styles.fullWidthButton]}
          onPress={loadSettings}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.buttonText}>Bilgileri Yenile</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.infoTextContainer}>
        <Text style={styles.infoText}>
          Not: Mobil cihazınız ve bilgisayarınız aynı WiFi ağında olmalıdır.
          Bilgisayarınızdaki backend sunucunun IP adresi ve portu doğru
          ayarlanmalıdır. Otomatik IP algılama çalışmazsa, "ipconfig"
          komutu ile bilgisayarınızın WiFi IP adresini öğrenip manuel olarak 
          girebilirsiniz.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#1976d2',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#e3f2fd',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#1976d2',
    borderRadius: 4,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  secondaryButtonText: {
    color: '#1976d2',
  },
  fullWidthButton: {
    marginTop: 16,
    marginHorizontal: 0,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
  },
  infoTextContainer: {
    margin: 16,
    marginTop: 0,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});

export default SettingsScreen; 