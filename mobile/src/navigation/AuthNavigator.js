import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Ekranlar
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import VerifyResetCodeScreen from '../screens/VerifyResetCodeScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import EmailVerifiedScreen from '../screens/EmailVerifiedScreen';
import VerifyEmailScreen from '../screens/VerifyEmailScreen';

const Stack = createStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1976d2',
          elevation: 0, // Android için gölgeyi kaldır
          shadowOpacity: 0, // iOS için gölgeyi kaldır
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ 
          title: 'Giriş Yap',
          headerLeft: (props) => (
            <TouchableOpacity
              onPress={() => props.navigation.goBack()}
              style={{ marginLeft: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{ title: 'Kayıt Ol' }}
      />
      <Stack.Screen 
        name="VerifyEmail" 
        component={VerifyEmailScreen} 
        options={{ 
          title: 'E-posta Doğrula',
          headerLeft: (props) => (
            <TouchableOpacity
              onPress={() => props.navigation.navigate('Login')}
              style={{ marginLeft: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen} 
        options={{ title: 'Şifremi Unuttum' }}
      />
      <Stack.Screen 
        name="VerifyResetCode" 
        component={VerifyResetCodeScreen} 
        options={{ title: 'Kodu Doğrula' }}
      />
      <Stack.Screen 
        name="ResetPassword" 
        component={ResetPasswordScreen} 
        options={{ title: 'Şifremi Sıfırla' }}
      />
      <Stack.Screen 
        name="EmailVerified" 
        component={EmailVerifiedScreen} 
        options={{ 
          title: 'E-posta Doğrulanıyor',
          headerLeft: null // Geri butonu olmadan tam ekran göster
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator; 