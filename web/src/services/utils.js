/**
 * API URL oluşturmak için yardımcı fonksiyon
 * 
 * @param {string} endpoint - API endpoint adı (users, messages, vb.)
 * @returns {string} - Tam API URL'si
 */
export const getApiUrl = (endpoint) => {
  // Geliştirme ortamında localhost kullan
  if (process.env.NODE_ENV === 'development') {
    return `http://localhost:5000/api/${endpoint}`;
  }
  
  // Üretim ortamı için dinamik hostname
  const hostname = window.location.hostname;
  
  // Localhost üzerinde ama üretim derlemesindeyse
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://localhost:5000/api/${endpoint}`;
  }
  
  // Gerçek üretim ortamı için
  return `${window.location.protocol}//${hostname}/api/${endpoint}`;
};

/**
 * Dosya URL'si oluşturmak için yardımcı fonksiyon
 * 
 * @param {string} path - Dosya yolu (uploads/profiles/image.jpg vb.)
 * @returns {string} - Tam dosya URL'si
 */
export const getFileUrl = (path) => {
  if (!path) return null;
  
  // Geliştirme ortamında localhost kullan
  if (process.env.NODE_ENV === 'development') {
    return `http://localhost:5000/${path}`;
  }
  
  // Üretim ortamı için dinamik hostname
  const hostname = window.location.hostname;
  
  // Localhost üzerinde ama üretim derlemesindeyse
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://localhost:5000/${path}`;
  }
  
  // Gerçek üretim ortamı için
  return `${window.location.protocol}//${hostname}/${path}`;
}; 