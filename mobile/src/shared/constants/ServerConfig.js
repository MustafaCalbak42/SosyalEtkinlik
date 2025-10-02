/**
 * Sunucu Yapılandırması
 * Bu dosya otomatik olarak oluşturulmuştur
 * Oluşturulma tarihi: 08.09.2025 15:35:53
 */

export const SERVER_CONFIG = {
  // Otomatik algılanan IP adresleri
  IP_ADDRESSES: ["192.168.56.1","192.168.137.1","10.255.195.133"],
  
  // Ana IP adresi (kullanılacak)
  PRIMARY_IP: "10.255.195.133",
  
  // Port numarası
  PORT: 5000,
  
  // Backend URL
  API_URL: "http://10.255.195.133:5000/api",
  
  // Backend sağlık kontrolü URL
  HEALTH_CHECK_URL: "http://10.255.195.133:5000/api/health"
};

export default SERVER_CONFIG;
