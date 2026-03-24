import React, { useState, useEffect } from 'react';
import TeacherLayout from '../../components/layouts/TeacherLayout';
import apiClient from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { Wallet, BookOpen, Tent } from 'lucide-react';
import { toast } from 'sonner';

const TeacherBalance = () => {
  const { user } = useAuth();
  const [balanceData, setBalanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.teacher_id) {
      fetchBalance();
    }
  }, [user]);

  const fetchBalance = async () => {
    try {
      const response = await apiClient.get(`/teacher-balance/${user.teacher_id}`);
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
        <div className="mb-12 text-center">
          <Wallet size={48} className="mx-auto mb-4 text-teal-600" />
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-3" data-testid="teacher-balance-title">
            Bakiye Takip
          </h1>
          <p className="text-lg text-stone-600">
            Kazancınızı ve ödeme geçmişinizi görüntüleyin
          </p>
        </div>

        {/* Ana Özet Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="teacher-card p-8 text-center">
            <p className="text-sm text-stone-500 mb-2">Toplam Kazanç</p>
            <p className="text-4xl font-bold text-teal-600">{balanceData.total_earnings?.toFixed(2) || '0.00'} ₺</p>
          </div>
          <div className="teacher-card p-8 text-center">
            <p className="text-sm text-stone-500 mb-2">Yapılan Ödeme</p>
            <p className="text-4xl font-bold text-green-600">{balanceData.total_paid?.toFixed(2) || '0.00'} ₺</p>
          </div>
          <div className="teacher-card p-8 text-center">
            <p className="text-sm text-stone-500 mb-2">Kalan Bakiye</p>
            <p className="text-4xl font-bold text-amber-600">{balanceData.balance?.toFixed(2) || '0.00'} ₺</p>
          </div>
        </div>

        {/* Kazanç Detayları */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="teacher-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen size={24} className="text-blue-600" />
              <h3 className="text-lg font-bold text-slate-800">Ders Kazancı</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600">{balanceData.lesson_earnings?.toFixed(2) || '0.00'} ₺</p>
            <p className="text-sm text-slate-500 mt-2">Birebir ve grup derslerinden</p>
          </div>
          
          <div className="teacher-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Tent size={24} className="text-emerald-600" />
              <h3 className="text-lg font-bold text-slate-800">Kamp Kazancı</h3>
            </div>
            <p className="text-3xl font-bold text-emerald-600">{balanceData.camp_earnings?.toFixed(2) || '0.00'} ₺</p>
            <p className="text-sm text-slate-500 mt-2">Ödeme yapan kamp katılımcılarından</p>
          </div>
        </div>

        {/* Kamp Kazanç Detayları */}
        {balanceData.camp_earnings_details && balanceData.camp_earnings_details.length > 0 && (
          <div className="teacher-card p-8 mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
              <Tent size={24} className="text-emerald-600" />
              Kamp Kazanç Detayları
            </h2>
            <div className="space-y-4">
              {balanceData.camp_earnings_details.map((camp, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-slate-800">{camp.camp_name}</p>
                    <p className="text-sm text-stone-600">
                      {camp.paid_students} ödeme yapan × {camp.per_student_fee} ₺
                    </p>
                  </div>
                  <p className="font-bold text-emerald-600 text-xl">{camp.earning?.toFixed(2)} ₺</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ödeme Geçmişi */}
        <div className="teacher-card p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Ödeme Geçmişi</h2>
          {!balanceData.payments || balanceData.payments.length === 0 ? (
            <p className="text-stone-600 text-center py-12">Henüz ödeme yapılmamış</p>
          ) : (
            <div className="space-y-4">
              {balanceData.payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-6 bg-stone-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-slate-800 text-lg">{payment.date}</p>
                    <p className="text-sm text-stone-600">{payment.description || 'Öğretmen ödemesi'}</p>
                  </div>
                  <p className="font-bold text-green-600 text-xl">{payment.amount?.toFixed(2)} ₺</p>
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