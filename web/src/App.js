import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Context
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import VerifyResetCodePage from './pages/VerifyResetCodePage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import EmailVerifiedPage from './pages/EmailVerifiedPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ProfilePage from './pages/ProfilePage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import HomePage from './pages/HomePage';
import EventDetailsPage from './pages/EventDetailsPage';
import UserProfilePage from './pages/UserProfilePage';
import MessagesPage from './pages/MessagesPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  // AuthContext ve localStorage'dan token kontrolü
  const { user, loading, authChecked } = useAuth();
  const token = localStorage.getItem('token');
  
  console.log('[ProtectedRoute] Auth state:', { user: !!user, token: !!token, loading, authChecked });
  
  // Eğer authentication henüz kontrol edilmediyse yükleniyor göster
  if (loading && !authChecked) {
    console.log('[ProtectedRoute] Still loading authentication status');
    return <div>Yükleniyor...</div>;
  }
  
  // Değilse, token kontrolü yap
  if (!token) {
    console.log('[ProtectedRoute] No token found, redirecting to login');
    return <Navigate to="/login" />;
  }
  
  // Hem token hem de user nesnesi varsa, korumalı içeriği göster
  console.log('[ProtectedRoute] Token found, rendering protected content');
  return children;
};

// Theme Settings
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Routes>
            {/* Genel Rotalar */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            
            {/* Şifre sıfırlama akışı */}
            <Route path="/verify-reset-code" element={<VerifyResetCodePage />} />
            <Route path="/reset-password/new" element={<ResetPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} /> {/* Legacy token-based reset */}
            
            {/* E-posta doğrulama */}
            <Route path="/email-verified" element={<EmailVerifiedPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            
            {/* Ana Sayfa */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/home" 
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              } 
            />
            
            {/* Mesajlaşma */}
            <Route 
              path="/messages" 
              element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Korumalı Rotalar */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile/settings" 
              element={
                <ProtectedRoute>
                  <ProfileSettingsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile/:username" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            
            {/* User Profile */}
            <Route path="/users/:userId" element={<UserProfilePage />} />
            
            {/* Event Details */}
            <Route path="/events/:eventId" element={<EventDetailsPage />} />
            
            {/* 404 - Bulunamadı */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App; 