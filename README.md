# 🧾 Fatura Yönetim Sistemi

Bu proje, ASP.NET Core Web API, Angular, PostgreSQL ve Docker kullanılarak geliştirilmiş microservice tabanlı bir fatura yönetim uygulamasıdır.

Uygulama; kullanıcı girişi, müşteri yönetimi, fatura oluşturma/güncelleme/silme/listeleme, fatura satırları, müşteri ve tarih bazlı filtreleme, fatura önizleme ve PDF çıktısı alma özelliklerini içerir.

Projede özellikle backend mimarisi, veritabanı ayrımı, JWT authentication, refresh token yönetimi ve servislerin birbirinden bağımsız çalışması ön planda tutulmuştur.
lı filtreleme, fatura önizleme ve PDF indirme özellikleri bulunmaktadır.

---

## 💻 Kullanılan Teknolojiler

- ASP.NET Core Web API (.NET 8)
- Angular
- PostgreSQL
- Entity Framework Core
- Docker & Docker Compose
- API Gateway
- JWT Authentication
- Refresh Token Rotation
- BCrypt Password Hashing
- Bootstrap
- Nginx
- jsPDF / html2canvas

---

## 🌳 Proje Yapısı

```txt
InvoiceManagementProject/
├── docker/
│   └── init-db.sh
├── src/
│   ├── backend/
│   │   ├── auth-service
│   │   ├── customer-service
│   │   ├── invoice-service
│   │   └── api-gateway
│   └── frontend-angular
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## Genel Akış
Frontend, backend servislerine doğrudan gitmez. Angular uygulaması /api ile başlayan istekleri Nginx üzerinden API Gateway’e yönlendirir.

Browser
  |
  v
Angular Frontend / Nginx
  |
  v
/api proxy
  |
  v
API Gateway
  |
  ├── AuthService
  ├── CustomerService
  └── InvoiceService

---

## 🔗 Microservice Mimarisi

| Servis           | Sorumluluk                                         | Veritabanı  | Kullanıcı     |
| ---------------- | -------------------------------------------------- | ----------- | ------------- |
| AuthService      | Kullanıcı kayıt, login, JWT token, refresh token   | auth_db     | auth_user     |
| CustomerService  | Müşteri CRUD işlemleri                             | customer_db | customer_user |
| InvoiceService   | Fatura ve fatura satırı işlemleri                  | invoice_db  | invoice_user  |
| ApiGateway       | Frontend isteklerini ilgili servislere yönlendirir | -           | -             |
| Frontend Angular | Kullanıcı arayüzü                                  | -           | -             |

Her servis kendi veritabanına sahiptir. Servisler birbirinin veritabanına doğrudan erişemez. Bu sayede servislerin veritabanı sahipliği daha net hale getirilmiştir.

---

## 📸 Screenshots
<img width="1439" height="807" alt="Ekran Resmi 2026-05-23 21 42 04" src="https://github.com/user-attachments/assets/e9de5ef0-cff4-4708-8a9b-249f1f7ce7c2" />
<img width="1440" height="802" alt="Ekran Resmi 2026-05-23 21 43 01" src="https://github.com/user-attachments/assets/ae5b53be-db61-4b71-a751-7a162839277e" />
<img width="1440" height="811" alt="Ekran Resmi 2026-05-23 21 43 48" src="https://github.com/user-attachments/assets/a300d1a7-b12f-4387-8aa8-4d0b5538f86e" />
<img width="1440" height="813" alt="Ekran Resmi 2026-05-23 21 43 36" src="https://github.com/user-attachments/assets/dff57b59-d64e-40ed-8fca-d21f5a75e378" />

---

## 🔐 Güvenlik Yaklaşımı
- Projede authentication ve authorization için JWT kullanılmıştır.
- Uygulanan güvenlik önlemleri:
  - Şifreler düz metin olarak tutulmaz.
  - Kullanıcı şifreleri BCrypt ile hashlenir.
  - Access token kısa ömürlüdür.
  - Refresh token rotation uygulanmıştır.
  - Refresh token veritabanında düz metin olarak değil, hashlenmiş şekilde tutulur.
  - UserId request body’den alınmaz.
  - UserId JWT claim içerisinden okunur.
  - Kullanıcı sadece kendi müşteri ve faturalarına erişebilir.
  - Backend tarafında validation kuralları uygulanır.

---

## Backend Endpointleri

### AuthService
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/revoke

### CustomerService
GET    /api/customers
GET    /api/customers/{id}
POST   /api/customers
PUT    /api/customers/{id}
DELETE /api/customers/{id}

### InvoiceService
POST   /api/invoices/save
PUT    /api/invoices/update/{id}
DELETE /api/invoices/delete/{id}
GET    /api/invoices/list
GET    /api/invoices/{id}

- Invoice list endpointi şu query parametrelerini destekler:
  startDate
  endDate
  customerId
  allDates

---
## Erişim Adresleri

Docker Compose çalıştıktan sonra uygulamaya şu adresten erişilir:

| Bileşen | Adres |
|---|---|
| Angular Frontend | http://localhost:4200 |
| pgAdmin | http://localhost:5050 |
| AuthService Swagger | http://localhost:5001/swagger |
| CustomerService Swagger | http://localhost:5002/swagger |
| InvoiceService Swagger | http://localhost:5003/swagger |

ApiGateway dışarıya sabit bir portla açılmaz. Docker tarafından otomatik port atanır.


---

## pgAdmin Bilgileri
- pgAdmin arayüzü:
```
http://localhost:5050
```
- Giriş bilgileri:
```
Email: admin@invoice.com
Password: admin_pass_123
```
- pgAdmin içerisinde PostgreSQL server eklemek için:
```
Name: Invoice Local Postgres
Host: postgres
Port: 5432
Maintenance database: invoice_root
Username: postgres_admin
Password: postgres_admin_pass_123
```

---

## 👩🏼‍💻 Proje Çalıştırma
## Gereksinimler
Bilgisayarda Docker Desktop kurulu ve çalışır durumda olmalıdır.
Ekstra olarak lokal PostgreSQL, Node.js veya .NET SDK kurulu olması gerekmez. Proje Docker üzerinden çalışacak şekilde hazırlanmıştır.

## Repository'i İndirme
```
git clone https://github.com/helinguler/FaturaYonetimSistemi.git
cd InvoiceManagementProject
```

## Projeyi Başlatma
1. Projeyi çalıştırmak için Docker Desktop açık olmalıdır.
2. Repository indirildikten sonra proje ana klasöründe aşağıdaki komut çalıştırılır:
```
docker compose up --build
```
Bu işlem birkaç dakika sürebilir.
3. - Docker ayağa kalktıktan sonra uygulamaya şu adresten girilir:
```
Frontend: http://localhost:4200
```

## ApiGateway’e Doğrudan Erişim
Normal kullanımda ApiGateway’e doğrudan erişmek gerekmez. Frontend üzerinden çalışmak yeterlidir. Ancak test veya debug amacıyla ApiGateway portu görüntülenebilir.
ApiGateway Docker tarafından dinamik host port ile açılır.

- ApiGateway’in hangi porttan erişilebilir olduğunu görmek için:
```
docker compose port api-gateway 8080
```

---

## 👩🏻‍💻 Geliştirici

**Helin Güler**  
- [LinkedIn Profilim](https://www.linkedin.com/in/helin-guler)  
- [GitHub Profilim](https://github.com/helinguler)
- [Portfolio](https://helinguler.github.io)
