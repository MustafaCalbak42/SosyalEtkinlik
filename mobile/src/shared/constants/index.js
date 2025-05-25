/**
 * Sabitler İndeks Dosyası
 * Tüm sabit değerleri tek bir noktadan dışa aktarır
 */

import { SERVER_CONFIG } from './ServerConfig';
import * as AppConstants from './appConstants';

// API URL'i doğrudan dışa aktar
export const API_URL = SERVER_CONFIG.PRIMARY_IP ? `http://${SERVER_CONFIG.PRIMARY_IP}:${SERVER_CONFIG.PORT}/api` : 'http://10.196.204.140:5000/api';

// Renkler
export const COLORS = {
  primary: '#3f51b5',      // Ana renk (indigo)
  secondary: '#f50057',    // İkincil renk (pembe)
  background: '#f5f5f5',   // Arka plan rengi
  surface: '#ffffff',      // Yüzey rengi
  error: '#B00020',        // Hata rengi
  text: '#212121',         // Metin rengi
  secondaryText: '#757575',// İkincil metin rengi
  divider: '#BDBDBD',      // Ayırıcı rengi
  disabled: '#9E9E9E',     // Devre dışı rengi
  accent: '#03A9F4',       // Vurgu rengi
  success: '#4CAF50',      // Başarı rengi
  warning: '#FFC107',      // Uyarı rengi
  info: '#2196F3',         // Bilgi rengi
};

// Tema
export const THEME = {
  COLORS,
  SIZES: {
    base: 8,
    small: 12,
    font: 14,
    medium: 16,
    large: 18,
    extraLarge: 24,
  },
  FONTS: {
    regular: 'System',
    medium: 'System-Medium',
    bold: 'System-Bold',
  },
};

// Tüm sabitleri dışa aktar
export { SERVER_CONFIG, AppConstants };

// Varsayılan dışa aktarma
export default {
  API_URL,
  COLORS,
  THEME,
  SERVER_CONFIG,
  ...AppConstants,
}; 