import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiClient from '../../api/axios';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Plus, ArrowUpCircle, ArrowDownCircle, Filter, X, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('income');
  const [editingPayment, setEditingPayment] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedBankAccount, setSelectedBankAccount] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [newPayment, setNewPayment] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    student_id: '',
    teacher_id: '',
    bank_account_id: '',
    description: '',
    expense_category: ''
  });

  useEffect(() => {
    fetchReferenceData();
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [selectedMonth, selectedBankAccount]);

  const fetchReferenceData = async () => {
    try {
      const [studentsRes, teachersRes, banksRes] = await Promise.all([
        apiClient.get('/students'),
        apiClient.get('/teachers'),
        apiClient.get('/bank-accounts')
      ]);
      setStudents(studentsRes.data);
      setTeachers(teachersRes.data);
      setBankAccounts(banksRes.data);
    } catch (error) {
      toast.error('Referans veriler yüklenemedi');
    }
  };

  const fetchPayments = async () => {
    try {
      let url = '/payments?';
      if (selectedMonth) {
        url += `month=${selectedMonth}&`;
      }
      if (selectedBankAccount && selectedBankAccount !== 'all') {
        url += `bank_account_id=${selectedBankAccount}`;
      }
      const response = await apiClient.get(url);
      setPayments(response.data);
    } catch (error) {
      toast.error('Ödemeler yüklenemedi');
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    
    // Banka hesabı zorunlu kontrolü
    if (!newPayment.bank_account_id) {
      toast.error('Banka hesabı seçimi zorunludur');
      return;
    }
    
    try {
      const paymentData = {
        ...newPayment,
        amount: parseFloat(newPayment.amount),
        payment_type: dialogType === 'income' ? 'student_payment' : 'expense'
      };
      
      if (editingPayment) {
        await apiClient.put(`/payments/${editingPayment.id}`, paymentData);
        toast.success('Ödeme güncellendi');
      } else {
        await apiClient.post('/payments', paymentData);
        toast.success('Ödeme eklendi');
      }
      
      closeDialog();
      fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.detail || (editingPayment ? 'Güncelleme başarısız' : 'Ödeme eklenemedi'));
    }
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    
    try {
      await apiClient.delete(`/payments/${paymentToDelete.id}`);
      toast.success('Ödeme silindi');
      setDeleteDialogOpen(false);
      setPaymentToDelete(null);
      fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Silme işlemi başarısız');
    }
  };

  const openDialog = (type, payment = null) => {
    setDialogType(type);
    setEditingPayment(payment);
    
    if (payment) {
      setNewPayment({
        amount: payment.amount.toString(),
        date: payment.date,
        student_id: payment.student_id || '',
        teacher_id: payment.teacher_id || '',
        bank_account_id: payment.bank_account_id || '',
        description: payment.description || '',
        expense_category: payment.expense_category || ''
      });
    } else {
      setNewPayment({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        student_id: '',
        teacher_id: '',
        bank_account_id: '',
        description: '',
        expense_category: ''
      });
    }
    
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingPayment(null);
    setNewPayment({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      student_id: '',
      teacher_id: '',
      bank_account_id: '',
      description: '',
      expense_category: ''
    });
  };

  const incomePayments = payments.filter(p => p.payment_type === 'student_payment');
  const expensePayments = payments.filter(p => p.payment_type === 'expense' || p.payment_type === 'teacher_payment');

  const totalIncome = incomePayments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpense = expensePayments.reduce((sum, p) => sum + p.amount, 0);

  const renderPaymentItem = (payment, bgClass) => {
    const student = students.find(s => s.id === payment.student_id);
    const teacher = teachers.find(t => t.id === payment.teacher_id);
    const bankAccount = bankAccounts.find(b => b.id === payment.bank_account_id);
    const isIncome = payment.payment_type === 'student_payment';
    
    return (
      <div key={payment.id} className={`flex items-center justify-between p-3 lg:p-4 ${bgClass} rounded-lg`}>
        <div className="min-w-0 flex-1 mr-3">
          <p className="font-semibold text-slate-800 text-sm lg:text-base">{payment.date}</p>
          <p className="text-xs lg:text-sm text-slate-600 truncate">
            {payment.payment_type === 'student_payment' ? `Öğrenci: ${student?.name || 'Bilinmiyor'}` : 
             payment.payment_type === 'teacher_payment' ? `Öğretmen: ${teacher?.name || 'Bilinmiyor'}` : 
             payment.expense_category || 'Gider'}
          </p>
          {bankAccount && (
            <p className="text-xs text-slate-500">{bankAccount.bank_name}</p>
          )}
          {payment.description && <p className="text-xs text-slate-500 truncate">{payment.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <p className={`font-bold text-sm lg:text-base whitespace-nowrap ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
            {isIncome ? '+' : '-'}{payment.amount.toFixed(2)} ₺
          </p>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openDialog(isIncome ? 'income' : 'expense', payment)}
              className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600"
            >
              <Edit size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPaymentToDelete(payment);
                setDeleteDialogOpen(true);
              }}
              className="h-8 w-8 p-0 text-slate-500 hover:text-red-600"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="page-title" data-testid="admin-payments-title">
            Ödemeler
          </h1>
          <p className="page-subtitle mt-1">Gelen ve giden ödemeleri yönetin</p>
        </div>

        {/* Summary Cards - Mobile optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-6 mb-6 lg:mb-8">
          <div className="admin-card p-4 lg:p-6">
            <p className="text-xs lg:text-sm text-slate-500 mb-1">Toplam Gelir</p>
            <p className="text-2xl lg:text-3xl font-bold text-green-600">{totalIncome.toFixed(2)} ₺</p>
          </div>
          <div className="admin-card p-4 lg:p-6">
            <p className="text-xs lg:text-sm text-slate-500 mb-1">Toplam Gider</p>
            <p className="text-2xl lg:text-3xl font-bold text-red-600">{totalExpense.toFixed(2)} ₺</p>
          </div>
          <div className="admin-card p-4 lg:p-6">
            <p className="text-xs lg:text-sm text-slate-500 mb-1">Net</p>
            <p className={`text-2xl lg:text-3xl font-bold ${(totalIncome - totalExpense) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {(totalIncome - totalExpense).toFixed(2)} ₺
            </p>
          </div>
        </div>

        <div className="admin-card p-4 lg:p-6">
          {/* Header with actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-6">
            <h2 className="text-lg lg:text-xl font-bold text-slate-800">Ödeme Geçmişi</h2>
            <div className="grid grid-cols-2 sm:flex gap-2">
              <Button
                onClick={() => openDialog('income')}
                data-testid="add-income-btn"
                className="bg-green-600 hover:bg-green-700 h-11 lg:h-10 text-sm"
              >
                <ArrowDownCircle size={18} className="mr-1.5" />
                <span className="hidden sm:inline">Ödeme </span>Girişi
              </Button>
              <Button
                onClick={() => openDialog('expense')}
                data-testid="add-expense-btn"
                className="bg-red-600 hover:bg-red-700 h-11 lg:h-10 text-sm"
              >
                <ArrowUpCircle size={18} className="mr-1.5" />
                <span className="hidden sm:inline">Para </span>Çıkışı
              </Button>
            </div>
          </div>

          {/* Filters - Mobile stacked */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 mb-4 lg:mb-6 p-3 lg:p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-slate-500 hidden sm:block" />
              <span className="text-sm font-medium text-slate-700">Filtreler:</span>
            </div>
            
            <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3 flex-1">
              <Select value={selectedMonth || 'all'} onValueChange={(val) => setSelectedMonth(val === 'all' ? '' : val)}>
                <SelectTrigger className="h-11 lg:h-10 text-sm" data-testid="month-filter">
                  <SelectValue placeholder="Ay seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Aylar</SelectItem>
                  <SelectItem value="2024-12">Aralık 2024</SelectItem>
                  <SelectItem value="2025-01">Ocak 2025</SelectItem>
                  <SelectItem value="2025-02">Şubat 2025</SelectItem>
                  <SelectItem value="2025-03">Mart 2025</SelectItem>
                  <SelectItem value="2025-04">Nisan 2025</SelectItem>
                  <SelectItem value="2025-05">Mayıs 2025</SelectItem>
                  <SelectItem value="2025-06">Haziran 2025</SelectItem>
                  <SelectItem value="2026-01">Ocak 2026</SelectItem>
                  <SelectItem value="2026-02">Şubat 2026</SelectItem>
                  <SelectItem value="2026-03">Mart 2026</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount}>
                <SelectTrigger className="h-11 lg:h-10 text-sm" data-testid="bank-filter">
                  <SelectValue placeholder="Banka" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Hesaplar</SelectItem>
                  {bankAccounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.bank_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(selectedMonth || selectedBankAccount !== 'all') && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSelectedMonth('');
                  setSelectedBankAccount('all');
                }}
                className="h-10 text-slate-600"
              >
                <X size={16} className="mr-1" />
                Temizle
              </Button>
            )}
          </div>

          {/* Tabs - Mobile optimized */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex h-11 sm:h-10">
              <TabsTrigger value="all" className="text-xs sm:text-sm">Tümü</TabsTrigger>
              <TabsTrigger value="income" className="text-xs sm:text-sm">Gelir</TabsTrigger>
              <TabsTrigger value="expense" className="text-xs sm:text-sm">Gider</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-2 lg:space-y-3 mt-4">
              {payments.length === 0 ? (
                <p className="text-slate-600 text-center py-8">Henüz ödeme yok</p>
              ) : (
                payments.map((payment) => renderPaymentItem(payment, 'bg-slate-50'))
              )}
            </TabsContent>

            <TabsContent value="income" className="space-y-2 lg:space-y-3 mt-4">
              {incomePayments.length === 0 ? (
                <p className="text-slate-600 text-center py-8">Henüz gelir kaydı yok</p>
              ) : (
                incomePayments.map((payment) => renderPaymentItem(payment, 'bg-green-50'))
              )}
            </TabsContent>

            <TabsContent value="expense" className="space-y-2 lg:space-y-3 mt-4">
              {expensePayments.length === 0 ? (
                <p className="text-slate-600 text-center py-8">Henüz gider kaydı yok</p>
              ) : (
                expensePayments.map((payment) => renderPaymentItem(payment, 'bg-red-50'))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Add/Edit Payment Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent className="sm:max-w-md mx-4 sm:mx-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPayment ? 'Ödeme Düzenle' : (dialogType === 'income' ? 'Ödeme Girişi' : 'Para Çıkışı')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              {dialogType === 'income' && (
                <div className="space-y-2">
                  <Label htmlFor="student">Öğrenci</Label>
                  <Select value={newPayment.student_id} onValueChange={(value) => setNewPayment({ ...newPayment, student_id: value })}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Öğrenci seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {dialogType === 'expense' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="expense_category">Gider Kategorisi</Label>
                    <Select value={newPayment.expense_category} onValueChange={(value) => setNewPayment({ ...newPayment, expense_category: value })}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Kategori seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Kira">Kira</SelectItem>
                        <SelectItem value="Reklam">Reklam</SelectItem>
                        <SelectItem value="Genel Gider">Genel Gider</SelectItem>
                        <SelectItem value="Diğer">Diğer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Açıklama</Label>
                    <Input
                      id="description"
                      value={newPayment.description}
                      onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                      className="h-12"
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="amount">Tutar (₺) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  required
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Tarih *</Label>
                <Input
                  id="date"
                  type="date"
                  value={newPayment.date}
                  onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
                  required
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_account">Banka Hesabı *</Label>
                <Select 
                  value={newPayment.bank_account_id} 
                  onValueChange={(value) => setNewPayment({ ...newPayment, bank_account_id: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Banka hesabı seçin (zorunlu)" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.bank_name} - {account.holder_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">Banka hesabı seçimi zorunludur</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button type="button" variant="outline" onClick={closeDialog} className="h-12">
                  İptal
                </Button>
                <Button type="submit" className="h-12">
                  {editingPayment ? 'Güncelle' : 'Kaydet'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Ödemeyi Sil</AlertDialogTitle>
              <AlertDialogDescription>
                Bu ödeme kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeletePayment}
                className="bg-red-600 hover:bg-red-700"
              >
                Sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminPayments;
