import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiClient from '../../api/axios';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';

const AdminTeacherBalance = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [balanceData, setBalanceData] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    bank_account_id: '',
    description: 'Öğretmen ödemesi'
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [teacherRes, balanceRes, banksRes] = await Promise.all([
        apiClient.get(`/teachers/${id}`),
        apiClient.get(`/teacher-balance/${id}`),
        apiClient.get('/bank-accounts')
      ]);
      setTeacher(teacherRes.data);
      setBalanceData(balanceRes.data);
      setBankAccounts(banksRes.data);
    } catch (error) {
      toast.error('Veriler yüklenemedi');
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/payments', {
        payment_type: 'teacher_payment',
        teacher_id: id,
        ...newPayment,
        amount: parseFloat(newPayment.amount)
      });
      toast.success('Ödeme eklendi');
      setDialogOpen(false);
      setNewPayment({ amount: '', date: new Date().toISOString().split('T')[0], bank_account_id: '', description: 'Öğretmen ödemesi' });
      fetchData();
    } catch (error) {
      toast.error('Ödeme eklenemedi');
    }
  };

  if (!teacher || !balanceData) {
    return (
      <AdminLayout>
        <div className="text-center py-12">Yükleniyor...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <Button
          onClick={() => navigate(`/admin/teachers/${id}`)}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Geri Dön
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-slate-800 mb-2">
            Bakiye Bilgisi - {teacher.name}
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="admin-card p-6">
            <p className="text-sm text-slate-500 mb-1">Toplam Kazanç</p>
            <p className="text-3xl font-bold text-blue-600">{balanceData.total_earnings.toFixed(2)} ₺</p>
          </div>
          <div className="admin-card p-6">
            <p className="text-sm text-slate-500 mb-1">Yapılan Ödeme</p>
            <p className="text-3xl font-bold text-green-600">{balanceData.total_paid.toFixed(2)} ₺</p>
          </div>
          <div className="admin-card p-6">
            <p className="text-sm text-slate-500 mb-1">Kalan Bakiye</p>
            <p className="text-3xl font-bold text-orange-600">{balanceData.balance.toFixed(2)} ₺</p>
          </div>
        </div>

        <div className="admin-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">Ödeme Geçmişi</h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="add-payment-btn" className="admin-btn">
                  <Plus size={20} className="mr-2" />
                  Ödeme Girişi
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ödeme Girişi</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddPayment} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Tutar (₺)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Tarih</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newPayment.date}
                      onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank_account">Banka Hesabı</Label>
                    <Select value={newPayment.bank_account_id} onValueChange={(value) => setNewPayment({ ...newPayment, bank_account_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Banka hesabı seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.bank_name} - {account.holder_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" className="flex-1">Kaydet</Button>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {balanceData.payments.length === 0 ? (
            <p className="text-slate-600 text-center py-8">Henüz ödeme yapılmamış</p>
          ) : (
            <div className="space-y-3">
              {balanceData.payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-800">{payment.date}</p>
                    <p className="text-sm text-slate-600">{payment.description || 'Öğretmen ödemesi'}</p>
                  </div>
                  <p className="font-bold text-green-600">{payment.amount.toFixed(2)} ₺</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminTeacherBalance;