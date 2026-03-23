import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiClient from '../../api/axios';
import { Button } from '../../components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/badge';

const AdminBankAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await apiClient.get('/bank-accounts');
      setAccounts(response.data);
    } catch (error) {
      toast.error('Hesaplar yüklenemedi');
    } finally {
      setLoading(false);
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
                    {account.is_legal && (
                      <Badge variant="secondary" className="mb-2">Kurumsal</Badge>
                    )}
                  </div>
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
      </div>
    </AdminLayout>
  );
};

export default AdminBankAccounts;