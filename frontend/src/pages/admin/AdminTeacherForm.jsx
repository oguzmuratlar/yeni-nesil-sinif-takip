import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiClient from '../../api/axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';

const AdminTeacherForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    season_id: ''
  });
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSeasons();
    if (isEdit) {
      fetchTeacher();
    }
  }, [id]);

  const fetchSeasons = async () => {
    try {
      const response = await apiClient.get('/seasons');
      setSeasons(response.data.filter(s => s.status === 'active'));
    } catch (error) {
      toast.error('Sezonlar yüklenemedi');
    }
  };

  const fetchTeacher = async () => {
    try {
      const response = await apiClient.get(`/teachers/${id}`);
      setFormData(response.data);
    } catch (error) {
      toast.error('Öğretmen bilgileri yüklenemedi');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        await apiClient.put(`/teachers/${id}`, formData);
        toast.success('Öğretmen güncellendi');
      } else {
        await apiClient.post('/teachers', formData);
        toast.success('Öğretmen eklendi');
      }
      navigate('/admin/teachers');
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
          <h1 className="text-4xl font-extrabold text-slate-800 mb-2" data-testid="teacher-form-title">
            {isEdit ? 'Öğretmen Düzenle' : 'Yeni Öğretmen Ekle'}
          </h1>
          <p className="text-slate-600">Öğretmen bilgilerini girin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="admin-card p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Öğretmen Adı *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="teacher-name-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                data-testid="teacher-phone-input"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              type="submit"
              disabled={loading}
              data-testid="save-teacher-btn"
              className="admin-btn"
            >
              {loading ? 'Kaydediliyor...' : (isEdit ? 'Güncelle' : 'Kaydet')}
            </Button>
            <Button
              type="button"
              onClick={() => navigate('/admin/teachers')}
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

export default AdminTeacherForm;