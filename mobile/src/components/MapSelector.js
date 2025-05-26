import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { MAP_CONFIG } from '../shared/constants/appConstants';
import colors from '../shared/theme/colors';

const MapSelector = ({ onLocationSelect, initialPosition = null }) => {
  // Başlangıç konumu olarak varsayılan merkez veya verilen konum
  const [position, setPosition] = useState(initialPosition ? {
    latitude: initialPosition[0],
    longitude: initialPosition[1],
  } : null);
  const [userPosition, setUserPosition] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const [addressFetched, setAddressFetched] = useState(false);
  const mapRef = useRef(null);
  const lastFetchedPosition = useRef(null);

  // Komponent yüklendiğinde konum izni al ve kullanıcı konumunu getir
  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Konum izni iste
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        getUserLocation();
      } else {
        Alert.alert(
          'Konum İzni Gerekli',
          'Haritayı kullanmak için konum izni vermeniz gerekmektedir.',
          [{ text: 'Tamam' }]
        );
      }
    } catch (error) {
      console.error('Konum izni alınırken hata:', error);
    }
  };

  // Kullanıcının konumunu al
  const getUserLocation = async () => {
    setGeolocating(true);
    
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      const { latitude, longitude } = location.coords;
      setUserPosition({ latitude, longitude });
      
      // Eğer daha önce bir konum seçilmemişse, kullanıcının konumunu başlangıç konumu olarak ayarla
      if (!position && !initialPosition) {
        setPosition({ latitude, longitude });
        
        // Adres bilgisini çekmek için konum değişikliğini tetikle
        fetchAddressFromCoordinates({ latitude, longitude });
      }
      
      // Haritayı kullanıcının konumuna taşı
      animateToLocation({ latitude, longitude });
    } catch (error) {
      console.error('Konum alınamadı:', error);
      Alert.alert(
        'Konum Alınamadı',
        'Mevcut konumunuz alınamadı. Lütfen konum servisinizin açık olduğundan emin olun.',
        [{ text: 'Tamam' }]
      );
    } finally {
      setGeolocating(false);
    }
  };

  // Haritayı belirtilen konuma animasyonla taşı
  const animateToLocation = (location) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        ...location,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      }, 1000);
    }
  };

  // Adres bilgisini koordinatlardan al
  const fetchAddressFromCoordinates = async (coords) => {
    if (!coords) return;
    
    // Aynı konum için tekrar istek yapılmasını engelle
    if (lastFetchedPosition.current && 
        lastFetchedPosition.current.latitude === coords.latitude && 
        lastFetchedPosition.current.longitude === coords.longitude && 
        addressFetched) {
      console.log('Bu konum için adres zaten alındı, tekrar alınmıyor.');
      return;
    }
    
    setLoading(true);
    setAddress('Adres alınıyor...');
    
    try {
      // Expo Location API ile adres bilgisini al
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude
      });
      
      if (addressResponse && addressResponse.length > 0) {
        const addressObj = addressResponse[0];
        const formattedAddress = [
          addressObj.name,
          addressObj.street,
          addressObj.district,
          addressObj.city,
          addressObj.region,
          addressObj.country
        ].filter(Boolean).join(', ');
        
        setAddress(formattedAddress);
        
        // Bulunan konumu üst bileşene bildir
        onLocationSelect({
          coordinates: [coords.latitude, coords.longitude], // [latitude, longitude] formatında
          address: formattedAddress
        });
        
        // Bu konumun adresini aldığımızı işaretle
        lastFetchedPosition.current = coords;
        setAddressFetched(true);
      } else {
        setAddress('Adres bulunamadı. Lütfen başka bir konum seçin.');
      }
    } catch (error) {
      console.error('Adres bulunamadı:', error);
      setAddress('Adres bilgisi alınamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Harita üzerinde bir noktaya tıklandığında
  const handleMapPress = (event) => {
    const { coordinate } = event.nativeEvent;
    setPosition(coordinate);
    fetchAddressFromCoordinates(coordinate);
  };

  // Konumuma Git butonuna tıklandığında
  const handleGoToMyLocation = () => {
    getUserLocation();
    
    // Kullanıcı konumuna gidildiğinde, adres bilgisini yeniden almaya izin ver
    if (userPosition) {
      lastFetchedPosition.current = null;
      setAddressFetched(false);
    }
  };

  // Adres bilgisini yenileme
  const refreshAddress = () => {
    if (position) {
      console.log('Adres bilgisi yenileniyor...');
      lastFetchedPosition.current = null;
      setAddressFetched(false);
      fetchAddressFromCoordinates(position);
    }
  };

  // Başlangıç bölgesi
  const initialRegion = {
    latitude: MAP_CONFIG.DEFAULT_CENTER.lat,
    longitude: MAP_CONFIG.DEFAULT_CENTER.lng,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={initialRegion}
          onPress={handleMapPress}
        >
          {position && (
            <Marker
              coordinate={position}
              title="Seçilen Konum"
              description={address}
              pinColor={colors.primary.main}
            />
          )}
        </MapView>
        
        {/* Konumuma Git Butonu */}
        <TouchableOpacity 
          style={styles.myLocationButton}
          onPress={handleGoToMyLocation}
          disabled={geolocating}
        >
          {geolocating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="locate" size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* Adres Bilgisi */}
      <View style={styles.addressContainer}>
        <View style={styles.addressTextContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary.main} />
              <Text style={styles.loadingText}>Adres alınıyor...</Text>
            </View>
          ) : (
            <Text style={styles.addressText}>
              {address || 'Haritada bir konum seçmek için dokunun'}
            </Text>
          )}
        </View>
        
        {position && (
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={refreshAddress}
            disabled={loading}
          >
            <Ionicons name="refresh" size={20} color={colors.primary.main} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Koordinat Bilgisi */}
      {position && (
        <Text style={styles.coordinatesText}>
          Enlem: {position.latitude.toFixed(6)} | Boylam: {position.longitude.toFixed(6)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16
  },
  mapContainer: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.grey[300]
  },
  map: {
    width: '100%',
    height: '100%'
  },
  myLocationButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.primary.main,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4
  },
  addressTextContainer: {
    flex: 1,
    marginRight: 8
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  loadingText: {
    marginLeft: 8,
    color: colors.text.secondary,
    fontSize: 14
  },
  addressText: {
    fontSize: 14,
    color: colors.text.primary
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.grey[200]
  },
  coordinatesText: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'right',
    marginTop: 4
  }
});

export default MapSelector; 