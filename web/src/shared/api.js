import axios from 'axios';

// API baz URL'ini belirle
const isProduction = process.env.NODE_ENV === 'production';
const API_BASE_URL = isProduction 
  ? 'https://api.sosyaletkinlik.com/api'
  : 'http://localhost:5000/api';

// Axios instance oluştur
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000
});

// Token kullanımını debug için
const logTokenDebug = () => {
  const token = localStorage.getItem('token');
  console.log(`[API Debug] Current token: ${token ? token.substring(0, 15) + '...' : 'null'}`);
  return token;
};

// İstek engelleme (interceptors)
api.interceptors.request.use(
  async (config) => {
    // Saklanan token'ı al
    const token = logTokenDebug();
    
    // Token varsa, isteklerin header'ına ekle
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log(`[API Debug] Request to ${config.url} with Authorization header`);
    } else {
      console.warn(`[API Debug] Request to ${config.url} WITHOUT Authorization header!`);
    }
    
    return config;
  },
  (error) => {
    console.error('[API Debug] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Yanıt engelleme
api.interceptors.response.use(
  (response) => {
    console.log(`[API Debug] Response from ${response.config.url}, status: ${response.status}`);
    return response;
  },
  async (error) => {
    console.error(`[API Debug] Response error from ${error.config?.url || 'unknown'}:`, error.message);
    
    const originalRequest = error.config;
    
    // Token süresi dolmuşsa yenileme işlemi
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log('[API Debug] Attempting to refresh token due to 401 response');
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          console.log('[API Debug] RefreshToken found, trying to get new token');
          const response = await axios.post(`${API_BASE_URL}/users/refresh-token`, { 
            refreshToken
          });
          
          if (response.data.success) {
            const { token } = response.data.data;
            console.log('[API Debug] New token received, updating storage');
            
            // Yeni token'ı sakla
            localStorage.setItem('token', token);
            
            // Yeni token ile isteği tekrarla
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          } else {
            console.error('[API Debug] Token refresh failed:', response.data.message);
          }
        } else {
          console.error('[API Debug] No refresh token available');
        }
        
        // Token yenilenemezse çıkış yap
        console.warn('[API Debug] Clearing auth data and redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Kullanıcıyı login sayfasına yönlendir
        window.location.href = '/login';
      } catch (refreshError) {
        console.error('[API Debug] Token refresh error:', refreshError);
        
        // Çıkış yap
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Kullanıcıyı login sayfasına yönlendir
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// API eksik token ile çağrıldığında kontrol et
console.log('[API Debug] API client initialized, checking token...');
logTokenDebug();

export default api; 