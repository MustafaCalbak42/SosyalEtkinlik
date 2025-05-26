import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, Tooltip, IconButton } from '@mui/material';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapSelector.css';
import { MAP_CONFIG } from '../../shared/constants/appConstants';
import { MyLocation as MyLocationIcon, Refresh as RefreshIcon } from '@mui/icons-material';

// Leaflet varsayılan ikonlarını düzeltmek için
// Bu olmadan Leaflet'in varsayılan ikonları görüntülenmez
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Mavi marker ikonu
const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Harita görünümünü kullanıcının konumuna taşıyan bileşen
const FlyToUserLocation = ({ userPosition }) => {
  const map = useMap();
  
  useEffect(() => {
    if (userPosition) {
      map.flyTo(userPosition, 15, {
        duration: 1.5
      });
    }
  }, [userPosition, map]);
  
  return null;
};

// Harita içinde marker konumunu güncellemek için yardımcı bileşen
const LocationMarker = ({ position, setPosition, onMarkerPlace }) => {
  // Harita olaylarını yakalamak için
  const mapEvents = useMapEvents({
    click(e) {
      const newPosition = [e.latlng.lat, e.latlng.lng];
      setPosition(newPosition);
      
      // Konum değiştiğinde hemen adres bilgisini al
      if (onMarkerPlace) {
        onMarkerPlace(newPosition);
      }
    },
  });

  return (
    <>
      {position && <Marker position={position} icon={blueIcon} />}
    </>
  );
};

const MapSelector = ({ onLocationSelect, initialPosition = null }) => {
  // Başlangıç konumu olarak varsayılan merkez veya verilen konum
  const [position, setPosition] = useState(initialPosition || null);
  const [userPosition, setUserPosition] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const [addressFetched, setAddressFetched] = useState(false); // Adresin alınıp alınmadığını izlemek için
  const mapRef = useRef();
  const lastFetchedPosition = useRef(null); // Son adres alınan konum

  // Komponent yüklendiğinde kullanıcının konumunu al
  useEffect(() => {
    getUserLocation();
  }, []);

  // Kullanıcının konumunu al
  const getUserLocation = () => {
    setGeolocating(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserPosition([latitude, longitude]);
          
          // Eğer daha önce bir konum seçilmemişse, kullanıcının konumunu başlangıç konumu olarak ayarla
          if (!position && !initialPosition) {
            setPosition([latitude, longitude]);
            
            // Adres bilgisini çekmek için konum değişikliğini tetikle
            fetchAddressFromCoordinates([latitude, longitude]);
          }
          
          setGeolocating(false);
        },
        (error) => {
          console.error("Konum alınamadı:", error);
          setGeolocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      console.error("Tarayıcınız konum hizmetlerini desteklemiyor.");
      setGeolocating(false);
    }
  };

  // Adres bilgisini getiren fonksiyon - daha temiz kod için ayrı bir fonksiyon olarak çıkardık
  const fetchAddressFromCoordinates = useCallback(async (coords) => {
    if (!coords) return;
    
    // Aynı konum için tekrar istek yapılmasını engelle
    if (lastFetchedPosition.current && 
        lastFetchedPosition.current[0] === coords[0] && 
        lastFetchedPosition.current[1] === coords[1] && 
        addressFetched) {
      console.log('Bu konum için adres zaten alındı, tekrar alınmıyor.');
      return;
    }
    
    setLoading(true);
    setAddress('Adres alınıyor...');
    
    try {
      // OpenStreetMap Nominatim servisi ile koordinatlardan adres bulma
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.display_name) {
        setAddress(data.display_name);
        
        // Bulunan konumu üst bileşene bildir
        onLocationSelect({
          coordinates: coords,
          address: data.display_name
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
  }, [onLocationSelect, addressFetched]);

  // Konum değiştiğinde adres bilgisini güncelle - şimdi koordinatları kontrol ediyoruz
  useEffect(() => {
    if (position) {
      // Mevcut konum, son alınan konumdan farklıysa adres bilgisini al
      if (!lastFetchedPosition.current || 
          lastFetchedPosition.current[0] !== position[0] || 
          lastFetchedPosition.current[1] !== position[1]) {
        fetchAddressFromCoordinates(position);
      }
    }
  }, [position, fetchAddressFromCoordinates]);

  // Konuma git butonu tıklandığında
  const handleGoToMyLocation = () => {
    getUserLocation();
    
    // Kullanıcı konumuna gidildiğinde, adres bilgisini yeniden almaya izin ver
    if (userPosition) {
      lastFetchedPosition.current = null;
      setAddressFetched(false);
    }
  };

  // Harita merkezi - kullanıcı konumu veya varsayılan merkez
  const mapCenter = userPosition || [MAP_CONFIG.DEFAULT_CENTER.lat, MAP_CONFIG.DEFAULT_CENTER.lng];

  // Marker konumu değiştiğinde hemen adres bilgisini al
  const handleMarkerPlace = (coords) => {
    // Son adres alınan konumdan farklıysa yeni adres al
    if (!lastFetchedPosition.current || 
        lastFetchedPosition.current[0] !== coords[0] || 
        lastFetchedPosition.current[1] !== coords[1]) {
      console.log('Yeni konum seçildi, adres alınıyor:', coords);
      fetchAddressFromCoordinates(coords);
    } else {
      console.log('Aynı konum tekrar seçildi, adres tekrar alınmıyor.');
      
      // Aynı konum tekrar seçilse bile bilgiyi üst bileşene gönder
      if (onLocationSelect && position) {
        onLocationSelect({
          coordinates: position, // [latitude, longitude] formatında
          address: address
        });
      }
    }
  };

  // Adres bilgisini yenileme
  const resetAddress = () => {
    if (position) {
      console.log('Adres bilgisi yenileniyor...');
      lastFetchedPosition.current = null;
      setAddressFetched(false);
      fetchAddressFromCoordinates(position);
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper 
        elevation={3} 
        sx={{ 
          width: '100%', 
          height: 300, 
          overflow: 'hidden', 
          borderRadius: 2, 
          mb: 2,
          position: 'relative'
        }}
      >
        <MapContainer
          center={mapCenter}
          zoom={MAP_CONFIG.DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker 
            position={position} 
            setPosition={setPosition} 
            onMarkerPlace={handleMarkerPlace}
          />
          {userPosition && <FlyToUserLocation userPosition={userPosition} />}
        </MapContainer>
        
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 10, 
            right: 10, 
            zIndex: 1000 
          }}
        >
          <Button 
            variant="contained" 
            color="primary" 
            size="small"
            startIcon={geolocating ? <CircularProgress size={16} color="inherit" /> : <MyLocationIcon />}
            onClick={handleGoToMyLocation}
            disabled={geolocating}
            sx={{ borderRadius: 8 }}
          >
            {geolocating ? 'Konum Alınıyor...' : 'Konumuma Git'}
          </Button>
        </Box>
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography 
            variant="body2" 
            color={loading ? "text.secondary" : "text.primary"}
            sx={{ 
              mt: 1, 
              fontWeight: loading ? 'normal' : 'medium',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {loading && <CircularProgress size={16} sx={{ mr: 1 }} />}
            {address || 'Haritada bir konum seçmek için tıklayın'}
          </Typography>
          
          {position && (
            <Tooltip title="Adres bilgisini yenile">
              <IconButton 
                size="small" 
                color="primary" 
                onClick={resetAddress}
                disabled={loading}
                sx={{ ml: 1 }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        
        {position && (
          <Typography variant="caption" color="text.secondary">
            Enlem: {position[0].toFixed(6)} | Boylam: {position[1].toFixed(6)}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default MapSelector; 