/**
 * Ağ Bağlantı Kontrolü
 * 
 * Bu script, backend sunucu ve mobil cihazın aynı ağda olup olmadığını 
 * kontrol eder ve gerekli yönlendirmeleri sağlar.
 * 
 * Kullanım: node checkNetworkConnection.js
 */

const os = require('os');
const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Yapılandırma
const CONFIG = {
  backendPort: 5000,
  configFilePath: path.join(__dirname, '../src/shared/constants/ServerConfig.js'),
  networkInfoFilePath: path.join(__dirname, '../network_info.json')
};

/**
 * Bilgisayardaki tüm ağ arayüzlerinden IP adreslerini alır
 * @returns {Array} IP adresleri listesi
 */
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const interfaceName in interfaces) {
    const interfaceInfo = interfaces[interfaceName];
    
    for (const info of interfaceInfo) {
      // Sadece IPv4 ve harici (local olmayan) adresleri al
      if (info.family === 'IPv4' && !info.internal) {
        addresses.push({
          address: info.address,
          interfaceName,
          netmask: info.netmask
        });
      }
    }
  }
  
  return addresses;
}

/**
 * Backend sunucusunun erişilebilir olup olmadığını kontrol et
 * @param {string} ip - Kontrol edilecek IP adresi
 * @param {number} port - Kontrol edilecek port numarası
 * @returns {Promise<boolean>} Sunucu erişilebilirse true, değilse false
 */
