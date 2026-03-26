# Eğitim Yönetim Sistemi - PRD

## Proje Özeti
Özel ders merkezi yönetim sistemi. Admin ve Teacher rolleri ile öğrenci, öğretmen, ders, ödeme, kamp ve YouTube içerik yönetimi.

## Versiyon: 3.0 (Branş Bazlı Kasa ve Finans Modülü)

---

## Tamamlanan Özellikler

### 1. Temel Modüller ✅
- JWT tabanlı authentication (Admin/Teacher)
- Öğrenci CRUD (soft delete)
- Öğretmen CRUD (kullanıcı bilgileri düzenleme dahil)
- Branş yönetimi
- Ders tipleri (Birebir/Grup)
- Planlı dersler
- Gruplar ve grup dersleri

### 2. Kamp Modülü ✅
- Kamp oluşturma/düzenleme
- Öğrenci kayıt durumu (ön kayıt/kesin kayıt)
- Öğretmen kamp kazancı hesaplama

### 3. YouTube Modülü ✅
- YouTube içerik kaydı
- Öğretmen YouTube kazancı

### 4. Aylık Program ✅
- Detaylı aylık program aggregation endpoint
- Ödeme durumu takibi
- Filtreleme (ay, ödeme günü, ödeme durumu)

### 5. Branş Bazlı Kasa Sistemi ✅ (YENİ - v3.0)

#### 5.1 Kasa Yönetimi
- **Her branş için ayrı kasa**: Matematik, Fen, Türkçe
- **Kasa bakiyesi hesaplama**: Giriş - Çıkış
- **Toplam bakiye görünümü**: Tüm kasaların toplamı
- **Kasalar arası transfer**: Kaynak → Hedef otomatik işlem kaydı
- **Kasa işlem geçmişi**: Her kasanın detaylı geçmişi

#### 5.2 Ödeme Akışı Güncelleme
- **Ödeme girişi**: Öğrenci + Branş + Öğretmen + Kasa seçimi
- **Para çıkışı kategorileri**: Maaş, Kira, Reklam, Ofis, Sermaye, Transfer
- **Maaş ödemesi**: Öğretmen seçimi zorunlu
- **Kasa bazlı filtreleme**: Ödemelerde kasa filtresi

#### 5.3 Öğretmen Gelir Detay Ekranları
- **Ders Kazanç Detayı**: Grup bazlı listeleme
  - Grup adı, branş, ders tipi, grup boyutu
  - Ders sayısı, birim ücret, hesaplama
  - Ders tarihleri
- **Kamp Kazanç Detayı**: Kamp bazlı listeleme
- **YouTube Kazanç Detayı**: İçerik bazlı listeleme
- **Aylık filtreleme**: Tüm detay ekranlarında

#### 5.4 Öğrenci Finans Detayı
- **Branş bazlı hesaplama**:
  - Girilen ders sayısı
  - Ödenen tutar
  - Kullanılan tutar (ders × fiyat)
  - Kalan bakiye
  - Kalan ders sayısı
  - Borçlu/Alacaklı durumu

#### 5.5 Branş Bazlı Öğrenci Listesi
- `/admin/students/branch/{branchId}` sayfası
- Özet kartlar (öğrenci sayısı, toplam ödeme, kullanılan, net bakiye)
- Her öğrenci için detaylı finans bilgisi
- Borçludan alacaklıya sıralama
- İsim/veli arama

### 6. Grup Dersi Hesaplama Düzeltmesi ✅
- **DOĞRU**: Öğretmen kazancı = Ders sayısı × Grup ücreti
- **YANLIŞ DEĞİL**: Öğrenci sayısı ile çarpılmıyor
- İlk öğrenciye tam ücret, diğerlerine 0 yazılıyor
- Mevcut veriler fix endpoint ile düzeltildi

### 7. Diğer Geliştirmeler ✅
- Test hesap bilgisi login'den kaldırıldı
- Banka hesabı silme (bakiye kontrolü ile)
- Ödeme düzenleme/silme
- Öğretmen kullanıcı bilgileri görüntüleme/düzenleme
- Ders eklerken branş bazlı öğretmen filtreleme
- Grup oluşturmada sınıf seçimi (5-8) ve öğrenci arama
- Öğrenciler sayfasında özet istatistikler
- 4+ kişilik gruplarda öğretmen geliri 4 kişi üzerinden
- Sene sonu butonu (sınıf arttırma, 8. sınıf pasif)

