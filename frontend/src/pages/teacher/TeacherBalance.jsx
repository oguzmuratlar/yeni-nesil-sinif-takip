import React, { useState, useEffect } from 'react';
import TeacherLayout from '../../components/layouts/TeacherLayout';
import apiClient from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { Wallet } from 'lucide-react';
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="teacher-card p-8 text-center">
            <p className="text-sm text-stone-500 mb-2">Toplam Kazanç</p>
            <p className="text-4xl font-bold text-teal-600">{balanceData.total_earnings.toFixed(2)} ₺</p>
          </div>
          <div className="teacher-card p-8 text-center">
            <p className="text-sm text-stone-500 mb-2">Yapılan Ödeme</p>
            <p className="text-4xl font-bold text-green-600">{balanceData.total_paid.toFixed(2)} ₺</p>
          </div>
          <div className="teacher-card p-8 text-center">
            <p className="text-sm text-stone-500 mb-2">Kalan Bakiye</p>
            <p className="text-4xl font-bold text-amber-600">{balanceData.balance.toFixed(2)} ₺</p>
          </div>
        </div>

        <div className="teacher-card p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Ödeme Geçmişi</h2>
          {balanceData.payments.length === 0 ? (
            <p className="text-stone-600 text-center py-12">Henüz ödeme yapılmamış</p>
          ) : (
            <div className="space-y-4">
              {balanceData.payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-6 bg-stone-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-slate-800 text-lg">{payment.date}</p>
                    <p className="text-sm text-stone-600">{payment.description || 'Öğretmen ödemesi'}</p>
                  </div>
                  <p className="font-bold text-green-600 text-xl">{payment.amount.toFixed(2)} ₺</p>
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