import api from '../shared/api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../shared/constants';

/**
 * Kullanıcı giriş işlemi yapar
 * @param {Object} loginData - Giriş bilgileri (email, password)
 * @returns {Promise<Object>}
 */
export const loginUser = async (loginData) => {
  try {
    const response = await api.auth.login(loginData);
    
    if (response.data.success && response.data.data) {
      // Token'ı AsyncStorage'a kaydet
      if (response.data.data.token) {
        await AsyncStorage.setItem('token', response.data.data.token);
      }
      
      if (response.data.data.refreshToken) {
        await AsyncStorage.setItem('refreshToken', response.data.data.refreshToken);
      }
      
      // Kullanıcı bilgilerini kaydet
      await AsyncStorage.setItem('user', JSON.stringify(response.data.data));
    }
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw handleError(error);
  }
};

/**
 * Kullanıcı kaydı yapar
 * @param {Object} registerData - Kayıt bilgileri
 * @returns {Promise<Object>}
 */
export const registerUser = async (registerData) => {
  try {
    // Form verilerini işle
    let processedData = { ...registerData };
    
    // Hobi verilerini işle - Eğer hobiler varsa yalnızca ID'lerini gönder
    if (registerData.hobbies && Array.isArray(registerData.hobbies)) {
      // Hobi objelerini ID'lere dönüştür
      processedData.hobbies = registerData.hobbies.map(hobby => 
        typeof hobby === 'object' && hobby._id ? hobby._id : hobby
      );
    }
    
    // İlgi alanlarını işle
    if (!registerData.interests) {
      processedData.interests = [];
    }
    
    // Biyografiyi kontrol et
    if (!registerData.bio) {
      processedData.bio = '';
    }
    
    // Şehir bilgisini konum nesnesine dönüştür
    if (registerData.city) {
      processedData.location = {
        address: registerData.city,
        // Gerçek koordinatlar API tarafında hesaplanabilir
        coordinates: [0, 0]
      };
    }
    
    const response = await api.auth.register(processedData);
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Kullanıcı çıkış işlemi
 */
export const logoutUser = async () => {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('refreshToken');
  await AsyncStorage.removeItem('userData');
};

/**
 * Token'ın geçerli olup olmadığını kontrol eder
 * @returns {Promise<boolean>}
 */
export const isAuthenticated = async () => {
  const token = await AsyncStorage.getItem('token');
  return !!token;
};

/**
 * Şifre sıfırlama isteği oluşturur (şifremi unuttum)
 * @param {Object} emailData - Email bilgisi
 * @returns {Promise<Object>}
 */
export const forgotPassword = async (emailData) => {
  try {
    console.log('Şifre sıfırlama isteği gönderiliyor:', emailData);
    const response = await api.auth.forgotPassword(emailData);
    console.log('Şifre sıfırlama cevabı:', response.data);
    return response.data;
  } catch (error) {
    console.error('Şifre sıfırlama hatası:', error);
    throw handleError(error);
  }
};

/**
 * Şifre sıfırlama kodunu doğrular
 * @param {Object} data - Kod doğrulama verileri (email, code)
 * @returns {Promise<Object>}
 */
export const verifyResetCode = async (data) => {
  try {
    console.log('Kod doğrulama isteği gönderiliyor:', data);
    const response = await api.auth.verifyResetCode(data);
    console.log('Kod doğrulama cevabı:', response.data);
    return response.data;
  } catch (error) {
    console.error('Kod doğrulama hatası:', error);
    throw handleError(error);
  }
};

/**
 * Şifreyi sıfırlar
 * @param {Object} data - Şifre sıfırlama verileri (email, code, password)
 * @returns {Promise<Object>}
 */
export const resetPassword = async (data) => {
  try {
    console.log('Şifre yenileme isteği gönderiliyor:', {...data, password: '******'});
    const response = await api.auth.resetPassword(data);
    console.log('Şifre yenileme cevabı:', response.data);
    
    // Otomatik giriş için token varsa kaydet
    if (response.data.success && response.data.data) {
      if (response.data.data.token) {
        await AsyncStorage.setItem('token', response.data.data.token);
      }
      
      if (response.data.data.refreshToken) {
        await AsyncStorage.setItem('refreshToken', response.data.data.refreshToken);
      }
      
      // Kullanıcı bilgilerini kaydet
      await AsyncStorage.setItem('user', JSON.stringify(response.data.data));
    }
    
    return response.data;
  } catch (error) {
    console.error('Şifre yenileme hatası:', error);
    throw handleError(error);
  }
};

/**
 * E-posta doğrulama kodunu doğrular ve kullanıcı kaydını tamamlar
 * @param {Object} data - E-posta doğrulama verileri (email, code)
 * @returns {Promise<Object>}
 */
export const verifyEmailCode = async (data) => {
  try {
    console.log('E-posta doğrulama isteği gönderiliyor:', data);
    
    const response = await api.auth.verifyEmail(data);
    
    console.log('Doğrulama yanıtı:', response.data);
    
    // Doğrulama başarılıysa ve token döndüyse AsyncStorage'a kaydet
    if (response.data.success && response.data.accessToken) {
      await AsyncStorage.setItem('token', response.data.accessToken);
      
      if (response.data.refreshToken) {
        await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
      }
      
      // Kullanıcı bilgilerini de kaydet
      if (response.data.data) {
        await AsyncStorage.setItem('user', JSON.stringify(response.data.data));
      }
      
      console.log('Doğrulama başarılı, token ve kullanıcı kaydedildi');
    }
    
    return response.data;
  } catch (error) {
    console.error('E-posta doğrulama hatası:', error);
    
    // Hata yanıtını formatla
    if (error.response?.data) {
      return {
        success: false,
        message: error.response.data.message || 'Doğrulama işlemi başarısız oldu'
      };
    }
    
    throw handleError(error);
  }
};

/**
 * API hata işleme
 * @param {Error} error - Axios hatası
 * @returns {Error} - İşlenmiş hata
 */
const handleError = (error) => {
  if (error.response) {
    // Sunucu yanıtı hatası
    const errorMessage = error.response.data.message || error.response.statusText;
    const customError = new Error(errorMessage);
    customError.status = error.response.status;
    customError.data = error.response.data;
    return customError;
  } else if (error.request) {
    // İstek yapıldı ama yanıt alınamadı
    return new Error('Sunucudan yanıt alınamadı. Lütfen internet bağlantınızı kontrol edin.');
  } else {
    // İstek yapılırken bir hata oluştu
    return error;
  }
};

/**
 * Tüm kullanıcıları sayfalı olarak getirir
 * @param {number} page - Sayfa numarası
 * @param {number} limit - Sayfa başına kullanıcı sayısı
 * @returns {Promise<Object>}
 */
export const getAllUsers = async (page = 1, limit = 10) => {
  try {
    console.log(`[userService] Kullanıcılar getiriliyor: Sayfa ${page}, Limit ${limit}`);
    
    // Token kontrolü
    const token = await AsyncStorage.getItem('token');
    if (!token || token.trim().length === 0) {
      console.warn('[userService] Token bulunamadı');
      return {
        success: false,
        message: 'Token bulunamadı'
      };
    }
    
    const cleanToken = token.trim();
    
    // Alternatif endpoint'ler için deneme sayaçları
    let tryCount = 0;
    const maxTries = 3;
    
    // Endpoint'leri dene
    const endpoints = [
      `${API_URL}/users/all`,
      `${API_URL}/users`,
      `${API_URL}/users/similar`
    ];
    
    // Varsayılan örnek kullanıcılar (API'ler çalışmadığında gösterilecek)
    const fallbackUsers = [
      {
        _id: 'sample1',
        username: 'user1',
        fullName: 'Örnek Kullanıcı 1',
        bio: 'Bu örnek bir kullanıcıdır.',
        hobbies: ['Kitap okumak', 'Yürüyüş']
      },
      {
        _id: 'sample2',
        username: 'user2',
        fullName: 'Örnek Kullanıcı 2',
        bio: 'Bu örnek bir kullanıcıdır.',
        hobbies: ['Müzik', 'Spor']
      },
      {
        _id: 'sample3',
        username: 'user3',
        fullName: 'Örnek Kullanıcı 3',
        bio: 'Bu örnek bir kullanıcıdır.',
        hobbies: ['Teknoloji', 'Yazılım']
      }
    ];

    while (tryCount < maxTries) {
      try {
        const endpoint = endpoints[tryCount];
        console.log(`[userService] Endpoint ${tryCount + 1}/${maxTries} deneniyor: ${endpoint}`);
        
        const response = await axios.get(endpoint, {
          params: { page, limit },
          headers: {
            'Authorization': `Bearer ${cleanToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000 // 5 saniye timeout
        });
        
        // Yanıt formatını kontrol et
        if (response.data && (response.data.success || Array.isArray(response.data))) {
          const userData = Array.isArray(response.data) ? response.data : response.data.data || [];
          
          console.log(`[userService] ${userData.length} kullanıcı başarıyla alındı`);
          
          return {
            success: true,
            data: userData,
            pagination: response.data.pagination || {
              page,
              totalPages: Math.ceil(userData.length / limit),
              totalItems: userData.length
            }
          };
        } else {
          console.warn(`[userService] Geçersiz API yanıtı (endpoint ${tryCount + 1}):`, response.data);
          tryCount++;
        }
      } catch (endpointError) {
        console.warn(`[userService] Endpoint ${tryCount + 1} hatası:`, endpointError.message);
        tryCount++;
      }
    }
    
    // Tüm denemeler başarısız olduysa, varsayılan örnek kullanıcıları döndür
    console.log('[userService] Tüm API endpointleri başarısız oldu, örnek kullanıcılar gösteriliyor');
    return {
      success: true,
      message: 'API sunucusuna erişilemedi, örnek kullanıcılar gösteriliyor',
      data: fallbackUsers,
      pagination: {
        page: 1,
        totalPages: 1,
        totalItems: fallbackUsers.length
      }
    };
    
  } catch (error) {
    console.error('[userService] Kullanıcıları getirme hatası:', error);
    
    // Hata durumunda örnek kullanıcıları döndür
    return {
      success: true,
      message: 'Kullanıcılar yüklenirken hata oluştu, örnek kullanıcılar gösteriliyor',
      data: [
        {
          _id: 'sample1',
          username: 'user1',
          fullName: 'Örnek Kullanıcı 1',
          bio: 'Bu örnek bir kullanıcıdır.',
          hobbies: ['Kitap okumak', 'Yürüyüş']
        },
        {
          _id: 'sample2',
          username: 'user2',
          fullName: 'Örnek Kullanıcı 2',
          bio: 'Bu örnek bir kullanıcıdır.',
          hobbies: ['Müzik', 'Spor']
        },
        {
          _id: 'sample3',
          username: 'user3',
          fullName: 'Örnek Kullanıcı 3',
          bio: 'Bu örnek bir kullanıcıdır.',
          hobbies: ['Teknoloji', 'Yazılım']
        }
      ],
      pagination: {
        page: 1,
        totalPages: 1,
        totalItems: 3
      }
    };
  }
};

/**
 * Benzer hobilere sahip kullanıcıları getirir
 * @param {number} page - Sayfa numarası
 * @param {number} limit - Sayfa başına kayıt sayısı
 * @returns {Promise<Object>}
 */
export const getSimilarUsers = async (page = 1, limit = 5) => {
  try {
    console.log('[userService] Hobi bazlı benzer kullanıcılar getiriliyor');
    
    // Token kontrolü
    const token = await AsyncStorage.getItem('token');
    if (!token || token.trim().length === 0) {
      console.warn('[userService] Token bulunamadı, benzer kullanıcılar getirilemez');
      return {
        success: false,
        message: 'Benzer kullanıcıları görmek için lütfen giriş yapın'
      };
    }
    
    const cleanToken = token.trim();
    
    // API isteği yap
    const response = await axios.get(`${API_URL}/users/similar`, {
      params: { page, limit },
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 saniye timeout
    });
    
    if (response.data && response.data.success) {
      console.log(`[userService] ${response.data.data.length} benzer kullanıcı bulundu`);
      return response.data;
    } else {
      console.error('[userService] Geçersiz API yanıt formatı:', response.data);
      return {
        success: false,
        message: 'Beklenmeyen API yanıt formatı'
      };
    }
  } catch (error) {
    console.error('[userService] Benzer kullanıcıları getirirken hata:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Benzer kullanıcılar yüklenirken bir hata oluştu'
    };
  }
};

export default {
  loginUser,
  registerUser,
  logoutUser,
  isAuthenticated,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  verifyEmailCode,
  getAllUsers,
  getSimilarUsers
}; 