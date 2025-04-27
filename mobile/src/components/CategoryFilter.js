import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const CategoryFilter = ({ selectedCategory, onSelectCategory }) => {
  // List of all available categories with their icons
  const categories = [
    { name: 'All', icon: 'apps' },
    { name: 'Sports', icon: 'basketball' },
    { name: 'Art', icon: 'palette' },
    { name: 'Music', icon: 'music' },
    { name: 'Food', icon: 'food' },
    { name: 'Technology', icon: 'laptop' },
    { name: 'Education', icon: 'school' },
    { name: 'Travel', icon: 'airplane' },
    { name: 'Dance', icon: 'dance-ballroom' },
    { name: 'Nature', icon: 'nature' },
    { name: 'Others', icon: 'dots-horizontal-circle' }
  ];

  // Get color based on whether the category is selected or not
  const getCategoryColor = (category) => {
    return selectedCategory === category ? '#3f51b5' : '#757575';
  };

  // Get background color based on whether the category is selected or not
  const getCategoryBgColor = (category) => {
    return selectedCategory === category ? 'rgba(63, 81, 181, 0.1)' : 'transparent';
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.name}
            style={[
              styles.categoryItem,
              { backgroundColor: getCategoryBgColor(category.name) }
            ]}
            onPress={() => onSelectCategory(category.name)}
          >
            <Icon
              name={category.icon}
              size={20}
              color={getCategoryColor(category.name)}
            />
            <Text
              style={[
                styles.categoryText,
                { color: getCategoryColor(category.name) }
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  }
});

export default CategoryFilter; 