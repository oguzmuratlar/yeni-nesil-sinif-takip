# Eğitim Yönetim Sistemi - PRD

## Proje Özeti
Özel ders merkezi için web tabanlı yönetim sistemi. Admin ve Öğretmen rolleri ile öğrenci, öğretmen, ders ve ödeme yönetimi.

## Teknoloji Stack
- **Backend:** FastAPI (Python)
- **Frontend:** React + Tailwind CSS + Shadcn UI
- **Database:** MongoDB
- **Auth:** JWT Token

## Kullanıcı Rolleri
1. **Admin:** Tam yetki - tüm CRUD işlemleri, raporlar
2. **Öğretmen:** Kendi öğrencileri, kendi bakiyesi, ders girişi

## Test Hesapları
- Admin: `admin` / `admin123`
- Öğretmen: `teacher1` / `teacher123`

---

## Tamamlanan Özellikler

### 2026-03-23 - Fork Session
- [x] Kritik derleme hatası düzeltildi (AdminTeacherForm.jsx JSX syntax)
- [x] Öğretmen düzenleme formu tam çalışır durumda
- [x] Branş ve Fiyatlandırma dialog'u (birebir + grup ücretleri)
- [x] **Geriye dönük olmayan ücret hesaplaması:**
  - Lesson model'e `teacher_rate` alanı eklendi
  - Ders oluşturulurken o anki öğretmen ücreti kaydediliyor
  - Bakiye hesaplamasında önce lesson.teacher_rate kullanılıyor
- [x] Öğrenci sınıf (level) normalizasyonu düzeltildi
- [x] Backend %100, Frontend %95+ test başarısı

### Önceki Session
- [x] Full-stack uygulama kurulumu
- [x] JWT tabanlı authentication
- [x] Öğrenci CRUD + soft delete (pasifleştirme)
- [x] Öğretmen CRUD + soft delete
- [x] Branş yönetimi
- [x] Grup yönetimi
- [x] Banka hesapları yönetimi
- [x] Ders girişi formları
- [x] Ödeme kayıtları
- [x] "Ödeme Günü" etiket değişikliği
- [x] Sınıf dropdown seçici (5, 6, 7, 8)

---

## Bekleyen Görevler

### P1 - Yüksek Öncelik
- [ ] Öğrenci-Grup ilişkilendirmesi görünürlüğü
- [ ] Grup dersi mantığı (gruba ders girildiğinde tüm öğrencilere kaydedilmesi)

### P2 - Orta Öncelik
- [ ] Aylık Program sayfasının tam implementasyonu
- [ ] Öğretmen kazanç detay raporu

### P3 - Düşük Öncelik
- [ ] Şube silme endpoint'i
- [ ] Grup silme/pasifleştirme
- [ ] Backend refactoring (server.py modüler yapıya)

---

## API Endpoints

### Auth
- `POST /api/auth/login` - Giriş
- `POST /api/auth/register` - Kayıt (admin only)

### Students
- `GET /api/students` - Liste
- `GET /api/students/{id}` - Detay
- `POST /api/students` - Ekle
- `PUT /api/students/{id}` - Güncelle
- `PUT /api/students/{id}/status` - Pasifleştir

### Teachers
- `GET /api/teachers` - Liste
- `GET /api/teachers/{id}` - Detay
- `POST /api/teachers` - Ekle
- `PUT /api/teachers/{id}` - Güncelle
- `GET /api/teacher-balance/{id}` - Bakiye

### Lessons
- `GET /api/lessons` - Liste
- `POST /api/lessons` - Ekle (teacher_rate ile)
- `POST /api/group-lessons` - Grup dersi ekle

### Payments
- `GET /api/payments` - Liste
- `POST /api/payments` - Ekle

---

## Önemli Notlar

### Teacher Rate (Geriye Dönük Olmama)
Ders oluşturulduğunda öğretmenin o anki ücreti `teacher_rate` alanına kaydedilir. Bakiye hesaplamasında bu değer kullanılır. Eski dersler için (teacher_rate yoksa) güncel fiyata fallback yapılır.

### Level Normalization
Öğrenci sınıf değerleri veritabanında farklı formatlarda olabilir ("5. Sınıf", "6. snıf"). Frontend bu değerleri normalize ederek ("5", "6") Select component ile uyumlu hale getirir.