async function checkServerReachable(ip, port) {
  return new Promise((resolve) => {
    const req = http.get(`http://${ip}:${port}/api/health`, {
      timeout: 2000
    }, (res) => {
      if (res.statusCode === 200) {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            console.log(`✅ Sunucu erişilebilir: ${ip}:${port}`);
            console.log(`   Sunucu yanıtı: ${response.message || 'OK'}`);
            resolve(true);
          } catch (e) {
            console.log(`❌ Sunucu yanıtı geçersiz JSON: ${ip}:${port}`);
            resolve(false);
          }
        });
      } else {
        console.log(`❌ Sunucu erişilebilir ancak sağlıklı değil: ${ip}:${port} (${res.statusCode})`);
        resolve(false);
      }
    });
    
    req.on('error', (err) => {
      console.log(`❌ Sunucu erişilemez: ${ip}:${port}`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.log(`❌ Sunucu yanıt vermiyor: ${ip}:${port}`);
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Ağ yapılandırmasını mobil uygulama için kaydet
 * @param {Object} networkInfo - Ağ yapılandırma bilgileri
 */
function saveNetworkConfig(networkInfo) {
  try {
    // JSON dosyasına kaydet (kolay referans için)
    fs.writeFileSync(
      CONFIG.networkInfoFilePath, 
      JSON.stringify(networkInfo, null, 2)
    );
    console.log(`✅ Ağ bilgileri kaydedildi: ${CONFIG.networkInfoFilePath}`);
    
    // Constants dosyasına kaydet (uygulama için)
    const configContent = `/**
 * Sunucu Yapılandırması
 * Bu dosya otomatik olarak oluşturulmuştur
 * Oluşturulma tarihi: ${new Date().toLocaleString()}
 */

export const SERVER_CONFIG = {
  // Otomatik algılanan IP adresleri
  IP_ADDRESSES: ${JSON.stringify(networkInfo.ipAddresses.map(ip => ip.address))},
  
  // Ana IP adresi (kullanılacak)
  PRIMARY_IP: "${networkInfo.primaryIp}",
  
  // Port numarası
  PORT: ${CONFIG.backendPort},
  
  // Backend URL
  API_URL: "http://${networkInfo.primaryIp}:${CONFIG.backendPort}/api",
  
  // Backend sağlık kontrolü URL
  HEALTH_CHECK_URL: "http://${networkInfo.primaryIp}:${CONFIG.backendPort}/api/health"
};

export default SERVER_CONFIG;
`;

    fs.writeFileSync(CONFIG.configFilePath, configContent);
    console.log(`✅ Sunucu yapılandırması oluşturuldu: ${CONFIG.configFilePath}`);
  } catch (error) {
    console.error('❌ Yapılandırma kaydedilemedi:', error.message);
  }
}

/**
 * QR kodu yazdırma
 * @param {string} url - QR kodunda gösterilecek URL
 */
function displayUrlQRCode(url) {
  console.log('\n\n📱 Mobil cihazınızdan backend sunucuya erişmek için:');
  console.log(`👉 Tarayıcıda şu adresi açın: ${url}`);
  console.log(`👉 veya aşağıdaki QR kodu tarayın:`);
  
  // QR kodunu konsolda göstermek için basit ASCII karakterleri
  console.log(`
  █████████████████████████████████
  █████████████████████████████████
  ████ ▄▄▄▄▄ █▀▄▀█ ▀▄▄ █ ▄▄▄▄▄ ████
  ████ █   █ █▄▀▄▀█ ▀▄ █ █   █ ████
  ████ █▄▄▄█ █ ▀▄▀█▀▄▄ █ █▄▄▄█ ████
  ████▄▄▄▄▄▄▄█ ▀▄▀ █▄▀▄█▄▄▄▄▄▄▄████
  ████ ▄ ▄█▄▀▄█▄ ▀▄▀ █▀█ ▀ ▀▄█▄████
  ████▄▀▄▀▄▄▄ ▄▀▄ ▄█▄▀▄█ ▄▀▄▀▄█████
  ████▄▀▄█▄█▄▀▀▄▀▀▄█ ▄ ▀█▄█▄▀▄▀████
  ████▄█▄▄▄█▄▀▄ █▄▀ ▀▄▄▀█▄  ▄▀█████
  ████ ▄▄▄▄▄ █ █▄ ▄▀  █ █ ▄▄▄ █████
  ████ █   █ █▀▄ ▄ ▀▄▀▄▀█ █▄█ █████
  ████ █▄▄▄█ █▀▄▀▄▀ ▄█▄▀█ ▀▄  █████
  ████▄▄▄▄▄▄▄█▄█▄▄█▄███▄█▄█▄█▄█████
  █████████████████████████████████
  █████████████████████████████████
  `);
  
  console.log(`\n📱 IP: ${url.split('//')[1].split(':')[0]}`);
  console.log(`🔌 Port: ${CONFIG.backendPort}`);
}

/**
 * IP adresinin geçerli olup olmadığını kontrol et
 */
function isValidIp(ip) {
  const ipPattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipPattern.test(ip);
}

/**
 * Firewall durumunu kontrol et
 */
function checkFirewall() {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      exec('netsh advfirewall show currentprofile', (error, stdout, stderr) => {
        if (error) {
          console.log('❌ Firewall durumu kontrol edilemedi');
          resolve(false);
          return;
        }
        
        if (stdout.includes('State                      ON')) {
          console.log('ℹ️ Windows Firewall aktif. Bağlantı sorunları yaşarsanız, Node.js ve backend port için izin vermeyi unutmayın.');
          resolve(true);
        } else {
          console.log('ℹ️ Windows Firewall kapalı görünüyor.');
          resolve(false);
        }
      });
    } else if (process.platform === 'darwin') {
      // macOS
      exec('defaults read /Library/Preferences/com.apple.alf globalstate', (error, stdout, stderr) => {
        if (error) {
          console.log('❌ Firewall durumu kontrol edilemedi');
          resolve(false);
          return;
        }
        
        if (stdout.trim() !== '0') {
          console.log('ℹ️ macOS Firewall aktif. Bağlantı sorunları yaşarsanız, Node.js ve backend port için izin vermeyi unutmayın.');
          resolve(true);
        } else {
          console.log('ℹ️ macOS Firewall kapalı görünüyor.');
          resolve(false);
        }
      });
    } else {
      // Linux veya diğer
      resolve(false);
    }
  });
}

/**
 * Ağ durumunu görüntüle ve bilgileri döndür
 */
