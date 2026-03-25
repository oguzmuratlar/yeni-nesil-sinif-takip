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

### 2026-03-25 - İyileştirmeler (iteration_6) ✅

**1. Branşlar Ekranı - Öğretmen Listeleme Düzeltmesi**
- Yeni endpoint: `GET /api/branches/{id}/teachers`
- Sadece o branşa atanmış (teacher_prices tablosundan) aktif öğretmenler listelenir
- Pasif öğretmenler sayıya dahil edilmez
- Frontend güncellemesi: Her branş için ayrı API çağrısı

**2. Aylık Program Ekranı - Tam Yeniden Yapılandırma**
- Yeni endpoint: `GET /api/monthly-program-detailed?month=YYYY-MM`
- Backend aggregation - frontend sadece render eder
- Kolonlar (sırasıyla):
  - Not (editable, inline kayıt)
  - Ödeme Durumu (editable)
  - Hesap Adı (student.payment_account_name)
  - Dersler (virgülle ayrılmış branşlar)
  - Öğrenci Adı
  - Veli Adı
  - Ödeme Tarihi (editable, date picker)
  - Toplam (otomatik hesaplanan)
- Dinamik Branş Kolonları: Her branş için Tarih/Birim/Toplam
- Dinamik Öğretmen Kolonları: Her öğretmen için aylık kazanç
- Filtreler: Ay, Öğrenci, Öğretmen, Branş, Ödeme Durumu
- Alt toplam: Öğretmen aylık kazanç toplamları
- Notlar endpoint: `PUT /api/monthly-program-notes/{student_id}?month=X&note=X&payment_status=X&payment_date=X`

**3. Öğretmen Portalı - Dashboard Kartları**
- 5 adet kart:
  - Öğrencilerim (teal)
  - Bakiye Takip (amber)
  - Ders Programı (blue)
  - Kamplarım (emerald)
  - YouTube Kazançları (red)
- Her kart tıklanabilir, ilgili sayfaya yönlendirir

**4. Öğretmen Bakiye - Ay Filtresi**
- Endpoint güncellendi: `GET /api/teacher-balance/{id}?month=YYYY-MM`
- Ay bazlı filtreleme:
  - Ders kazançları filtrelenir
  - YouTube kazançları filtrelenir
  - Kamp kazançları ay bazlı değil, ay filtresi varken hariç tutulur
- UI'da dropdown ile ay seçimi

### 2026-03-24 - Test Bulguları Düzeltmeleri (iteration_5) ✅
1. Öğrenci Pasifleştirme ✅
2. Öğretmen Pasifleştirme ✅
3. Pasif Öğretmen Login Engeli ✅
4. Branş Silme ✅
5. Ödemeler Filtreleri ✅
6. Kamp Ödeme Mantığı (statüye bağlı) ✅
7. YouTube Pasifleştirme Kaldırma ✅

### Önceki Özellikler
- Full-stack uygulama kurulumu
- JWT tabanlı authentication
- Öğrenci/Öğretmen CRUD + soft delete
- Branş ve Grup yönetimi
- Kamplar modülü
- YouTube modülü
- Bakiye hesaplama (ders + kamp + YouTube)

---

## API Endpoints

### Auth
- `POST /api/auth/login` - Giriş

### Students
- `GET/POST /api/students` - Liste/Oluştur
- `GET/PUT/DELETE /api/students/{id}` - Detay/Güncelle/Sil
- `payment_account_name` alanı eklendi

### Teachers
- `GET/POST /api/teachers` - Liste/Oluştur
- `GET/PUT/DELETE /api/teachers/{id}` - Detay/Güncelle/Sil

### Branches
- `GET /api/branches` - Liste
- `GET /api/branches/{id}/teachers` - Branşa atanmış aktif öğretmenler
- `POST /api/branches?name=xxx` - Oluştur
- `DELETE /api/branches/{id}` - Sil

### Payments
- `GET /api/payments?month=YYYY-MM&bank_account_id=xxx` - Filtreli liste
- `POST /api/payments` - Oluştur

### Monthly Program
- `GET /api/monthly-program-detailed?month=YYYY-MM` - Detaylı aylık program verisi
- `PUT /api/monthly-program-notes/{student_id}?month=X&note=X&payment_status=X&payment_date=X` - Not güncelle

### Teacher Balance
- `GET /api/teacher-balance/{id}?month=YYYY-MM` - Ay bazlı filtrelenebilir bakiye

### Camps & YouTube
- CRUD endpointleri mevcut

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
  "payment_account_name": "string (optional)",
  "notes": "string (optional)",
  "created_at": "datetime"
}
```

### monthly_program_notes (YENİ)
```json
{
  "id": "uuid",
  "student_id": "uuid",
  "month": "YYYY-MM",
  "note": "string (optional)",
  "payment_status": "string (optional)",
  "payment_date": "string (optional)",
  "created_at": "datetime"
}
```

---

## Test Durumu
- Backend: %100 (iteration_6: 17/17 test)
- Frontend: %100 (tüm UI özellikleri doğrulandı)
- Test raporları:
  - `/app/test_reports/iteration_5.json`
  - `/app/test_reports/iteration_6.json`

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
- Branş öğretmen listesi: teacher_prices tablosundan, sadece aktif olanlar
- Aylık program: Backend aggregation zorunlu, frontend hesaplama yapmaz
- Teacher balance ay filtresi: Kamp kazançları aya bağlı değil, filtre aktifken hariç tutulur
- YouTube kayıtları immutable - sadece silinebilir, pasiflenemez
- Pasif öğretmenler sisteme giriş yapamaz
