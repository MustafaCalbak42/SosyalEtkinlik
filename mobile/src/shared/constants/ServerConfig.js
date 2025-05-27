/**
 * Sunucu Yapılandırması
 * Bu dosya otomatik olarak oluşturulmuştur
 * Oluşturulma tarihi: 27.05.2025 18:00:18
 */

export const SERVER_CONFIG = {
  // Otomatik algılanan IP adresleri
  IP_ADDRESSES: ["192.168.56.1","192.168.137.1","10.196.204.140"],
  
  // Ana IP adresi (kullanılacak)
  PRIMARY_IP: "10.196.204.140",
  
  // Port numarası
  PORT: 5000,
  
  // Backend URL
  API_URL: "http://10.196.204.140:5000/api",
  
  // Backend sağlık kontrolü URL
  HEALTH_CHECK_URL: "http://10.196.204.140:5000/api/health"
};

export default SERVER_CONFIG;
