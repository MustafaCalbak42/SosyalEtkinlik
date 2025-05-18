/**
 * Proje Başlatma Script'i
 * 
 * Bu script, projeyi başlatmadan önce ağ yapılandırmasını kontrol eder
 * ve gerekli ayarlamaları yapar.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Yapılandırma
const CONFIG = {
  backendPort: 5000,
  configFilePath: path.join(__dirname, '../src/shared/constants/ServerConfig.js'),
  checkNetworkScript: path.join(__dirname, 'checkNetworkConnection.js')
};

/**
 * Backend sunucunun çalışıp çalışmadığını kontrol et
 */
function checkBackendRunning() {
  try {
    console.log('🔍 Backend sunucunun çalıştığı kontrol ediliyor...');
    
    // Windows için netstat komutu
    if (os.platform() === 'win32') {
      const output = execSync('netstat -ano | findstr LISTENING | findstr :' + CONFIG.backendPort).toString();
      if (output.includes(`:${CONFIG.backendPort}`)) {
        console.log(`✅ Backend sunucu ${CONFIG.backendPort} portunda çalışıyor.`);
        return true;
      }
    } 
    // macOS ve Linux için
    else if (os.platform() === 'darwin' || os.platform() === 'linux') {
      const output = execSync(`lsof -i :${CONFIG.backendPort} | grep LISTEN`).toString();
      if (output) {
        console.log(`✅ Backend sunucu ${CONFIG.backendPort} portunda çalışıyor.`);
        return true;
      }
    }
    
    console.log(`❌ Backend sunucu ${CONFIG.backendPort} portunda çalışmıyor!`);
    return false;
  } catch (error) {
    console.log(`❌ Backend sunucu ${CONFIG.backendPort} portunda çalışmıyor!`);
    return false;
  }
}

/**
 * Proje klasörlerinin yapısını kontrol et ve gerekirse oluştur
 */
function checkProjectStructure() {
  const configDir = path.dirname(CONFIG.configFilePath);
  
  if (!fs.existsSync(configDir)) {
    console.log(`ℹ️ Dizin oluşturuluyor: ${configDir}`);
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  if (!fs.existsSync(CONFIG.configFilePath)) {
    console.log(`ℹ️ Sunucu yapılandırma dosyası henüz oluşturulmamış.`);
  }
}

/**
 * Ağ bağlantılarını kontrol et
 */
function runNetworkCheck() {
  try {
    console.log('📡 Ağ bağlantıları kontrol ediliyor...');
    execSync(`node ${CONFIG.checkNetworkScript}`, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error('❌ Ağ bağlantı kontrolü çalıştırılırken hata oluştu:', error.message);
    return false;
  }
}

/**
 * Expo başlat
 */
function startExpo() {
  try {
    console.log('🚀 Expo başlatılıyor...');
    execSync('expo start', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Expo başlatılırken hata oluştu:', error.message);
  }
}

/**
 * Ana fonksiyon
 */
function main() {
  console.log('\n🔄 PROJE BAŞLATMA İŞLEMİ');
  console.log('=========================');
  
  // Proje yapısını kontrol et
  checkProjectStructure();
  
  // Backend durumunu kontrol et
  const backendRunning = checkBackendRunning();
  
  if (!backendRunning) {
    console.log('\n⚠️ UYARI: Backend sunucu çalışmıyor görünüyor!');
    console.log('👉 Backend sunucuyu başlatmanız gerekebilir.');
    
    // Kullanıcıya devam etmek isteyip istemediğini sor
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('\n⚠️ Backend çalışmadan devam etmek istiyor musunuz? (e/h): ', (answer) => {
      readline.close();
      if (answer.toLowerCase() === 'e' || answer.toLowerCase() === 'evet') {
        proceedSetup();
      } else {
        console.log('❌ İşlem iptal edildi. Lütfen önce backend sunucuyu başlatın.');
        process.exit(1);
      }
    });
  } else {
    proceedSetup();
  }
}

/**
 * Kuruluma devam et
 */
function proceedSetup() {
  // Ağ kontrollerini çalıştır
  const networkCheckSuccess = runNetworkCheck();
  
  if (networkCheckSuccess) {
    // Expo başlat
    startExpo();
  } else {
    console.log('❌ Ağ kontrolleri başarısız olduğu için işlem sonlandırıldı.');
    process.exit(1);
  }
}

// Programı çalıştır
main(); 