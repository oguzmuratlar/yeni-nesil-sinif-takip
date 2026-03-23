import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiClient from '../../api/axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { toast } from 'sonner';

const AdminBankAccountForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    bank_name: '',
    iban: '',
    holder_name: '',
    is_legal: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      fetchAccount();
    }
  }, [id]);

  const fetchAccount = async () => {
    try {
      const response = await apiClient.get(`/bank-accounts`);
      const account = response.data.find(a => a.id === id);
      if (account) {
        setFormData(account);
      }
    } catch (error) {
      toast.error('Hesap bilgileri yüklenemedi');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        // Update endpoint doesn't exist, we'll just create for now
        toast.info('Güncelleme özelliği yakında eklenecek');
      } else {
        await apiClient.post('/bank-accounts', formData);
        toast.success('Banka hesabı eklendi');
      }
      navigate('/admin/bank-accounts');
    } catch (error) {
      toast.error(isEdit ? 'Güncelleme başarısız' : 'Ekleme başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-slate-800 mb-2" data-testid="bank-account-form-title">
            {isEdit ? 'Banka Hesabı Düzenle' : 'Yeni Banka Hesabı Ekle'}
          </h1>
          <p className="text-slate-600">Banka hesap bilgilerini girin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="admin-card p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="bank_name">Banka Adı *</Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                placeholder="Örn: Ziraat Bankası"
                required
                data-testid="bank-name-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="holder_name">Hesap Sahibi *</Label>
              <Input
                id="holder_name"
                value={formData.holder_name}
                onChange={(e) => setFormData({ ...formData, holder_name: e.target.value })}
                placeholder="Ahmet Yılmaz veya Şirket Adı"
                required
                data-testid="holder-name-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="iban">IBAN *</Label>
              <Input
                id="iban"
                value={formData.iban}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                required
                data-testid="iban-input"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_legal"
                checked={formData.is_legal}
                onCheckedChange={(checked) => setFormData({ ...formData, is_legal: checked })}
                data-testid="is-legal-checkbox"
              />
              <Label htmlFor="is_legal" className="font-normal cursor-pointer">
                Kurumsal hesap
              </Label>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              type="submit"
              disabled={loading}
              data-testid="save-bank-account-btn"
              className="admin-btn"
            >
              {loading ? 'Kaydediliyor...' : (isEdit ? 'Güncelle' : 'Kaydet')}
            </Button>
            <Button
              type="button"
              onClick={() => navigate('/admin/bank-accounts')}
              variant="outline"
              data-testid="cancel-btn"
            >
              İptal
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminBankAccountForm;