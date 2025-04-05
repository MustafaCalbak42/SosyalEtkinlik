# Sosyal Etkinlik Platformu

Bu proje, ilgi alanlarına göre kullanıcıları eşleştiren ve sosyal etkinlikler düzenlemelerini sağlayan bir web ve mobil tabanlı sosyal platformdur.

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

### Frontend (Web)
- React.js
- React Router
- Axios
- React Hook Form
- Socket.io Client
- Leaflet (harita)

### Frontend (Mobil)
- React Native
- React Navigation
- Axios
- React Native Maps
- Socket.io Client

## Kurulum

### Gereksinimler
- Node.js
- npm veya yarn
- MongoDB veritabanı

### Backend Kurulumu
```bash
cd backend
npm install
npm run dev
```

### Web Frontend Kurulumu
```bash
cd frontend/web
npm install
npm start
```

### Mobil Frontend Kurulumu
```bash
cd frontend/mobile
npm install
npx react-native start
```

iOS için:
```bash
npx react-native run-ios
```

Android için:
```bash
npx react-native run-android
```

## Çalışma Ortamı Değişkenleri

Backend klasöründe `.env` dosyası oluşturun ve aşağıdaki değişkenleri ayarlayın:

```
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/sosyaletkinlik?retryWrites=true&w=majority
PORT=5000
JWT_SECRET=sosyaletkinlik_gizli_anahtar123
NODE_ENV=development
CLIENT_URL_WEB=http://localhost:3000
CLIENT_URL_MOBILE=exp://localhost:19000
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
│   ├── tests/                     # Test dosyaları
│   └── package.json               # Backend bağımlılıkları
│
├── frontend/                      # Frontend uygulamaları
│   ├── shared/                    # Paylaşılan kod (web ve mobil arasında)
│   │   ├── api/                   # API istekleri
│   │   ├── assets/                # Görseller, fontlar vb.
│   │   ├── constants/             # Sabitler
│   │   ├── hooks/                 # Paylaşılan custom hook'lar
│   │   ├── store/                 # State yönetimi 
│   │   ├── theme/                 # Tema/tasarım değişkenleri
│   │   └── utils/                 # Yardımcı fonksiyonlar
│   │
│   ├── web/                       # Web uygulaması (React)
│   │   ├── public/                # Statik dosyalar
│   │   ├── src/
│   │   │   ├── components/        # UI bileşenleri
│   │   │   ├── context/           # Context API
│   │   │   ├── layouts/           # Sayfa düzenleri
│   │   │   ├── pages/             # Sayfalar
│   │   │   ├── App.js             # Ana uygulama bileşeni
│   │   │   └── index.js           # Giriş noktası
│   │   └── package.json           # Web bağımlılıkları
│   │
│   └── mobile/                    # Mobil uygulama (React Native)
│       ├── android/               # Android özel dosyaları
│       ├── ios/                   # iOS özel dosyaları
│       ├── src/
│       │   ├── components/        # UI bileşenleri
│       │   ├── navigation/        # Ekran navigasyonu
│       │   ├── screens/           # Uygulama ekranları
│       │   ├── services/          # Mobil özel servisler
│       │   ├── App.js             # Ana uygulama bileşeni
│       │   └── index.js           # Giriş noktası
│       └── package.json           # Mobil bağımlılıkları
│
└── docs/                          # Proje dokümantasyonu
```

## Eş Zamanlı Çalışma Prensipleri

- Backend API, hem web hem mobil uygulamalara hizmet verecek şekilde tasarlanmıştır
- Socket.io ile gerçek zamanlı iletişim sağlanarak web ve mobil kullanıcıları arasında anlık etkileşim mümkündür
- Tüm platformlarda aynı JWT kimlik doğrulama sistemi kullanılmaktadır
- Paylaşılan kodlar (frontend/shared) ile kod tekrarı önlenmektedir

## Notlar

- Web ve mobil platformlar için ayrı CI/CD süreçleri kurulacaktır
- API'nin yeni versiyonları, eski sürümleriyle uyumlu çalışacak şekilde geliştirilecektir
- Mobil uygulama için gerekli olan bildirim sistemleri Firebase entegrasyonu ile sağlanacaktır

