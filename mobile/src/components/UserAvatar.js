import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

/**
 * UserAvatar component displays a user's profile picture or their initials as a fallback
 * 
 * @param {object} props
 * @param {string} props.uri - The URL of the profile picture
 * @param {string} props.name - The user's name (used for initials if no image is available)
 * @param {number} props.size - The size of the avatar (both width and height)
 * @param {string} props.backgroundColor - Custom background color for the initials avatar
 */
const UserAvatar = ({ uri, name = '', size = 40, backgroundColor }) => {
  // Get initials from name
  const getInitials = () => {
    if (!name) return '?';
    
    const nameParts = name.split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (
      nameParts[0].charAt(0).toUpperCase() + 
      nameParts[nameParts.length - 1].charAt(0).toUpperCase()
    );
  };

  // Determine background color based on name (for consistency)
  const getBackgroundColor = () => {
    if (backgroundColor) return backgroundColor;
    
    const colors = [
      '#F44336', '#E91E63', '#9C27B0', '#673AB7', 
      '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
      '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
      '#FFC107', '#FF9800', '#FF5722'
    ];
    
    if (!name) return colors[0];
    
    // Use name to determine a consistent color
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    
    return colors[sum % colors.length];
  };

  const avatarSize = { width: size, height: size, borderRadius: size / 2 };
  const textSize = { fontSize: size * 0.4 };

  return (
    <View style={[styles.container, avatarSize]}>
      {uri ? (
        <Image 
          source={{ uri }} 
          style={[styles.image, avatarSize]} 
        />
      ) : (
        <View style={[styles.initialsContainer, avatarSize, { backgroundColor: getBackgroundColor() }]}>
          <Text style={[styles.initialsText, textSize]}>
            {getInitials()}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default UserAvatar; 