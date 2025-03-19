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

### Frontend (Mobil) - Planlanan
- React Native veya Flutter

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

### Frontend Kurulumu
```bash
cd frontend
npm install
npm start
```

## Çalışma Ortamı Değişkenleri

Backend klasöründe `.env` dosyası oluşturun ve aşağıdaki değişkenleri ayarlayın:

```
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/sosyaletkinlik?retryWrites=true&w=majority
PORT=5000
JWT_SECRET=sosyaletkinlik_gizli_anahtar123
NODE_ENV=development
```

## Proje Yapısı

```
/
├── backend/                # Backend API
│   ├── src/
│   │   ├── config/         # Konfigürasyon dosyaları
│   │   ├── controllers/    # Controller'lar
│   │   ├── middleware/     # Middleware'ler
│   │   ├── models/         # Veritabanı modelleri
│   │   ├── routes/         # API rotaları
│   │   ├── utils/          # Yardımcı fonksiyonlar
│   │   └── server.js       # Ana sunucu dosyası
│   └── package.json        # Backend bağımlılıkları
│
└── frontend/              # React frontend
    ├── public/            # Statik dosyalar
    └── src/
        ├── components/    # Yeniden kullanılabilir bileşenler
        ├── context/       # Context API
        ├── hooks/         # Custom hook'lar
        ├── pages/         # Sayfalar
        └── utils/         # Yardımcı fonksiyonlar
```

