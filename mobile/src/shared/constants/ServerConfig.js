/**
 * Sunucu Yapılandırması
 * Bu dosya otomatik olarak oluşturulmuştur
 * Oluşturulma tarihi: 18.05.2025 14:32:33
 */

export const SERVER_CONFIG = {
  // Otomatik algılanan IP adresleri
  IP_ADDRESSES: ["192.168.56.1","192.168.137.1","192.168.1.85"],
  
  // Ana IP adresi (kullanılacak)
  PRIMARY_IP: "192.168.1.85",
  
  // Port numarası
  PORT: 5000,
  
  // Backend URL
  API_URL: "http://192.168.1.85:5000/api",
  
  // Backend sağlık kontrolü URL
  HEALTH_CHECK_URL: "http://192.168.1.85:5000/api/health"
};

export default SERVER_CONFIG;
