import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiClient from '../../api/axios';
import { Button } from '../../components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/badge';
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

const AdminBankAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await apiClient.get('/bank-accounts');
      
      // Her hesap için bakiye bilgisini al
      const accountsWithBalance = await Promise.all(
        response.data.map(async (account) => {
          try {
            const balanceRes = await apiClient.get(`/bank-accounts/${account.id}/balance`);
            return { ...account, balance: balanceRes.data.balance };
          } catch (error) {
            return { ...account, balance: 0 };
          }
        })
      );
      
      setAccounts(accountsWithBalance);
    } catch (error) {
      toast.error('Hesaplar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (account) => {
    setAccountToDelete(account);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!accountToDelete) return;
    
    setDeleting(true);
    try {
      await apiClient.delete(`/bank-accounts/${accountToDelete.id}`);
      toast.success('Banka hesabı silindi');
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
      fetchAccounts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Silme işlemi başarısız');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-800 mb-2" data-testid="admin-bank-accounts-title">
              Banka Hesapları
            </h1>
            <p className="text-slate-600">Ödeme hesaplarını yönetin</p>
          </div>
          <Button
            onClick={() => navigate('/admin/bank-accounts/new')}
            data-testid="add-bank-account-btn"
            className="admin-btn"
          >
            <Plus size={20} className="mr-2" />
            Hesap Ekle
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Yükleniyor...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="admin-card p-12 text-center">
            <p className="text-slate-600">Henüz banka hesabı eklenmemiş</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {accounts.map((account) => (
              <div
                key={account.id}
                data-testid={`bank-account-card-${account.id}`}
                className="admin-card p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-800 mb-1">{account.bank_name}</h3>
                    <div className="flex gap-2 flex-wrap">
                      {account.is_legal && (
                        <Badge variant="secondary">Kurumsal</Badge>
                      )}
                      <Badge variant={account.balance === 0 ? 'outline' : account.balance > 0 ? 'default' : 'destructive'}>
                        Bakiye: {account.balance?.toFixed(2) || '0.00'} ₺
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(account)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    data-testid={`delete-account-${account.id}`}
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
                <div className="space-y-2 text-slate-700">
                  <div>
                    <span className="text-sm text-slate-500">Hesap Sahibi:</span>
                    <p className="font-semibold">{account.holder_name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">IBAN:</span>
                    <p className="font-mono text-sm">{account.iban}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Banka Hesabını Sil</AlertDialogTitle>
              <AlertDialogDescription>
                {accountToDelete && accountToDelete.balance !== 0 ? (
                  <span className="text-red-600">
                    Bu hesabın bakiyesi {accountToDelete.balance?.toFixed(2)} ₺. 
                    Hesabı silmeden önce bakiyeyi sıfırlayın.
                  </span>
                ) : (
                  <>
                    <strong>{accountToDelete?.bank_name}</strong> hesabını silmek istediğinize emin misiniz? 
                    Bu işlem geri alınamaz.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleting || (accountToDelete && accountToDelete.balance !== 0)}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? 'Siliniyor...' : 'Sil'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminBankAccounts;