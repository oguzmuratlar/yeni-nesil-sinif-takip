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

### 2026-03-23 - Session 2
- [x] **Öğrenci Düzenleme - Ders Yönetimi:**
  - Ders Ekle dialog'u (Branş, Öğretmen, Ders Tipi, Ücret)
  - Grup tipi seçildiğinde grup seçimi
  - Dersten Ayrıl butonu
  - Öğrencinin dahil olduğu gruplar görünümü
  
- [x] **Aylık Program Sayfası:**
  - Tüm öğretmenlerin planlı dersleri
  - Filtreleme (Ay, Öğretmen, Branş)
  - Öğretmene göre gruplu görünüm
  - Özet kartları (planlanan ders, öğrenci/öğretmen sayısı)
  
- [x] **Öğretmen Paneli - Grup Odaklı Yapı:**
  - Tümü / Birebir / Gruplar tabları
  - Öğrenci veya grup seçimi
  - Ders Girişi ve Ders Planlama butonları
  - Grup ders girişi sayfası (tüm öğrencilere yazar)
  - Grup planlama sayfası (tüm öğrencilere yazar)

- [x] **Backend API Geliştirmeleri:**
  - `/student-groups/{id}/add-student` - Gruba öğrenci ekle
  - `/student-groups/{id}/remove-student` - Gruptan öğrenci çıkar
  - `/student-groups/by-student/{id}` - Öğrencinin grupları
  - `/teacher-groups/{id}` - Öğretmenin grupları
  - `/all-planned-lessons` - Tüm planlı dersler (Aylık Program)
  - `/group-planned-lessons` - Grup planlaması

### 2026-03-23 - Session 1
- [x] Kritik derleme hatası düzeltildi
- [x] Öğretmen düzenleme formu (branş ve fiyatlandırma)
- [x] Geriye dönük olmayan ücret hesaplaması (teacher_rate)
- [x] Öğrenci sınıf normalizasyonu

### Önceki Sessionlar
- [x] Full-stack uygulama kurulumu
- [x] JWT tabanlı authentication
- [x] Öğrenci/Öğretmen CRUD + soft delete
- [x] Branş ve Grup yönetimi
- [x] Banka hesapları yönetimi
- [x] Ders ve ödeme kayıtları

---

## Bekleyen Görevler

### P1 - Yüksek Öncelik
- [ ] Öğretmen kullanıcıları doğru öğretmene bağlama (teacher1 → Ahmet Yılmaz)

### P2 - Orta Öncelik
- [ ] Aylık Program takvim görünümü iyileştirmesi
- [ ] Öğretmen kazanç detay raporu

### P3 - Düşük Öncelik
- [ ] Şube silme endpoint'i
- [ ] Grup silme/pasifleştirme
- [ ] Backend refactoring

---

## Test Durumu
- Backend: %100 (28/28 test geçti)
- Frontend: %100 (tüm özellikler çalışıyor)
- Son test: /app/test_reports/iteration_3.json
