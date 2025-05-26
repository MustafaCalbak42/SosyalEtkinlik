import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { getAllHobbies } from '../services/hobbyService';
import MapSelector from '../components/MapSelector';
import api from '../shared/api/apiClient';
import colors from '../shared/theme/colors';

const CreateEventScreen = ({ navigation }) => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [hobbies, setHobbies] = useState([]);
  const [loadingHobbies, setLoadingHobbies] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Tarih & saat seçici için state'ler
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Form verisi
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    hobbyId: '',
    address: '',
    city: userProfile?.location?.address?.split(',')[0]?.trim() || '',
    coordinates: null, // Haritadan seçilen koordinatlar
    startDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // Yarın
    endDate: new Date(new Date().getTime() + 27 * 60 * 60 * 1000),   // Yarın + 3 saat
    maxParticipants: '10',
    price: '0',
    tags: [],
    requirements: [],
    currentTag: '',
    currentRequirement: ''
  });

  // Form hataları
  const [formErrors, setFormErrors] = useState({});

  // Hobileri yükle
  useEffect(() => {
    const fetchHobbies = async () => {
      try {
        setLoadingHobbies(true);
        const response = await getAllHobbies();
        console.log('[CreateEventScreen] Hobbi yanıtı:', response);
        
        if (response && response.success && Array.isArray(response.data)) {
          setHobbies(response.data);
        } else {
          console.error('[CreateEventScreen] Failed to load hobbies:', response?.message || 'Unknown error');
          setError('Hobiler yüklenemedi. ' + (response?.message || ''));
        }
      } catch (error) {
        console.error('[CreateEventScreen] Error fetching hobbies:', error);
        setError('Hobiler yüklenemedi. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setLoadingHobbies(false);
      }
    };

    fetchHobbies();
  }, []);

  // Input değişikliklerini takip et
  const handleInputChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });

    // Hata varsa temizle
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };

  // Tarih değişikliklerini takip et
  const handleDateChange = (event, selectedDate, type) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
      setShowStartTimePicker(false);
      setShowEndDatePicker(false);
      setShowEndTimePicker(false);
    }

    if (selectedDate) {
      const currentDate = new Date(type.includes('start') ? formData.startDate : formData.endDate);
      
      if (type.includes('Date')) {
        // Sadece tarihi değiştir, saati koru
        selectedDate.setHours(currentDate.getHours(), currentDate.getMinutes());
      } else {
        // Sadece saati değiştir, tarihi koru
        selectedDate.setFullYear(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      }

      setFormData({
        ...formData,
        [type.includes('start') ? 'startDate' : 'endDate']: selectedDate
      });
    }
  };

  // Tag ekle
  const handleTagAdd = () => {
    if (formData.currentTag.trim() && !formData.tags.includes(formData.currentTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.currentTag.trim()],
        currentTag: ''
      });
    }
  };

  // Tag sil
  const handleTagDelete = (tagToDelete) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToDelete)
    });
  };

  // Gereksinim ekle
  const handleRequirementAdd = () => {
    if (formData.currentRequirement.trim() && !formData.requirements.includes(formData.currentRequirement.trim())) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, formData.currentRequirement.trim()],
        currentRequirement: ''
      });
    }
  };

  // Gereksinim sil
  const handleRequirementDelete = (reqToDelete) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter(req => req !== reqToDelete)
    });
  };

  // Konum seçildiğinde çağrılacak fonksiyonu ekle
  const handleLocationSelect = (locationData) => {
    if (locationData) {
      // Haritadan gelen adres bilgisini işle
      const addressParts = locationData.address.split(',');
      // Adresin son kısmından şehir bilgisini çıkarmaya çalış
      const city = addressParts.length > 1 ? 
        (addressParts.find(part => part.includes('İstanbul') || part.includes('Ankara') || 
          part.includes('İzmir') || part.includes('Bursa') || part.includes('Antalya'))) || 
        addressParts[addressParts.length - 3]?.trim() : '';

      setFormData({
        ...formData,
        address: locationData.address,
        city: city || formData.city, // Şehir bulunamazsa mevcut değeri koru
        coordinates: locationData.coordinates // [latitude, longitude] formatında
      });
      
      // Form hatalarını temizle
      if (formErrors.address || formErrors.city || formErrors.coordinates) {
        setFormErrors({
          ...formErrors,
          address: null,
          city: null,
          coordinates: null
        });
      }
    }
  };

  // Form doğrulama
  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) errors.title = 'Etkinlik başlığı zorunludur';
    if (!formData.description.trim() || formData.description.length < 20) errors.description = 'Etkinlik açıklaması en az 20 karakter olmalıdır';
    if (!formData.hobbyId) errors.hobbyId = 'Hobi kategorisi seçmelisiniz';
    if (!formData.address.trim()) errors.address = 'Etkinlik adresi zorunludur';
    if (!formData.city.trim()) errors.city = 'Şehir zorunludur';
    if (!formData.coordinates) errors.coordinates = 'Haritadan konum seçmelisiniz';
    
    // Başlangıç tarihi kontrolü
    const now = new Date();
    if (!formData.startDate || formData.startDate <= now) errors.startDate = 'Başlangıç tarihi gelecekte olmalıdır';
    
    // Bitiş tarihi kontrolü
    if (!formData.endDate) errors.endDate = 'Bitiş tarihi zorunludur';
    else if (formData.endDate <= formData.startDate) errors.endDate = 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır';
    
    // Katılımcı sayısı kontrolü
    if (!formData.maxParticipants || parseInt(formData.maxParticipants) < 2) errors.maxParticipants = 'En az 2 katılımcı olmalıdır';
    
    // Fiyat kontrolü
    if (parseFloat(formData.price) < 0) errors.price = 'Fiyat 0 veya daha büyük olmalıdır';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Etkinlik oluştur
  const handleSubmit = async () => {
    setError('');
    setSuccess(false);
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Tarih formatlarını düzgün ayarla
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      // API'ye gönderilecek verileri hazırla
      const eventData = {
        title: formData.title,
        description: formData.description,
        hobby: formData.hobbyId,
        location: {
          type: 'Point',
          coordinates: formData.coordinates ? 
            // MongoDB GeoJSON formatı: [longitude, latitude]
            [formData.coordinates[1], formData.coordinates[0]] : 
            // Varsayılan koordinatlar (şehir merkezleri)
            getDefaultCityCoordinates(formData.city),
          address: formData.address
        },
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        maxParticipants: parseInt(formData.maxParticipants),
        price: parseFloat(formData.price),
        tags: formData.tags,
        requirements: formData.requirements
      };
      
      console.log('[CreateEventScreen] Creating event:', eventData);
      
      const response = await api.events.create(eventData);
      
      if (response && response.data && response.data.success) {
        setSuccess(true);
        Alert.alert(
          "Başarılı",
          "Etkinlik başarıyla oluşturuldu!",
          [{ text: "Tamam", onPress: () => navigation.navigate('Home') }]
        );
      } else {
        setError(response?.data?.message || 'Etkinlik oluşturulurken bir hata oluştu');
      }
    } catch (error) {
      console.error('[CreateEventScreen] Create event error:', error);
      setError('Etkinlik oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Şehir adından varsayılan koordinatları döndüren yardımcı fonksiyon
  const getDefaultCityCoordinates = (cityName) => {
    const defaultCoordinates = {
      'İstanbul': [29.0121795, 41.0053215],
      'Ankara': [32.8597419, 39.9333635],
      'İzmir': [27.142826, 38.423733],
      'Bursa': [29.0609636, 40.1885425],
      'Antalya': [30.7133233, 36.8968908],
      'Elazığ': [39.2225, 38.6748]
    };
    
    const normalizedCityName = cityName.trim();
    
    for (const [city, coords] of Object.entries(defaultCoordinates)) {
      if (normalizedCityName.includes(city)) {
        return coords;
      }
    }
    
    // Varsayılan olarak İstanbul koordinatlarını döndür
    return [29.0121795, 41.0053215];
  };

  // Formatlanmış tarih/saat
  const formatDate = (date) => {
    return date.toLocaleDateString('tr-TR');
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.primary.main} />
            </TouchableOpacity>
            <Text style={styles.title}>Etkinlik Oluştur</Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>Etkinlik başarıyla oluşturuldu!</Text>
            </View>
          ) : null}

          <View style={styles.formContainer}>
            {/* Etkinlik Adı */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Etkinlik Adı *</Text>
              <TextInput
                style={[styles.input, formErrors.title ? styles.inputError : null]}
                value={formData.title}
                onChangeText={(text) => handleInputChange('title', text)}
                placeholder="Etkinlik adını girin"
              />
              {formErrors.title ? (
                <Text style={styles.errorText}>{formErrors.title}</Text>
              ) : null}
            </View>
            
            {/* Hobi Kategorisi */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hobi Kategorisi *</Text>
              {loadingHobbies ? (
                <ActivityIndicator size="small" color={colors.primary.main} />
              ) : (
                <View style={[styles.pickerContainer, formErrors.hobbyId ? styles.inputError : null]}>
                  <Picker
                    selectedValue={formData.hobbyId}
                    onValueChange={(itemValue) => handleInputChange('hobbyId', itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Kategori seçin" value="" />
                    {hobbies.map((hobby) => (
                      <Picker.Item 
                        key={hobby._id} 
                        label={hobby.name} 
                        value={hobby._id} 
                      />
                    ))}
                  </Picker>
                </View>
              )}
              {formErrors.hobbyId ? (
                <Text style={styles.errorText}>{formErrors.hobbyId}</Text>
              ) : null}
            </View>
            
            {/* Açıklama */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Etkinlik Açıklaması *</Text>
              <TextInput
                style={[styles.input, styles.textArea, formErrors.description ? styles.inputError : null]}
                value={formData.description}
                onChangeText={(text) => handleInputChange('description', text)}
                placeholder="Etkinlik detaylarını girin (en az 20 karakter)"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
              {formErrors.description ? (
                <Text style={styles.errorText}>{formErrors.description}</Text>
              ) : null}
            </View>
            
            {/* Harita Seçici */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Etkinlik Konumu *</Text>
              <Text style={styles.helpText}>
                Etkinlik konumunu harita üzerinde dokunarak seçin. Bu işaretçi etkinlik konumunu belirleyecektir.
              </Text>
              <MapSelector 
                onLocationSelect={handleLocationSelect}
                initialPosition={formData.coordinates}
              />
              {formErrors.coordinates ? (
                <Text style={styles.errorText}>{formErrors.coordinates}</Text>
              ) : null}
            </View>
            
            {/* Adres */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Adres *</Text>
              <TextInput
                style={[styles.input, formErrors.address ? styles.inputError : null]}
                value={formData.address}
                onChangeText={(text) => handleInputChange('address', text)}
                placeholder="Etkinliğin tam adresini girin"
              />
              {formErrors.address ? (
                <Text style={styles.errorText}>{formErrors.address}</Text>
              ) : null}
            </View>
            
            {/* Şehir */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Şehir *</Text>
              <TextInput
                style={[styles.input, formErrors.city ? styles.inputError : null]}
                value={formData.city}
                onChangeText={(text) => handleInputChange('city', text)}
                placeholder="Etkinliğin gerçekleşeceği şehir"
              />
              {formErrors.city ? (
                <Text style={styles.errorText}>{formErrors.city}</Text>
              ) : null}
            </View>
            
            {/* Başlangıç Tarihi ve Saati */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Başlangıç Tarihi ve Saati *</Text>
              <View style={styles.dateTimeContainer}>
                <TouchableOpacity 
                  style={[styles.dateButton, formErrors.startDate ? styles.inputError : null]} 
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>{formatDate(formData.startDate)}</Text>
                  <Ionicons name="calendar" size={20} color={colors.primary.main} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.dateButton, formErrors.startDate ? styles.inputError : null]} 
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Text style={styles.dateButtonText}>{formatTime(formData.startDate)}</Text>
                  <Ionicons name="time" size={20} color={colors.primary.main} />
                </TouchableOpacity>
              </View>
              {formErrors.startDate ? (
                <Text style={styles.errorText}>{formErrors.startDate}</Text>
              ) : null}
              
              {showStartDatePicker && (
                <DateTimePicker
                  value={formData.startDate}
                  mode="date"
                  display="default"
                  onChange={(event, date) => handleDateChange(event, date, 'startDate')}
                />
              )}
              
              {showStartTimePicker && (
                <DateTimePicker
                  value={formData.startDate}
                  mode="time"
                  display="default"
                  onChange={(event, time) => handleDateChange(event, time, 'startTime')}
                />
              )}
            </View>
            
            {/* Bitiş Tarihi ve Saati */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bitiş Tarihi ve Saati *</Text>
              <View style={styles.dateTimeContainer}>
                <TouchableOpacity 
                  style={[styles.dateButton, formErrors.endDate ? styles.inputError : null]} 
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>{formatDate(formData.endDate)}</Text>
                  <Ionicons name="calendar" size={20} color={colors.primary.main} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.dateButton, formErrors.endDate ? styles.inputError : null]} 
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <Text style={styles.dateButtonText}>{formatTime(formData.endDate)}</Text>
                  <Ionicons name="time" size={20} color={colors.primary.main} />
                </TouchableOpacity>
              </View>
              {formErrors.endDate ? (
                <Text style={styles.errorText}>{formErrors.endDate}</Text>
              ) : null}
              
              {showEndDatePicker && (
                <DateTimePicker
                  value={formData.endDate}
                  mode="date"
                  display="default"
                  onChange={(event, date) => handleDateChange(event, date, 'endDate')}
                />
              )}
              
              {showEndTimePicker && (
                <DateTimePicker
                  value={formData.endDate}
                  mode="time"
                  display="default"
                  onChange={(event, time) => handleDateChange(event, time, 'endTime')}
                />
              )}
            </View>
            
            {/* Katılımcı Sayısı */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Maksimum Katılımcı Sayısı *</Text>
              <TextInput
                style={[styles.input, formErrors.maxParticipants ? styles.inputError : null]}
                value={formData.maxParticipants}
                onChangeText={(text) => handleInputChange('maxParticipants', text)}
                keyboardType="numeric"
                placeholder="Örn: 10"
              />
              {formErrors.maxParticipants ? (
                <Text style={styles.errorText}>{formErrors.maxParticipants}</Text>
              ) : null}
            </View>
            
            {/* Ücret */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Etkinlik Ücreti (TL)</Text>
              <TextInput
                style={[styles.input, formErrors.price ? styles.inputError : null]}
                value={formData.price}
                onChangeText={(text) => handleInputChange('price', text)}
                keyboardType="numeric"
                placeholder="Ücretsiz için 0 girin"
              />
              {formErrors.price ? (
                <Text style={styles.errorText}>{formErrors.price}</Text>
              ) : null}
            </View>
            
            {/* Etiketler */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Etiketler</Text>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  value={formData.currentTag}
                  onChangeText={(text) => handleInputChange('currentTag', text)}
                  placeholder="Etiket ekleyin ve + tuşuna basın"
                />
                <TouchableOpacity style={styles.addButton} onPress={handleTagAdd}>
                  <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.tagsContainer}>
                {formData.tags.map((tag, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.tagItem} 
                    onPress={() => handleTagDelete(tag)}
                  >
                    <Text style={styles.tagText}>{tag}</Text>
                    <Ionicons name="close-circle" size={16} color="#fff" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Gereksinimler */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gereksinimler</Text>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  value={formData.currentRequirement}
                  onChangeText={(text) => handleInputChange('currentRequirement', text)}
                  placeholder="Gereksinim ekleyin ve + tuşuna basın"
                />
                <TouchableOpacity style={styles.addButton} onPress={handleRequirementAdd}>
                  <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.tagsContainer}>
                {formData.requirements.map((req, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.tagItem} 
                    onPress={() => handleRequirementDelete(req)}
                  >
                    <Text style={styles.tagText}>{req}</Text>
                    <Ionicons name="close-circle" size={16} color="#fff" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Gönderme Butonları */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => navigation.goBack()}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.submitButton} 
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Etkinlik Oluştur</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8'
  },
  container: {
    flex: 1
  },
  scrollView: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff'
  },
  backButton: {
    marginRight: 16
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  formContainer: {
    padding: 16
  },
  inputGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff'
  },
  inputError: {
    borderColor: '#e53935'
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top'
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 5
  },
  picker: {
    height: 50
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    flex: 0.48,
    backgroundColor: '#fff'
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333'
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginRight: 8
  },
  addButton: {
    backgroundColor: colors.primary.main,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center'
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold'
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8
  },
  tagText: {
    color: '#fff',
    marginRight: 4
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24
  },
  submitButton: {
    backgroundColor: colors.primary.main,
    borderRadius: 8,
    padding: 16,
    flex: 0.48,
    alignItems: 'center'
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: colors.primary.main,
    borderRadius: 8,
    padding: 16,
    flex: 0.48,
    alignItems: 'center'
  },
  cancelButtonText: {
    color: colors.primary.main,
    fontSize: 16,
    fontWeight: '500'
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16
  },
  errorText: {
    color: '#c62828',
    fontSize: 14
  },
  successContainer: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16
  },
  successText: {
    color: '#2e7d32',
    fontSize: 14
  },
  helpText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12
  }
});

export default CreateEventScreen; 