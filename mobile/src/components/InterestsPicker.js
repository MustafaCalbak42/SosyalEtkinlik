import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  FlatList, 
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const InterestsPicker = ({ value = [], onChange, error }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [currentInterest, setCurrentInterest] = useState('');
  
  const addInterest = () => {
    if (currentInterest.trim()) {
      // Eğer ilgi alanı zaten eklenmiş değilse ekle
      if (!value.includes(currentInterest.trim())) {
        const newInterests = [...value, currentInterest.trim()];
        onChange(newInterests);
      }
      setCurrentInterest('');
    }
  };
  
  const removeInterest = (index) => {
    const newInterests = [...value];
    newInterests.splice(index, 1);
    onChange(newInterests);
  };
  
  const renderInterestItem = ({ item, index }) => (
    <View style={styles.interestItem}>
      <Text style={styles.interestText}>{item}</Text>
      <TouchableOpacity onPress={() => removeInterest(index)}>
        <MaterialIcons name="close" size={20} color="#777" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.pickerContainer, error ? styles.errorInput : null]} 
        onPress={() => setModalVisible(true)}
      >
        <MaterialIcons name="interests" size={24} color="#777" style={styles.icon} />
        <Text 
          style={[value.length > 0 ? styles.selectedText : styles.placeholderText, styles.textEllipsis]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {value.length > 0 ? value.join(', ') : 'İlgi alanlarınızı ekleyin'}
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
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>İlgi Alanlarınızı Ekleyin</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#777" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.addInterestContainer}>
              <TextInput
                style={styles.addInterestInput}
                placeholder="İlgi alanınızı yazın ve ekleyin"
                value={currentInterest}
                onChangeText={setCurrentInterest}
                onSubmitEditing={addInterest}
                returnKeyType="done"
              />
              <TouchableOpacity 
                style={styles.addButton}
                onPress={addInterest}
                disabled={!currentInterest.trim()}
              >
                <MaterialIcons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.helpText}>
              İlgi alanlarınızı yazın ve "+" düğmesine basın
            </Text>
            
            {value.length > 0 ? (
              <FlatList
                data={value}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderInterestItem}
                contentContainerStyle={styles.interestsList}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Henüz ilgi alanı eklemediniz. Örn: kitap okuma, yürüyüş, sinema
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.doneButtonText}>Tamamla</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
    maxHeight: '80%',
    paddingBottom: 20,
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
  addInterestContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  addInterestInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#1976d2',
    width: 40,
    height: 40,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 15,
    marginTop: 5,
  },
  interestsList: {
    padding: 15,
  },
  interestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 10,
  },
  interestText: {
    fontSize: 14,
    color: '#333',
    marginRight: 10,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#777',
    textAlign: 'center',
    fontSize: 14,
  },
  doneButton: {
    backgroundColor: '#1976d2',
    marginHorizontal: 15,
    borderRadius: 5,
    padding: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  doneButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default InterestsPicker; 