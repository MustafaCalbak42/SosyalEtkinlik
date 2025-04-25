import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Ekranlar
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import VerifyResetCodeScreen from '../screens/VerifyResetCodeScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

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
        options={{ title: 'Giriş Yap' }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{ title: 'Kayıt Ol' }}
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
    </Stack.Navigator>
  );
};

export default AuthNavigator; 