async function displayNetworkStatus() {
  // Dizinleri oluştur (yoksa)
  const configDir = path.dirname(CONFIG.configFilePath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  console.log('\n🔍 Ağ durumu kontrol ediliyor...');
  
  // Tüm ağ arayüzlerini al
  const ipAddresses = getLocalIpAddresses();
  
  if (ipAddresses.length === 0) {
    console.log('❌ Hiçbir ağ bağlantısı bulunamadı!');
    console.log('  👉 Bilgisayarınızın WiFi veya Ethernet bağlantısının açık olduğundan emin olun.');
    return null;
  }
  
  console.log(`\n🖥️ Bu bilgisayarda ${ipAddresses.length} ağ bağlantısı bulundu:`);
  ipAddresses.forEach((info, index) => {
    console.log(`  ${index + 1}. ${info.address} (${info.interfaceName})`);
  });
  
  // Her IP için backend sunucusunun erişilebilirliğini kontrol et
  console.log('\n🔄 Backend sunucu erişilebilirliği kontrol ediliyor...');
  
  const results = await Promise.all(
    ipAddresses.map(async (info) => {
      const isReachable = await checkServerReachable(info.address, CONFIG.backendPort);
      return { ...info, isReachable };
    })
  );
  
  // Erişilebilir IP adresleri
  const reachableIps = results.filter(r => r.isReachable);
  
  if (reachableIps.length === 0) {
    console.log('\n❌ Hiçbir IP üzerinden backend sunucusuna erişilemiyor!');
    console.log('  👉 Backend sunucunun çalıştığından emin olun.');
    console.log('  👉 Sunucunun tüm ağ arayüzlerini dinlediğinden emin olun (0.0.0.0 olarak bağlanmalı).');
    
    // Firewall kontrolü
    await checkFirewall();
    
    // Yine de ilk IP'yi kullan
    return {
      ipAddresses,
      primaryIp: ipAddresses[0].address,
      reachableIps: [],
      firewallActive: await checkFirewall()
    };
  }
  
  // Birden fazla erişilebilir IP varsa, WiFi olanı tercih et
  let primaryIp = reachableIps[0].address;
  const wifiInterface = reachableIps.find(ip => 
    ip.interfaceName.toLowerCase().includes('wi-fi') || 
    ip.interfaceName.toLowerCase().includes('wireless')
  );
  
  if (wifiInterface) {
    primaryIp = wifiInterface.address;
  }
  
  console.log(`\n✅ Backend sunucuya erişilebilen IP adresleri:`);
  reachableIps.forEach((info, index) => {
    const isPrimary = info.address === primaryIp;
    console.log(`  ${index + 1}. ${info.address} (${info.interfaceName})${isPrimary ? ' ⭐ Ana IP' : ''}`);
  });
  
  // QR kodu göster
  displayUrlQRCode(`http://${primaryIp}:${CONFIG.backendPort}`);
  
  // Firewall kontrolü
  const firewallActive = await checkFirewall();
  
  return {
    ipAddresses,
    primaryIp,
    reachableIps: reachableIps.map(r => r.address),
    firewallActive
  };
}

/**
 * Ana fonksiyon
 */
async function main() {
  try {
    console.log('\n📡 BACKEND AĞ BAĞLANTI KONTROLÜ');
    console.log('================================');
    
    // Ağ durumunu kontrol et
    const networkInfo = await displayNetworkStatus();
    
    if (networkInfo) {
      // Yapılandırmayı kaydet
      saveNetworkConfig(networkInfo);
      
      console.log('\n📋 KONTROL LİSTESİ:');
      console.log('  1. Backend sunucunun çalıştığından emin olun');
      console.log(`  2. Backend sunucunun ${CONFIG.backendPort} portunu dinlediğini kontrol edin`);
      console.log('  3. Mobil cihazınızın bilgisayarınızla aynı WiFi ağında olduğunu kontrol edin');
      console.log('  4. Mobil uygulamadan Ayarlar ekranına giderek bağlantıyı test edin');
      
      if (networkInfo.firewallActive) {
        console.log('\n⚠️ Güvenlik Duvarı aktif! Bağlantı sorunları yaşarsanız:');
        console.log(`  1. Node.js uygulamasının ağ erişimine izin verin`);
        console.log(`  2. ${CONFIG.backendPort} portuna gelen bağlantılara izin verin`);
      }
      
      console.log('\n✅ İşlem tamamlandı. Mobil uygulamayı başlatabilirsiniz.');
    } else {
      console.log('\n❌ Ağ yapılandırması oluşturulamadı! Lütfen ağ bağlantınızı kontrol edin.');
    }
  } catch (error) {
    console.error('\n❌ Bir hata oluştu:', error.message);
  }
}

// Programı çalıştır
main(); 