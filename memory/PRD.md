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

### 2026-03-25 - Aylık Program Filtre Düzeltmeleri (iteration_7) ✅

**1. Ödeme Günü Kolonu (Ödeme Tarihi → Ödeme Günü)**
- Artık öğrenci profilinden (`payment_freq`) gelen bilgi
- Read-only görünüm (amber renkli badge: "Ayın X. günü")
- Editable date input kaldırıldı

**2. Ödeme Günü Filtresi (YENİ)**
- "Tüm Günler" varsayılan seçenek
- Dinamik seçenekler: Verideki benzersiz ödeme günleri (ör: "Ayın 1. günü", "Ayın 15. günü")
- Seçilen güne göre filtreleme

**3. Ödeme Durumu Filtresi (İyileştirildi)**
- "Tüm Durumlar" varsayılan
- "Boş (Girilmemiş)" seçeneği - durumu girilmemiş öğrencileri filtreler
- Dinamik seçenekler: Veride girilen tüm benzersiz durumlar

**4. Temizle Butonu**
- Aktif filtre sayısını gösteren badge ("X aktif")
- Tüm filtreleri sıfırlar

### 2026-03-25 - Branş ve Aylık Program İyileştirmeleri (iteration_6) ✅
- Branşlar: Sadece branşa atanmış aktif öğretmenler
- Aylık Program: Tamamen yeniden yapılandırıldı
- Öğretmen Portal: 5 dashboard kartı
- Öğretmen Bakiye: Ay filtresi

### 2026-03-24 - Test Bulguları Düzeltmeleri (iteration_5) ✅
- Öğrenci/Öğretmen Pasifleştirme
- Branş Silme
- Ödemeler Filtreleri
- Kamp Ödeme Mantığı (statüye bağlı)
- YouTube Pasifleştirme Kaldırma

---

## Veri Modeli

### Student.payment_freq
- **Eskiden:** "Ödeme sıklığı" olarak kullanılıyordu
- **Şimdi:** "Ödeme Günü" - Öğrencinin her ay ödeme yapacağı gün (1-31)
- Aylık Program'da bu değer "Ayın X. günü" formatında gösterilir
- Öğrenci ekleme/düzenleme formunda "Ödeme Günü" etiketi kullanılır

---

## API Endpoints

### Monthly Program
- `GET /api/monthly-program-detailed?month=YYYY-MM`
  - Response içerir: `payment_day` (student.payment_freq'den)
- `PUT /api/monthly-program-notes/{student_id}?month=X&note=X&payment_status=X`
  - Sadece `note` ve `payment_status` güncellenebilir
  - `payment_date` parametresi kaldırıldı

---

## Test Durumu
- iteration_5: Backend %100 (20/20)
- iteration_6: Backend %100 (17/17)
- iteration_7: Backend %100 (6/6), Frontend %100

Test raporları:
- `/app/test_reports/iteration_5.json`
- `/app/test_reports/iteration_6.json`
- `/app/test_reports/iteration_7.json`

---

## Bekleyen Görevler

### P1 - Yüksek Öncelik
- [ ] Performans optimizasyonları (N+1 query sorunu)
- [ ] Pagination eklenmesi

### P2 - Orta Öncelik
- [ ] WordPress entegrasyonu

### P3 - Düşük Öncelik
- [ ] Backend modüler yapı refactoring
- [ ] Hızlı ders girişi
- [ ] Kamplar için SMS hatırlatmaları

---

## Notlar
- **Ödeme Günü vs Ödeme Tarihi**: "Ödeme Günü" öğrencinin her ay aynı gün ödeme yapmasını belirtir (1-31). Editable değil, öğrenci profilinden gelir.
- **Ödeme Durumu**: Free-text alan, her ay için ayrı kaydedilir (monthly_program_notes koleksiyonu)
- YouTube kayıtları immutable
- Pasif öğretmenler login yapamaz
