import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { HOBBY_CATEGORIES } from '../shared/constants/appConstants';

const CustomHobbyModal = ({ visible, onClose, onAdd }) => {
  const [hobbyName, setHobbyName] = useState('');
  const [hobbyCategory, setHobbyCategory] = useState('');
  const [hobbyDescription, setHobbyDescription] = useState('');
  const [errors, setErrors] = useState({});

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

  const validateForm = () => {
    const newErrors = {};
    
    if (!hobbyName.trim()) {
      newErrors.name = 'Hobi adı gereklidir';
    } else if (hobbyName.length < 2) {
      newErrors.name = 'Hobi adı en az 2 karakter olmalıdır';
    }
    
    if (!hobbyCategory) {
      newErrors.category = 'Kategori seçiniz';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = () => {
    if (validateForm()) {
      const newHobby = {
        name: hobbyName.trim(),
        category: hobbyCategory,
        description: hobbyDescription.trim() || `Özel hobi: ${hobbyName}`,
        _id: `custom_${Date.now()}`, // Özel ID
        isCustom: true
      };
      
      onAdd(newHobby);
      resetForm();
      onClose();
    }
  };
  
  const resetForm = () => {
    setHobbyName('');
    setHobbyCategory('');
    setHobbyDescription('');
    setErrors({});
  };
  
  const closeModal = () => {
    resetForm();
    onClose();
  };
  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={closeModal}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Özel Hobi Ekle</Text>
            <TouchableOpacity onPress={closeModal}>
              <MaterialIcons name="close" size={24} color="#777" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.formContainer}>
            {/* Hobi Adı Alanı */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Hobi Adı</Text>
              <TextInput
                style={[styles.textInput, errors.name && styles.errorInput]}
                placeholder="Hobi adı giriniz"
                value={hobbyName}
                onChangeText={setHobbyName}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>
            
            {/* Kategori Seçimi */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Kategori</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScrollView}
              >
                {HOBBY_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryItem,
                      hobbyCategory === category && styles.selectedCategoryItem,
                      { backgroundColor: getCategoryColor(category) + '20' } // Transparan arka plan rengi
                    ]}
                    onPress={() => setHobbyCategory(category)}
                  >
                    <Text style={styles.categoryIcon}>{getCategoryIcon(category)}</Text>
                    <Text 
                      style={[
                        styles.categoryText,
                        hobbyCategory === category && styles.selectedCategoryText
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
            </View>
            
            {/* Açıklama Alanı */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Açıklama (İsteğe Bağlı)</Text>
              <TextInput
                style={[styles.textInput, styles.textAreaInput]}
                placeholder="Hobi hakkında kısa bir açıklama yazın"
                value={hobbyDescription}
                onChangeText={setHobbyDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={closeModal}
            >
              <Text style={styles.cancelButtonText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={handleSubmit}
            >
              <Text style={styles.addButtonText}>Ekle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  textAreaInput: {
    minHeight: 100,
  },
  errorInput: {
    borderColor: '#c62828',
  },
  errorText: {
    color: '#c62828',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  categoryScrollView: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedCategoryItem: {
    borderColor: '#bbdefb',
    borderWidth: 2,
  },
  categoryIcon: {
    marginRight: 8,
    fontSize: 18,
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  selectedCategoryText: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#555',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addButton: {
    flex: 1,
    backgroundColor: '#1976d2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CustomHobbyModal; 