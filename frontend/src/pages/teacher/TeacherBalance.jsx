import React, { useState, useEffect } from 'react';
import TeacherLayout from '../../components/layouts/TeacherLayout';
import apiClient from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { Wallet, BookOpen, Tent, Youtube, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

const TeacherBalance = () => {
  const { user } = useAuth();
  const [balanceData, setBalanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('all');

  const months = [
    { value: 'all', label: 'Tüm Zamanlar' },
    { value: '2024-12', label: 'Aralık 2024' },
    { value: '2025-01', label: 'Ocak 2025' },
    { value: '2025-02', label: 'Şubat 2025' },
    { value: '2025-03', label: 'Mart 2025' },
    { value: '2025-04', label: 'Nisan 2025' },
    { value: '2025-05', label: 'Mayıs 2025' },
    { value: '2025-06', label: 'Haziran 2025' },
    { value: '2026-01', label: 'Ocak 2026' },
    { value: '2026-02', label: 'Şubat 2026' },
    { value: '2026-03', label: 'Mart 2026' },
    { value: '2026-04', label: 'Nisan 2026' },
  ];

  useEffect(() => {
    if (user?.teacher_id) {
      fetchBalance();
    }
  }, [user, selectedMonth]);

  const fetchBalance = async () => {
    setLoading(true);
    try {
      let url = `/teacher-balance/${user.teacher_id}`;
      if (selectedMonth !== 'all') {
        url += `?month=${selectedMonth}`;
      }
      const response = await apiClient.get(url);
      setBalanceData(response.data);
    } catch (error) {
      toast.error('Bakiye bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div className="text-center py-12">Yükleniyor...</div>
      </TeacherLayout>
    );
  }

  if (!balanceData) {
    return (
      <TeacherLayout>
        <div className="text-center py-12">Bakiye bilgileri yüklenemedi</div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header - Mobile optimized */}
        <div className="mb-8 lg:mb-12 text-center">
          <Wallet size={40} className="lg:hidden mx-auto mb-3 text-teal-600" />
          <Wallet size={48} className="hidden lg:block mx-auto mb-4 text-teal-600" />
          <h1 className="text-3xl lg:text-5xl font-extrabold text-slate-800 mb-2 lg:mb-3" data-testid="teacher-balance-title">
            Bakiye Takip
          </h1>
          <p className="text-base lg:text-lg text-stone-600">
            Kazancınızı ve ödeme geçmişinizi görüntüleyin
          </p>
        </div>

        {/* Ay Filtresi - Mobile optimized */}
        <div className="teacher-card p-3 lg:p-4 mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-stone-500" />
              <span className="text-sm font-medium text-stone-700">Dönem:</span>
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="h-11 lg:h-10 w-full sm:w-48" data-testid="month-filter">
                <SelectValue placeholder="Dönem seçin" />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMonth !== 'all' && (
              <span className="text-xs lg:text-sm text-teal-600 font-medium">
                {months.find(m => m.value === selectedMonth)?.label}
              </span>
            )}
          </div>
        </div>

        {/* Ana Özet Kartları - Mobile optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-8 mb-6 lg:mb-10">
          <div className="teacher-card p-4 lg:p-8 text-center">
            <p className="text-xs lg:text-sm text-stone-500 mb-1 lg:mb-2">Toplam Kazanç</p>
            <p className="text-2xl lg:text-4xl font-bold text-teal-600">{balanceData.total_earnings?.toFixed(0) || '0'} ₺</p>
          </div>
          <div className="teacher-card p-4 lg:p-8 text-center">
            <p className="text-xs lg:text-sm text-stone-500 mb-1 lg:mb-2">Yapılan Ödeme</p>
            <p className="text-2xl lg:text-4xl font-bold text-green-600">{balanceData.total_paid?.toFixed(0) || '0'} ₺</p>
          </div>
          <div className="teacher-card p-4 lg:p-8 text-center">
            <p className="text-xs lg:text-sm text-stone-500 mb-1 lg:mb-2">Kalan Bakiye</p>
            <p className="text-2xl lg:text-4xl font-bold text-amber-600">{balanceData.balance?.toFixed(0) || '0'} ₺</p>
          </div>
        </div>

        {/* Kazanç Detayları - Mobile optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-6 mb-6 lg:mb-10">
          <div className="teacher-card p-4 lg:p-6">
            <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-4">
              <BookOpen size={20} className="lg:hidden text-blue-600" />
              <BookOpen size={24} className="hidden lg:block text-blue-600" />
              <h3 className="text-base lg:text-lg font-bold text-slate-800">Ders Kazancı</h3>
            </div>
            <p className="text-xl lg:text-3xl font-bold text-blue-600">{balanceData.lesson_earnings?.toFixed(0) || '0'} ₺</p>
            <p className="text-xs lg:text-sm text-slate-500 mt-1 lg:mt-2">Birebir ve grup derslerinden</p>
          </div>
          
          <div className="teacher-card p-4 lg:p-6">
            <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-4">
              <Tent size={20} className="lg:hidden text-emerald-600" />
              <Tent size={24} className="hidden lg:block text-emerald-600" />
              <h3 className="text-base lg:text-lg font-bold text-slate-800">Kamp Kazancı</h3>
            </div>
            <p className="text-xl lg:text-3xl font-bold text-emerald-600">{balanceData.camp_earnings?.toFixed(0) || '0'} ₺</p>
            <p className="text-xs lg:text-sm text-slate-500 mt-1 lg:mt-2">Kesin kayıt katılımcılardan</p>
          </div>

          <div className="teacher-card p-4 lg:p-6">
            <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-4">
              <Youtube size={20} className="lg:hidden text-red-600" />
              <Youtube size={24} className="hidden lg:block text-red-600" />
              <h3 className="text-base lg:text-lg font-bold text-slate-800">YouTube Kazancı</h3>
            </div>
            <p className="text-xl lg:text-3xl font-bold text-red-600">{balanceData.youtube_earnings?.toFixed(0) || '0'} ₺</p>
            <p className="text-xs lg:text-sm text-slate-500 mt-1 lg:mt-2">Video çekimlerinden</p>
          </div>
        </div>

        {/* Kamp Kazanç Detayları - Mobile optimized */}
        {balanceData.camp_earnings_details && balanceData.camp_earnings_details.length > 0 && (
          <div className="teacher-card p-4 lg:p-8 mb-4 lg:mb-6">
            <h2 className="text-lg lg:text-xl font-bold text-slate-800 mb-3 lg:mb-4 flex items-center gap-2 lg:gap-3">
              <Tent size={18} className="lg:hidden text-emerald-600" />
              <Tent size={20} className="hidden lg:block text-emerald-600" />
              Kamp Detayları
            </h2>
            <div className="space-y-2 lg:space-y-3">
              {balanceData.camp_earnings_details.map((camp, index) => (
                <div key={index} className="flex items-center justify-between p-3 lg:p-4 bg-emerald-50 rounded-lg lg:rounded-xl">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="font-semibold text-slate-800 text-sm lg:text-base truncate">{camp.camp_name}</p>
                    <p className="text-xs lg:text-sm text-stone-600">
                      {camp.paid_students} kişi × {camp.per_student_fee} ₺
                    </p>
                  </div>
                  <p className="font-bold text-emerald-600 text-base lg:text-xl whitespace-nowrap">{camp.earning?.toFixed(0)} ₺</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* YouTube Kazanç Detayları - Mobile optimized */}
        {balanceData.youtube_earnings_details && balanceData.youtube_earnings_details.length > 0 && (
          <div className="teacher-card p-4 lg:p-8 mb-4 lg:mb-6">
            <h2 className="text-lg lg:text-xl font-bold text-slate-800 mb-3 lg:mb-4 flex items-center gap-2 lg:gap-3">
              <Youtube size={18} className="lg:hidden text-red-600" />
              <Youtube size={20} className="hidden lg:block text-red-600" />
              YouTube Detayları
            </h2>
            <div className="space-y-2 lg:space-y-3">
              {balanceData.youtube_earnings_details.map((yt, index) => (
                <div key={index} className="flex items-center justify-between p-3 lg:p-4 bg-red-50 rounded-lg lg:rounded-xl">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="font-semibold text-slate-800 text-sm lg:text-base truncate">{yt.title}</p>
                    <p className="text-xs lg:text-sm text-stone-600">{yt.date}</p>
                  </div>
                  <p className="font-bold text-red-600 text-base lg:text-xl whitespace-nowrap">{yt.amount?.toFixed(0)} ₺</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ödeme Geçmişi - Mobile optimized */}
        <div className="teacher-card p-4 lg:p-8">
          <h2 className="text-lg lg:text-2xl font-bold text-slate-800 mb-4 lg:mb-6">Ödeme Geçmişi</h2>
          {!balanceData.payments || balanceData.payments.length === 0 ? (
            <p className="text-stone-600 text-center py-8 lg:py-12">Henüz ödeme yapılmamış</p>
          ) : (
            <div className="space-y-2 lg:space-y-4">
              {balanceData.payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 lg:p-6 bg-stone-50 rounded-lg lg:rounded-xl">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="font-semibold text-slate-800 text-sm lg:text-lg">{payment.date}</p>
                    <p className="text-xs lg:text-sm text-stone-600 truncate">{payment.description || 'Öğretmen ödemesi'}</p>
                  </div>
                  <p className="font-bold text-green-600 text-base lg:text-xl whitespace-nowrap">{payment.amount?.toFixed(0)} ₺</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
};

export default TeacherBalance;
