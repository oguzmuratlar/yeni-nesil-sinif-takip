import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiClient from '../../api/axios';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Wallet, ArrowRightLeft, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/badge';

const AdminCashboxes = () => {
  const [cashboxData, setCashboxData] = useState({ cashboxes: [], total_balance: 0 });
  const [loading, setLoading] = useState(true);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCashbox, setSelectedCashbox] = useState(null);
  const [transferForm, setTransferForm] = useState({
    from_cashbox_id: '',
    to_cashbox_id: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchCashboxes();
  }, []);

  const fetchCashboxes = async () => {
    try {
      const response = await apiClient.get('/cashboxes');
      setCashboxData(response.data);
    } catch (error) {
      toast.error('Kasalar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    
    if (transferForm.from_cashbox_id === transferForm.to_cashbox_id) {
      toast.error('Kaynak ve hedef kasa aynı olamaz');
      return;
    }
    
    try {
      await apiClient.post('/cashbox-transfers', {
        ...transferForm,
        amount: parseFloat(transferForm.amount)
      });
      toast.success('Transfer başarılı');
      setTransferDialogOpen(false);
      setTransferForm({
        from_cashbox_id: '',
        to_cashbox_id: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchCashboxes();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Transfer başarısız');
    }
  };

  const openCashboxDetail = async (cashbox) => {
    try {
      const response = await apiClient.get(`/cashboxes/${cashbox.id}`);
      setSelectedCashbox(response.data);
      setDetailDialogOpen(true);
    } catch (error) {
      toast.error('Kasa detayları yüklenemedi');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY',
      minimumFractionDigits: 2 
    }).format(amount);
  };

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
          <div>
            <h1 className="page-title" data-testid="admin-cashboxes-title">
              Kasalar
            </h1>
            <p className="page-subtitle mt-1">Branş bazlı kasa yönetimi</p>
          </div>
          <Button
            onClick={() => setTransferDialogOpen(true)}
            data-testid="transfer-btn"
            className="admin-btn"
          >
            <ArrowRightLeft size={20} className="mr-2" />
            Kasalar Arası Transfer
          </Button>
        </div>

        {/* Toplam Bakiye */}
        <div className="admin-card p-6 mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Toplam Bakiye</p>
              <p className="text-3xl lg:text-4xl font-bold mt-1">
                {formatCurrency(cashboxData.total_balance)}
              </p>
            </div>
            <Wallet size={48} className="text-blue-200" />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Yükleniyor...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cashboxData.cashboxes.map((cashbox) => (
              <div
                key={cashbox.id}
                data-testid={`cashbox-card-${cashbox.id}`}
                className="admin-card p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => openCashboxDetail(cashbox)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{cashbox.name}</h3>
                    <Badge variant="secondary" className="mt-1">{cashbox.branch_name}</Badge>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye size={18} />
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 flex items-center gap-1">
                      <TrendingUp size={14} className="text-green-500" />
                      Giriş
                    </span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(cashbox.total_income)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 flex items-center gap-1">
                      <TrendingDown size={14} className="text-red-500" />
                      Çıkış
                    </span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(cashbox.total_expense)}
                    </span>
                  </div>
                  
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-700">Bakiye</span>
                      <span className={`text-xl font-bold ${cashbox.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {formatCurrency(cashbox.balance)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Transfer Dialog */}
        <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Kasalar Arası Transfer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div className="space-y-2">
                <Label>Çıkış Kasası *</Label>
                <Select 
                  value={transferForm.from_cashbox_id} 
                  onValueChange={(v) => setTransferForm({...transferForm, from_cashbox_id: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kasa seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {cashboxData.cashboxes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({formatCurrency(c.balance)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Giriş Kasası *</Label>
                <Select 
                  value={transferForm.to_cashbox_id} 
                  onValueChange={(v) => setTransferForm({...transferForm, to_cashbox_id: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kasa seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {cashboxData.cashboxes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({formatCurrency(c.balance)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Tutar (₺) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({...transferForm, amount: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Tarih *</Label>
                <Input
                  type="date"
                  value={transferForm.date}
                  onChange={(e) => setTransferForm({...transferForm, date: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Input
                  value={transferForm.description}
                  onChange={(e) => setTransferForm({...transferForm, description: e.target.value})}
                  placeholder="Transfer açıklaması"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setTransferDialogOpen(false)} className="flex-1">
                  İptal
                </Button>
                <Button type="submit" className="flex-1">
                  Transfer Yap
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Cashbox Detail Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedCashbox?.name} - İşlem Geçmişi</DialogTitle>
            </DialogHeader>
            {selectedCashbox && (
              <div>
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <p className="text-xs text-green-600">Giriş</p>
                    <p className="font-bold text-green-700">{formatCurrency(selectedCashbox.total_income)}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg text-center">
                    <p className="text-xs text-red-600">Çıkış</p>
                    <p className="font-bold text-red-700">{formatCurrency(selectedCashbox.total_expense)}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-xs text-blue-600">Bakiye</p>
                    <p className="font-bold text-blue-700">{formatCurrency(selectedCashbox.balance)}</p>
                  </div>
                </div>
                
                {/* Transactions */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedCashbox.transactions?.length === 0 ? (
                    <p className="text-center text-slate-500 py-4">Henüz işlem yok</p>
                  ) : (
                    selectedCashbox.transactions?.map((tx) => (
                      <div 
                        key={tx.id} 
                        className={`p-3 rounded-lg border ${
                          ['student_payment', 'transfer_in'].includes(tx.payment_type) 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-slate-800">
                              {tx.payment_type === 'student_payment' && `Öğrenci: ${tx.student_name || 'Bilinmiyor'}`}
                              {tx.payment_type === 'teacher_payment' && `Öğretmen: ${tx.teacher_name || 'Bilinmiyor'}`}
                              {tx.payment_type === 'expense' && (tx.expense_category || 'Gider')}
                              {tx.payment_type === 'transfer_in' && 'Transfer Girişi'}
                              {tx.payment_type === 'transfer_out' && 'Transfer Çıkışı'}
                            </p>
                            <p className="text-xs text-slate-500">{tx.date}</p>
                            {tx.description && <p className="text-xs text-slate-500 truncate">{tx.description}</p>}
                          </div>
                          <p className={`font-bold text-sm whitespace-nowrap ${
                            ['student_payment', 'transfer_in'].includes(tx.payment_type) 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {['student_payment', 'transfer_in'].includes(tx.payment_type) ? '+' : '-'}
                            {formatCurrency(tx.amount)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminCashboxes;
