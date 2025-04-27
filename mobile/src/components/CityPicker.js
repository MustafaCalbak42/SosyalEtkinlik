import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// Şehirler listesi
const CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin', 'Aydın', 'Balıkesir', 
  'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 
  'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkâri', 'Hatay', 
  'Isparta', 'Mersin', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir', 'Kocaeli', 
  'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 
  'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 
  'Uşak', 'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale', 'Batman', 'Şırnak', 'Bartın', 
  'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce'
];

const CityPicker = ({ value, onSelect, error }) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  const handleSelect = (city) => {
    onSelect(city);
    setModalVisible(false);
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.pickerContainer, error ? styles.errorInput : null]} 
        onPress={() => setModalVisible(true)}
      >
        <MaterialIcons name="location-on" size={24} color="#777" style={styles.icon} />
        <Text style={value ? styles.selectedText : styles.placeholderText}>
          {value || 'Şehir Seçiniz'}
        </Text>
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
              <Text style={styles.modalTitle}>Şehir Seçin</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#777" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={CITIES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.cityItem}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.cityText}>
                    {item}
                  </Text>
                  {value === item && (
                    <MaterialIcons name="check" size={20} color="#1976d2" />
                  )}
                </TouchableOpacity>
              )}
            />
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
    maxHeight: '70%',
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
  cityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  cityText: {
    fontSize: 16,
    color: '#333',
  },
});

export default CityPicker; 