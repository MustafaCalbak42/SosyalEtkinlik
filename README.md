# Sosyal Etkinlik Platformu

Bu proje, ortak ilgi alanları olan insanları bir araya getiren sosyal etkinlik platformudur.

## Yeni Özellik: E-posta Doğrulama ve Şifre Sıfırlama

Uygulama artık SMTP ile gerçek e-posta doğrulama sistemi kullanmaktadır:

- Kullanıcılar kaydolurken e-posta adreslerine doğrulama kodu gönderilir
- E-posta doğrulandıktan sonra kullanıcı bilgileri MongoDB veritabanına kaydedilir
- Şifre sıfırlama işlemi de e-posta üzerinden gönderilen kodla yapılır

## Özellikler

- Kullanıcı profil yönetimi
- Etkinlik oluşturma ve düzenleme
- Etkinlik katılımcı yönetimi
- Hobiler ve ilgi alanlarına göre eşleştirme
- Gerçek zamanlı mesajlaşma
- Konum bazlı etkinlik keşfi

## Teknoloji Stack

### Backend
- Node.js
- Express.js
- MongoDB (veritabanı)
- JWT (kimlik doğrulama)
- Socket.io (gerçek zamanlı mesajlaşma)

### Web (Frontend)
- React.js
- React Router
- Axios
- React Hook Form
- Socket.io Client
- Leaflet (harita)
- Material UI

### Mobil (Frontend)
- React Native
- React Navigation
- Axios
- React Native Maps
- Socket.io Client

## Kurulum

Projeyi çalıştırmak için aşağıdaki adımları izleyin:

### 1. Gereksinimleri Yükleme

```
cd backend
npm install
```

### 2. Çevre Değişkenleri Ayarlama

backend dizininde `.env` dosyası oluşturun:

```
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb+srv://kullanici:sifre@cluster.mongodb.net/veritabani?retryWrites=true&w=majority

# JWT Secret
JWT_SECRET=your-jwt-secret
JWT_EXPIRE=30d
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRE=7d

# Email Configuration for Gmail
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-here

# Client URLs
CLIENT_URL_WEB=http://localhost:3000
CLIENT_URL_MOBILE=exp://localhost:19000
```

### 3. Gmail Hesabı Ayarlama

1. Gmail hesabınızda "Uygulama Şifreleri" oluşturun:
   - Google Hesabınıza gidin
   - Güvenlik > 2 Adımlı Doğrulama > Uygulama Şifreleri
   - "Uygulama Seçin" > Diğer (Özel ad) > "Sosyal Etkinlik" yazın
   - Oluştur düğmesine tıklayın ve verilen 16 haneli şifreyi kopyalayın
   - Bu şifreyi .env dosyasındaki EMAIL_PASSWORD alanına yapıştırın

### 4. Uygulamayı Çalıştırma

```
npm run dev
```

## API Kullanımı

### Kullanıcı Kaydı

```
POST /api/users/register
```

Gövde:
```json
{
  "username": "kullanici123",
  "email": "ornek@gmail.com",
  "password": "sifre123",
  "fullName": "Ad Soyad"
}
```

### E-posta Doğrulama

```
POST /api/users/verify-email
```

Gövde:
```json
{
  "email": "ornek@gmail.com",
  "code": "123456"
}
```

### Giriş İşlemi

```
POST /api/users/login
```

Gövde:
```json
{
  "email": "ornek@gmail.com",
  "password": "sifre123"
}
```

### Şifre Sıfırlama

1. Şifre sıfırlama kodu isteme:
```
POST /api/users/forgot-password
```

Gövde:
```json
{
  "email": "ornek@gmail.com"
}
```

2. Şifre sıfırlama kodu doğrulama:
```
POST /api/users/verify-reset-code
```

Gövde:
```json
{
  "email": "ornek@gmail.com",
  "code": "123456"
}
```

3. Şifre sıfırlama işlemini tamamlama:
```
POST /api/users/reset-password
```

Gövde:
```json
{
  "email": "ornek@gmail.com",
  "code": "123456",
  "password": "yeni-sifre123"
}
```

## Proje Yapısı

```
/
├── backend/                       # Backend API
│   ├── src/
│   │   ├── config/                # Konfigürasyon dosyaları
│   │   ├── controllers/           # Controller'lar
│   │   ├── middleware/            # Middleware'ler
│   │   ├── models/                # Veritabanı modelleri
│   │   ├── routes/                # API rotaları
│   │   ├── services/              # İş mantığı servisleri
│   │   ├── socket/                # Socket.io yönetimi
│   │   ├── utils/                 # Yardımcı fonksiyonlar
│   │   ├── validators/            # Giriş doğrulama
│   │   └── server.js              # Ana sunucu dosyası
│   ├── uploads/                   # Kullanıcı yüklemeleri
│   ├── public/                    # Statik dosyalar
│   ├── tests/                     # Test dosyaları
│   └── package.json               # Backend bağımlılıkları
│
├── web/                           # Web uygulaması (React)
│   ├── public/                    # Statik dosyalar
│   ├── src/
│   │   ├── api/                   # API istekleri
│   │   ├── assets/                # Görseller, fontlar vb.
│   │   ├── components/            # UI bileşenleri
│   │   ├── context/               # Context API
│   │   ├── layouts/               # Sayfa düzenleri
│   │   ├── pages/                 # Sayfalar
│   │   ├── services/              # Servisler
│   │   ├── store/                 # State yönetimi
│   │   ├── theme/                 # Tema/tasarım değişkenleri
│   │   ├── utils/                 # Yardımcı fonksiyonlar
│   │   ├── App.js                 # Ana uygulama bileşeni
│   │   └── index.js               # Giriş noktası
│   └── package.json               # Web bağımlılıkları
│
├── mobile/                        # Mobil uygulama (React Native)
│   ├── android/                   # Android özel dosyaları
│   ├── ios/                       # iOS özel dosyaları
│   ├── src/
│   │   ├── api/                   # API istekleri
│   │   ├── assets/                # Görseller, fontlar vb.
│   │   ├── components/            # UI bileşenleri
│   │   ├── navigation/            # Ekran navigasyonu
│   │   ├── screens/               # Uygulama ekranları
│   │   ├── services/              # Mobil özel servisler 
│   │   ├── store/                 # State yönetimi
│   │   ├── theme/                 # Tema/tasarım değişkenleri
│   │   ├── utils/                 # Yardımcı fonksiyonlar
│   │   ├── App.js                 # Ana uygulama bileşeni
│   │   └── index.js               # Giriş noktası
│   └── package.json               # Mobil bağımlılıkları
│
└── docs/                          # Proje dokümantasyonu
```

## Eş Zamanlı Çalışma Prensipleri

- Backend API, hem web hem mobil uygulamalara hizmet verecek şekilde tasarlanmıştır
- Socket.io ile gerçek zamanlı iletişim sağlanarak web ve mobil kullanıcıları arasında anlık etkileşim mümkündür
- Tüm platformlarda aynı JWT kimlik doğrulama sistemi kullanılmaktadır
- Web ve mobil uygulamalar aynı API'yi kullanarak aynı veritabanı üzerinde işlem yapar

## Notlar

- Web ve mobil platformlar için ayrı CI/CD süreçleri kurulacaktır
- API'nin yeni versiyonları, eski sürümleriyle uyumlu çalışacak şekilde geliştirilecektir
- Mobil uygulama için gerekli olan bildirim sistemleri Firebase entegrasyonu ile sağlanacaktır

