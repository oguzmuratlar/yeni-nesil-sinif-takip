# Eğitim Yönetim Sistemi - PRD

## Proje Özeti
Özel ders merkezi için web tabanlı yönetim sistemi. Admin ve Öğretmen rolleri ile öğrenci, öğretmen, ders, kamp ve ödeme yönetimi.

## Teknoloji Stack
- **Backend:** FastAPI (Python)
- **Frontend:** React + Tailwind CSS + Shadcn UI
- **Database:** MongoDB
- **Auth:** JWT Token

## Kullanıcı Rolleri
1. **Admin:** Tam yetki - tüm CRUD işlemleri, raporlar
2. **Öğretmen:** Kendi öğrencileri, kampları, bakiyesi (read-only)

## Test Hesapları
- Admin: `admin` / `admin123`
- Öğretmen: `teacher1` / `teacher123`

---

## Tamamlanan Özellikler

### 2026-03-24 - Test Bulguları Düzeltmeleri (iteration_5) ✅
**Düzeltilen 8 Test Bulgusu:**

1. **Öğrenci Pasifleştirme** ✅
   - StudentCreate modeline `status` alanı eklendi
   - Öğrenci güncelleme endpoint'i None değerlerini filtreler
   - UI'da Pasifleştir/Aktifleştir butonları çalışıyor

2. **Öğretmen Pasifleştirme** ✅
   - TeacherCreate modeline `status` alanı eklendi
   - Login'de pasif öğretmen kontrolü eklendi (401 döner)
   - UI'da Pasifleştir/Aktifleştir butonları çalışıyor

3. **Branş Kaldırma** ✅
   - `DELETE /api/branches/{id}` endpoint'i eklendi
   - İlişkili veri kontrolü (kurslar, gruplar, fiyatlar)
   - UI'da her branş kartında silme butonu

4. **Ödemeler Filtresi** ✅
   - Ay filtresi: `?month=YYYY-MM`
   - Banka hesabı filtresi: `?bank_account_id=xxx`
   - UI'da dropdown'lar eklendi

5. **Aylık Program** ✅
   - Takvim görünümü kaldırıldı
   - Öğretmen adı sütunu eklendi
   - Sadece liste görünümü

6. **Kamp Ödeme Mantığı** ✅
   - Ödeme checkbox'ı kaldırıldı
   - Statüye bağlı otomatik ödeme:
     - `kesin_kayit` → `payment_completed=true` (ödeme yapılmış)
     - `on_kayit/yedek` → `payment_completed=false` (ödeme bekleniyor)
   - Backend'de otomatik set ediliyor

7. **YouTube Pasifleştirme** ✅
   - Pasife al butonu kaldırıldı
   - Sadece düzenle ve sil butonları
   - Kayıtlar immutable (değiştirilemez/pasiflenemez)

8. **Öğrenci Ders Güncelleme** ✅
   - Mevcut dersler listelenip düzenlenebiliyor
   - Ders ekleme/çıkarma çalışıyor

### 2026-03-24 - YouTube Modülü ✅
- Öğretmen YouTube kazanç kayıtları
- Admin: CRUD işlemleri
- Öğretmen: Salt okunur görünüm
- Bakiye entegrasyonu

### 2026-03-24 - Kamplar Modülü ✅
- Kamp yönetimi (ad, sınıf, öğretmen, ücret)
- Katılımcı yönetimi
- Statüye bağlı ödeme mantığı
- Öğretmen bakiye entegrasyonu

### Önceki Oturumlar
- Full-stack uygulama kurulumu
- JWT tabanlı authentication
- Öğrenci/Öğretmen CRUD + soft delete
- Branş ve Grup yönetimi
- Aylık Program sayfası
- Geriye dönük olmayan ücret hesaplaması

---

## API Endpoints

### Auth
- `POST /api/auth/login` - Giriş (pasif öğretmen kontrolü var)

### Students
- `GET/POST /api/students` - Liste/Oluştur
- `GET/PUT/DELETE /api/students/{id}` - Detay/Güncelle/Sil
- Status alanı ile pasifleştirme desteklenir

