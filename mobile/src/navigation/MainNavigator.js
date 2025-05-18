import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import AuthContext from '../contexts/AuthContext';
import { createStackNavigator } from '@react-navigation/stack';

// Ekranlar
import ProfileScreen from '../screens/ProfileScreen';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CreateEventScreen from '../screens/CreateEventScreen';
import EventDetailScreen from '../screens/EventDetailScreen';

// Tab Navigator oluştur
const Tab = createBottomTabNavigator();
const MainStack = createStackNavigator();

// Ana Tab Navigator
const MainTabNavigator = ({ navigation }) => {
  const { logout } = useContext(AuthContext);
  
  // Logout fonksiyonu
  const handleLogout = async () => {
    try {
      // Önce AuthContext'i kullanarak oturumu sonlandır
      await logout();
      
      console.log('Logged out successfully');
      
      // Auth ekranına yönlendir
      navigation.dispatch(
        CommonActions.navigate({
          name: 'Auth',
          params: {},
        })
      );
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
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Ayarlar',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="settings" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// MainNavigator - Hem Tab hem de Stack ekranlarını içerir
const MainNavigator = () => {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="MainTabs" component={MainTabNavigator} />
      <MainStack.Screen 
        name="CreateEvent" 
        component={CreateEventScreen}
        options={{
          headerShown: false,
        }} 
      />
      <MainStack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={{
          headerShown: false,
        }}
      />
    </MainStack.Navigator>
  );
};

export default MainNavigator; 