---

## Veri Modelleri

### BranchCashbox (YENİ)
```python
id: str
branch_id: str
name: str  # "Türkçe Kasası"
created_at: datetime
```

### CashboxTransfer (YENİ)
```python
id: str
from_cashbox_id: str
to_cashbox_id: str
amount: float
description: str
date: str
created_at: datetime
```

### Payment (Güncellendi)
```python
id: str
payment_type: str  # student_payment, teacher_payment, expense, transfer_in, transfer_out
amount: float
date: str
student_id: str (optional)
teacher_id: str (optional)
branch_id: str (optional)  # YENİ
cashbox_id: str (optional)  # YENİ
bank_account_id: str (optional)
description: str (optional)
expense_category: str (optional)  # Maaş, Kira, Reklam, Ofis, Sermaye, Transfer
transfer_id: str (optional)  # YENİ
```

### StudentCourse (Güncellendi)
```python
student_price: float (optional)  # YENİ - Öğrenci ders ücreti
```

### Lesson (Güncellendi)
```python
group_id: str (optional)  # YENİ - Grup dersi için
```

---

## API Endpoints

### Kasa Yönetimi
- `GET /api/cashboxes` - Tüm kasalar + bakiyeler + toplam
- `GET /api/cashboxes/{id}` - Kasa detayı + işlem geçmişi
- `POST /api/cashboxes` - Yeni kasa (branş başına 1)
- `POST /api/cashbox-transfers` - Kasalar arası transfer
- `POST /api/init-cashboxes` - Migration: Kasaları oluştur

### Öğretmen Gelir Detayları
- `GET /api/teachers/{id}/lesson-income-detail` - Ders kazanç detayı
- `GET /api/teachers/{id}/camp-income-detail` - Kamp kazanç detayı
- `GET /api/teachers/{id}/youtube-income-detail` - YouTube kazanç detayı

### Öğrenci Finans
- `GET /api/students/{id}/finance-detail` - Branş bazlı finans özeti
- `GET /api/students/by-branch/{branch_id}` - Branş bazlı öğrenci listesi

---

## Frontend Sayfaları

### Yeni Sayfalar
- `AdminCashboxes.jsx` - Kasa yönetimi
- `AdminStudentsByBranch.jsx` - Branş bazlı öğrenci listesi
- `TeacherLessonIncomeDetail.jsx` - Ders gelir detayı
- `TeacherCampIncomeDetail.jsx` - Kamp gelir detayı
- `TeacherYoutubeIncomeDetail.jsx` - YouTube gelir detayı

### Güncellenen Sayfalar
- `AdminPayments.jsx` - Kasa seçimi, branş seçimi eklendi
- `TeacherBalance.jsx` - Kartlar tıklanabilir (detay sayfalarına link)
- `AdminLayout.jsx` - Kasalar menüsü eklendi

---

## Menü Yapısı

### Admin Menü
1. Ana Sayfa
2. Öğrenciler
3. Öğretmenler
4. Gruplar
5. Kamplar
6. YouTube
7. Branşlar
8. **Kasalar** (YENİ)
9. Ödemeler
10. Banka Hesapları
11. Aylık Program
12. Kullanıcı Ekle

---

## Gelecek Görevler

### P1 - Öncelikli
- Backend refactoring (server.py ~3000 satır)
- Performance optimizasyonları (N+1 query, pagination)

### P2 - Normal
- Branş bazlı öğrenci alt menüleri oluşturma
- Öğrenci profil sayfasına finans detayı widget'ı

### P3 - Gelecek
- WordPress entegrasyonu
- SMS hatırlatıcıları
- Raporlama modülü

---

## Test Bilgileri
- **Admin**: admin / admin123
- **URL**: https://quirky-ride-4.preview.emergentagent.com

---

## Son Güncelleme
- Tarih: 2026-03-26
- Versiyon: 3.0
- Değişiklik: Branş bazlı kasa sistemi, öğretmen gelir detay ekranları, öğrenci finans takibi
