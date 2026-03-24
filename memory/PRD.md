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

### 2026-03-24 - Kamplar Modülü ✅
**Admin Tarafı:**
- [x] Kamplar listesi (ad, sınıf, öğretmen, öğrenci başı ücret, istatistikler)
- [x] Yeni kamp oluşturma
- [x] Kamp düzenleme
- [x] Kampı tamamlandı olarak işaretleme
- [x] Kamp silme (katılımcısı olmayan)
- [x] Kamp katılımcısı ekleme (öğrenci adı, veli adı, telefon, kayıt durumu, ödeme tutarı, ödeme yapıldı)
- [x] Katılımcı güncelleme/silme
- [x] Ödeme durumu toggle (tek tıkla değiştirme)
- [x] Tamamlanan kampları filtre ile gösterme

**Öğretmen Tarafı:**
- [x] Kamplarım sayfası (sadece kendi kampları)
- [x] Kamp detayında katılımcı listesi (read-only)
- [x] Düzenleme/silme yetkisi yok

**Bakiye Entegrasyonu:**
- [x] Öğretmen kazancı = Ders Kazancı + Kamp Kazancı
- [x] Kamp kazancı = Ödeme yapan katılımcı × Öğrenci başı ücret
- [x] Bakiye ekranında kamp kazanç detayları

### Önceki Oturumlar
- [x] Full-stack uygulama kurulumu
- [x] JWT tabanlı authentication
- [x] Öğrenci/Öğretmen CRUD + soft delete
- [x] Branş ve Grup yönetimi
- [x] Öğrenci düzenleme ekranında ders ekleme/çıkarma
- [x] Grup seçimi (ders tipi "Grup" seçildiğinde)
- [x] Aylık Program sayfası
- [x] Öğretmen paneli grup odaklı yapı
- [x] Geriye dönük olmayan ücret hesaplaması

---

## API Endpoints - Kamplar

### Camp CRUD
- `GET /api/camps` - Kamp listesi (include_completed parametresi)
- `GET /api/camps/{id}` - Tek kamp
- `POST /api/camps` - Yeni kamp (admin only)
- `PUT /api/camps/{id}` - Kamp güncelle (admin only)
- `PUT /api/camps/{id}/complete` - Tamamla (admin only)
- `DELETE /api/camps/{id}` - Sil (admin only, katılımcısız)

### Camp Students
- `GET /api/camps/{id}/students` - Katılımcılar
- `POST /api/camps/{id}/students` - Katılımcı ekle (admin only)
- `PUT /api/camp-students/{id}` - Güncelle (admin only)
- `DELETE /api/camp-students/{id}` - Sil (admin only)

### Teacher Earnings
- `GET /api/teacher-camp-earnings/{id}` - Kamp kazançları
- `GET /api/teacher-balance/{id}` - Toplam bakiye (ders + kamp)

---

## Veritabanı Şeması - Yeni

### camps
```
{
  id: string,
  name: string,           // Kamp adı
  class_level: string,    // Sınıf seviyesi
  teacher_id: string,     // Öğretmen
  per_student_teacher_fee: float,  // Öğrenci başı ücret
  status: "active" | "completed",
  season_id: string (optional),
  created_at: datetime
}
```

### camp_students
```
{
  id: string,
  camp_id: string,
  student_name: string,
  parent_name: string,
  phone: string,
  registration_status: "on_kayit" | "kesin_kayit" | "yedek",
  payment_amount: float,
  payment_completed: boolean,
  notes: string (optional),
  created_at: datetime
}
```

---

## Test Durumu
- Backend: %100 (26/26 test)
- Frontend: %100
- Son test: /app/test_reports/iteration_4.json

---

## Bekleyen Görevler

### P2 - Orta Öncelik
- [ ] Aylık Program takvim görünümü iyileştirmesi
- [ ] Öğretmen kazanç detay raporu

### P3 - Düşük Öncelik
- [ ] Şube silme endpoint'i
- [ ] Grup silme/pasifleştirme
- [ ] Backend refactoring (server.py modüler yapıya)

---

## Notlar
- Kamp kazancı sadece `payment_completed=true` olan katılımcılardan hesaplanır
- Aynı katılımcı için çift kazanç yazılmaz (id bazlı takip)
- Kamp tamamlandıktan sonra kazanç etkisi korunur
