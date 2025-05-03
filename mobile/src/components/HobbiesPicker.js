import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getAllHobbies } from '../services/hobbyService';
import { HOBBY_CATEGORIES } from '../shared/constants/appConstants';

const HobbiesPicker = ({ value = [], onChange, error }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [hobbies, setHobbies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  
  // Hobileri yükle
  useEffect(() => {
    const fetchHobbies = async () => {
      setLoading(true);
      try {
        console.log('Hobiler yükleniyor...');
        const response = await getAllHobbies();
        console.log('Hobiler yanıtı:', response);
        
        if (Array.isArray(response)) {
          if (response.length === 0) {
            Alert.alert('Bilgi', 'Henüz hiç hobi eklenmemiş.');
          }
          setHobbies(response);
        } else {
          console.error('Hobiler beklenen formatta değil:', response);
          Alert.alert('Hata', 'Hobiler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
        }
      } catch (err) {
        console.error('Hobiler yüklenirken hata:', err);
        Alert.alert('Hata', err.message || 'Hobiler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHobbies();
  }, []);
  
  // Kategori renklerini belirler
  const getCategoryColor = (category) => {
    const colors = {
      'Spor': '#4caf50',
      'Sanat': '#f44336',
      'Müzik': '#9c27b0',
      'Dans': '#ff9800',
      'Yemek': '#795548',
      'Seyahat': '#2196f3',
      'Eğitim': '#607d8b',
      'Teknoloji': '#00bcd4',
      'Doğa': '#8bc34a',
      'Diğer': '#9e9e9e'
    };
    
    return colors[category] || '#9e9e9e';
  };

  // Kategori ikonlarını belirler
  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Spor':
        return "🏀";
      case 'Sanat': 
        return "🎨";
      case 'Müzik':
        return "🎵";
      case 'Dans':
        return "💃";
      case 'Yemek':
        return "🍳";
      case 'Seyahat':
        return "✈️";
      case 'Eğitim':
        return "📚";
      case 'Teknoloji':
        return "💻";
      case 'Doğa':
        return "🌲";
      case 'Diğer':
        return "⭐";
      default:
        return "⭐";
    }
  };

  // Her hobi için özel ikonlar
  const getHobbyIcon = (hobbyName, category) => {
    // Spor kategorisi
    if (category === 'Spor') {
      switch(hobbyName) {
        case 'Futbol': return "⚽";
        case 'Basketbol': return "🏀";
        case 'Voleybol': return "🏐";
        case 'Tenis': return "🎾";
        case 'Yüzme': return "🏊";
        case 'Koşu': return "🏃";
        case 'Bisiklet': return "🚴";
        case 'Yoga': return "🧘";
        case 'Pilates': return "💪";
        default: return getCategoryIcon(category);
      }
    }
    // Sanat kategorisi
    else if (category === 'Sanat') {
      switch(hobbyName) {
        case 'Resim': return "🖼️";
        case 'Heykel': return "🗿";
        case 'Fotoğrafçılık': return "📷";
        case 'El Sanatları': return "🧶";
        case 'Seramik': return "🏺";
        default: return getCategoryIcon(category);
      }
    }
    // Müzik kategorisi
    else if (category === 'Müzik') {
      switch(hobbyName) {
        case 'Gitar': return "🎸";
        case 'Piyano': return "🎹";
        case 'Şarkı Söyleme': return "🎤";
        case 'Bağlama': return "🪕";
        case 'Keman': return "🎻";
        case 'Perküsyon': return "🥁";
        default: return getCategoryIcon(category);
      }
    }
    // Dans kategorisi
    else if (category === 'Dans') {
      switch(hobbyName) {
        case 'Modern Dans': return "💃";
        case 'Bale': return "🩰";
        case 'Salsa': return "💃";
        case 'Hip Hop': return "🕺";
        case 'Halk Dansları': return "👯";
        default: return getCategoryIcon(category);
      }
    }
    // Yemek kategorisi
    else if (category === 'Yemek') {
      switch(hobbyName) {
        case 'Pasta Yapımı': return "🎂";
        case 'Ekmek Yapımı': return "🍞";
        case 'Dünya Mutfağı': return "🌮";
        case 'Vegan Yemekler': return "🥗";
        case 'Türk Mutfağı': return "🍖";
        default: return getCategoryIcon(category);
      }
    }
    // Seyahat kategorisi
    else if (category === 'Seyahat') {
      switch(hobbyName) {
        case 'Dağ Tırmanışı': return "🏔️";
        case 'Kamp': return "⛺";
        case 'Şehir Turu': return "🏙️";
        case 'Kültür Gezileri': return "🗿";
        case 'Doğa Yürüyüşü': return "🥾";
        default: return getCategoryIcon(category);
      }
    }
    // Eğitim kategorisi
    else if (category === 'Eğitim') {
      switch(hobbyName) {
        case 'Yabancı Dil': return "🗣️";
        case 'Bilgisayar Programlama': return "👨‍💻";
        case 'Tarih': return "📜";
        case 'Felsefe': return "🧠";
        case 'Matematik': return "🔢";
        default: return getCategoryIcon(category);
      }
    }
    // Teknoloji kategorisi
    else if (category === 'Teknoloji') {
      switch(hobbyName) {
        case 'Web Tasarım': return "🌐";
        case 'Mobil Uygulama Geliştirme': return "📱";
        case 'Yapay Zeka': return "🤖";
        case 'Robotik': return "🦾";
        case 'Oyun Geliştirme': return "🎮";
        default: return getCategoryIcon(category);
      }
    }
    // Doğa kategorisi
    else if (category === 'Doğa') {
      switch(hobbyName) {
        case 'Bahçecilik': return "🌱";
        case 'Kuş Gözlemciliği': return "🦜";
        case 'Balıkçılık': return "🎣";
        case 'Doğa Fotoğrafçılığı': return "📸";
        case 'Ekoloji': return "♻️";
        default: return getCategoryIcon(category);
      }
    }
    // Diğer kategorisi
    else if (category === 'Diğer') {
      switch(hobbyName) {
        case 'Satranç': return "♟️";
        case 'Koleksiyon': return "🧸";
        case 'Meditasyon': return "🧘‍♂️";
        case 'Gönüllülük': return "🤝";
        case 'Astroloji': return "🔮";
        default: return getCategoryIcon(category);
      }
    }
    
    // Varsayılan olarak kategori ikonunu kullan
    return getCategoryIcon(category);
  };
  
  const toggleHobby = (hobby) => {
    let newValue = [...value];
    
    // Hobi zaten seçili mi kontrol et
    const selectedIndex = newValue.findIndex(item => 
      (typeof item === 'object' && item._id === hobby._id) || 
      item === hobby._id
    );
    
    if (selectedIndex !== -1) {
      // Var olan seçimi kaldır
      newValue.splice(selectedIndex, 1);
    } else {
      // Yeni seçim ekle
      newValue.push(hobby);
    }
    
    onChange(newValue);
  };
  
  const isSelected = (hobby) => {
    return value.some(item => 
      (typeof item === 'object' && item._id === hobby._id) || 
      item === hobby._id
    );
  };
  
  const getFilteredHobbies = () => {
    if (selectedCategory === 'Tümü') {
      return hobbies;
    }
    return hobbies.filter(hobby => hobby.category === selectedCategory);
  };
  
  const getHobbyNames = () => {
    return value.map(hobby => {
      if (typeof hobby === 'object') {
        return hobby.name;
      }
      // ID ise hobiler listesinde ismine bak
      const foundHobby = hobbies.find(h => h._id === hobby);
      return foundHobby ? foundHobby.name : hobby;
    }).join(', ');
  };

  const renderCategoryIcon = (category) => {
    return (
      <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(category) }]}>
        <Text style={styles.emojiIcon}>{getCategoryIcon(category)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.pickerContainer, error ? styles.errorInput : null]} 
        onPress={() => setModalVisible(true)}
      >
        <MaterialIcons name="category" size={24} color="#777" style={styles.icon} />
        <Text 
          style={[value.length > 0 ? styles.selectedText : styles.placeholderText, styles.textEllipsis]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {value.length > 0 ? getHobbyNames() : 'Hobilerinizi seçin'}
        </Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{value.length}</Text>
        </View>
        <MaterialIcons name="arrow-drop-down" size={24} color="#777" />
      </TouchableOpacity>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hobilerinizi Seçin</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#777" />
              </TouchableOpacity>
            </View>
            
            {/* Kategori Filtreleme */}
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={['Tümü', ...HOBBY_CATEGORIES]}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.categoryList}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.categoryItem, 
                    selectedCategory === item && styles.selectedCategory,
                    item !== 'Tümü' && { backgroundColor: getCategoryColor(item) + '20' } // Hafif transparan arka plan
                  ]}
                  onPress={() => setSelectedCategory(item)}
                >
                  {item !== 'Tümü' && (
                    <Text style={styles.categoryIcon}>{getCategoryIcon(item)}</Text>
                  )}
                  <Text 
                    style={[
                      styles.categoryText, 
                      selectedCategory === item && styles.selectedCategoryText
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1976d2" />
                <Text style={styles.loadingText}>Hobiler yükleniyor...</Text>
              </View>
            ) : (
              <FlatList
                data={getFilteredHobbies()}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.hobbyItem, isSelected(item) && styles.selectedHobbyItem]}
                    onPress={() => toggleHobby(item)}
                  >
                    <View style={styles.hobbyInfo}>
                      <View style={[styles.hobbyIconContainer, { backgroundColor: getCategoryColor(item.category) }]}>
                        <Text style={styles.emojiIcon}>
                          {getHobbyIcon(item.name, item.category)}
                        </Text>
                      </View>
                      <View style={styles.hobbyTextContainer}>
                        <Text style={styles.hobbyName}>{item.name}</Text>
                        <Text style={styles.hobbyCategory}>{item.category}</Text>
                      </View>
                    </View>
                    {isSelected(item) ? (
                      <MaterialIcons name="check-circle" size={24} color="#1976d2" />
                    ) : (
                      <MaterialIcons name="radio-button-unchecked" size={24} color="#777" />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 5,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
    paddingHorizontal: 10,
  },
  errorInput: {
    borderWidth: 1,
    borderColor: '#c62828',
  },
  icon: {
    marginRight: 10,
  },
  placeholderText: {
    flex: 1,
    color: '#aaa',
  },
  selectedText: {
    flex: 1,
    color: '#333',
  },
  textEllipsis: {
    flex: 1,
  },
  countBadge: {
    backgroundColor: '#1976d2',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  countText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#c62828',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryList: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCategory: {
    backgroundColor: '#e3f2fd',
    borderColor: '#bbdefb',
    borderWidth: 1,
  },
  categoryText: {
    color: '#666',
    fontWeight: '500',
  },
  categoryIcon: {
    marginRight: 6,
    fontSize: 16,
  },
  selectedCategoryText: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  hobbyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedHobbyItem: {
    backgroundColor: '#f8f9ff',
  },
  hobbyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  hobbyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emojiIcon: {
    fontSize: 20,
  },
  hobbyTextContainer: {
    flex: 1,
  },
  hobbyName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  hobbyCategory: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
});

export default HobbiesPicker; 