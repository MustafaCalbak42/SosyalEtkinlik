import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import AuthContext from '../contexts/AuthContext';

// Ekranlar
import ProfileScreen from '../screens/ProfileScreen';
import HomeScreen from '../screens/HomeScreen';

// Tab Navigator oluştur
const Tab = createBottomTabNavigator();

const MainNavigator = ({ navigation }) => {
  const { logout } = useContext(AuthContext);
  
  // Logout fonksiyonu
  const handleLogout = async () => {
    try {
      // Önce AuthContext'i kullanarak oturumu sonlandır
      await logout();
      
      console.log('Logged out successfully');
      
      // Stay on home screen, the UI will update since isLoggedIn state changed
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#1976d2',
        tabBarInactiveTintColor: '#777',
        tabBarStyle: {
          height: 60,
          paddingBottom: 10,
          paddingTop: 5,
        },
        headerStyle: {
          backgroundColor: '#1976d2',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerTitleAlign: 'center',
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profilim',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" color={color} size={size} />
          ),
          headerRight: () => (
            <TouchableOpacity
              style={{ marginRight: 15 }}
              onPress={handleLogout}
            >
              <MaterialIcons name="exit-to-app" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator; 