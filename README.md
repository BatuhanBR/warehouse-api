# Warehouse Management System API

Bu proje, depo yönetim sistemi için geliştirilmiş bir REST API'dir.

## Özellikler

- Kullanıcı yönetimi (kayıt, giriş, rol bazlı yetkilendirme)
- Ürün yönetimi (CRUD işlemleri)
- Stok takibi
- Kategori yönetimi
- Stok hareketleri takibi
- Düşük stok uyarıları
- Dashboard istatistikleri

## Teknolojiler

- Node.js
- Express.js
- PostgreSQL
- Sequelize ORM
- JWT Authentication

## Kurulum

1. Repoyu klonlayın
2. Bağımlılıkları yükleyin: `npm install`
3. PostgreSQL veritabanını kurun
4. `.env` dosyasını oluşturun
5. `npm start` ile uygulamayı başlatın

## API Endpoints

### Auth
- POST /api/auth/register - Yeni kullanıcı kaydı
- POST /api/auth/login - Kullanıcı girişi

### Products
- GET /api/products - Tüm ürünleri listele
- POST /api/products - Yeni ürün ekle
- GET /api/products/:id - Ürün detayı
- PUT /api/products/:id - Ürün güncelle
- DELETE /api/products/:id - Ürün sil

### Stock
- GET /api/stock - Stok hareketlerini listele
- POST /api/stock/add - Stok girişi
- POST /api/stock/remove - Stok çıkışı

### Categories
- GET /api/categories - Kategorileri listele
- POST /api/categories - Yeni kategori ekle

### Dashboard
- GET /api/dashboard/stats - Dashboard istatistikleri
