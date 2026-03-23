import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiClient from '../../api/axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';

const AdminUserForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    user_type: 'teacher',
    teacher_id: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient.post('/auth/register', formData);
      toast.success('Kullanıcı oluşturuldu');
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kullanıcı oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-slate-800 mb-2" data-testid="user-form-title">
            Yeni Kullanıcı Ekle
          </h1>
          <p className="text-slate-600">Sisteme yeni kullanıcı ekleyin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="admin-card p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Kullanıcı Adı *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                data-testid="username-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Şifre *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                data-testid="password-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user_type">Kullanıcı Tipi *</Label>
              <Select value={formData.user_type} onValueChange={(value) => setFormData({ ...formData, user_type: value })}>
                <SelectTrigger data-testid="user-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="teacher">Öğretmen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.user_type === 'teacher' && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  Not: Öğretmen kullanıcısı için önce öğretmen kaydı oluşturun, sonra buradan kullanıcı oluşturup öğretmen ID'si ile eşleştirin.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Button
              type="submit"
              disabled={loading}
              data-testid="save-user-btn"
              className="admin-btn"
            >
              {loading ? 'Kaydediliyor...' : 'Kullanıcı Oluştur'}
            </Button>
            <Button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
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

export default AdminUserForm;