### Teachers
- `GET/POST /api/teachers` - Liste/Oluştur
- `GET/PUT/DELETE /api/teachers/{id}` - Detay/Güncelle/Sil
- Status alanı ile pasifleştirme (pasif öğretmen login yapamaz)

### Branches
- `GET /api/branches` - Liste
- `POST /api/branches?name=xxx` - Oluştur
- `DELETE /api/branches/{id}` - Sil (ilişkili veri kontrolü var)

### Payments
- `GET /api/payments?month=YYYY-MM&bank_account_id=xxx` - Filtreli liste
- `POST /api/payments` - Oluştur

### Camps
- `GET/POST /api/camps` - Liste/Oluştur
- `GET/PUT/DELETE /api/camps/{id}` - Detay/Güncelle/Sil
- `PUT /api/camps/{id}/complete` - Tamamla

### Camp Students
- `GET /api/camps/{id}/students` - Katılımcılar
- `POST /api/camps/{id}/students` - Katılımcı ekle (kesin_kayit → ödeme otomatik)
- `PUT /api/camp-students/{id}` - Güncelle (statü değişikliği ödemeyi etkiler)
- `DELETE /api/camp-students/{id}` - Sil

### YouTube
- `GET/POST /api/youtube-contents` - Liste/Oluştur
- `GET/PUT/DELETE /api/youtube-contents/{id}` - Detay/Güncelle/Sil (sadece hard delete)

### Teacher Balance
- `GET /api/teacher-balance/{id}` - Toplam bakiye (ders + kamp + YouTube)
- `GET /api/teacher-camp-earnings/{id}` - Kamp kazançları
- `GET /api/teacher-youtube-earnings/{id}` - YouTube kazançları

---

## Veritabanı Şeması

### students
```json
{
  "id": "uuid",
  "name": "string",
  "parent_name": "string",
  "phone": "string",
  "level": "string",
  "payment_freq": "string",
  "status": "active | inactive",
  "bank_account_id": "uuid (optional)",
  "notes": "string (optional)",
  "created_at": "datetime"
}
```

### teachers
```json
{
  "id": "uuid",
  "name": "string",
  "phone": "string",
  "status": "active | inactive",
  "season_id": "uuid (optional)",
  "created_at": "datetime"
}
```

### camps
```json
{
  "id": "uuid",
  "name": "string",
  "class_level": "string",
  "teacher_id": "uuid",
  "per_student_teacher_fee": "float",
  "status": "active | completed",
  "season_id": "uuid (optional)",
  "created_at": "datetime"
}
```

### camp_students
```json
{
  "id": "uuid",
  "camp_id": "uuid",
  "student_name": "string",
  "parent_name": "string",
  "phone": "string",
  "registration_status": "on_kayit | kesin_kayit | yedek",
  "payment_amount": "float",
  "payment_completed": "boolean (auto-set by registration_status)",
  "notes": "string (optional)",
  "created_at": "datetime"
}
```

### youtube_contents
```json
{
  "id": "uuid",
  "teacher_id": "uuid",
  "title": "string",
  "amount": "float",
  "date": "string (YYYY-MM-DD)",
  "status": "active (immutable)",
  "season_id": "uuid (optional)",
  "created_at": "datetime"
}
```

---

## Test Durumu
- Backend: %100 (20/20 test - iteration_5)
- Frontend: %100 (tüm UI özellikleri doğrulandı)
- Son test: `/app/test_reports/iteration_5.json`

---

## Bekleyen Görevler

### P1 - Yüksek Öncelik
- [ ] Performans optimizasyonları (N+1 query sorunu)
- [ ] Pagination eklenmesi (sınırsız sorgular)

### P2 - Orta Öncelik
- [ ] WordPress entegrasyonu
- [ ] Öğretmen kazanç detay raporu

### P3 - Düşük Öncelik
- [ ] Backend refactoring (server.py modüler yapıya)
- [ ] Hızlı ders girişi özelliği
- [ ] Kamplar için SMS hatırlatmaları

---

## Notlar
- Kamp kazancı: `kesin_kayit` statüsündeki katılımcılardan hesaplanır
- YouTube kayıtları immutable - sadece silinebilir, pasiflenemez
- Pasif öğretmenler sisteme giriş yapamaz
