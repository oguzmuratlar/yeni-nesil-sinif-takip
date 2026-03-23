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
    season_id: '',
    username: '',
    password: '',
    branches: [],  // [{branch_id, birebir_price, group_prices: {1, 2, 3, 4}}]
  });
  const [seasons, setSeasons] = useState([]);
  const [branches, setBranches] = useState([]);
  const [lessonTypes, setLessonTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [newBranch, setNewBranch] = useState({
    branch_id: '',
    birebir_price: '',
    group_1: '',
    group_2: '',
    group_3: '',
    group_4: ''
  });

  useEffect(() => {
    fetchReferenceData();
    if (isEdit) {
      fetchTeacher();
    }
  }, [id]);

  const fetchReferenceData = async () => {
    try {
      const [seasonsRes, branchesRes, typesRes] = await Promise.all([
        apiClient.get('/seasons'),
        apiClient.get('/branches'),
        apiClient.get('/lesson-types')
      ]);
      setSeasons(seasonsRes.data.filter(s => s.status === 'active'));
      setBranches(branchesRes.data);
      setLessonTypes(typesRes.data);
    } catch (error) {
      toast.error('Veriler yüklenemedi');
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
        await apiClient.put(`/teachers/${id}`, {
          name: formData.name,
          phone: formData.phone,
          season_id: formData.season_id
        });
        toast.success('Öğretmen güncellendi');
      } else {
        // First create teacher
        const teacherResponse = await apiClient.post('/teachers', {
          name: formData.name,
          phone: formData.phone,
          season_id: formData.season_id
        });
        const teacherId = teacherResponse.data.id;
        
        // Then create user for this teacher
        await apiClient.post('/auth/register', {
          username: formData.username,
          password: formData.password,
          user_type: 'teacher',
          teacher_id: teacherId
        });
        
        toast.success('Öğretmen ve kullanıcı oluşturuldu');
      }
      navigate('/admin/teachers');
    } catch (error) {
      toast.error(error.response?.data?.detail || (isEdit ? 'Güncelleme başarısız' : 'Ekleme başarısız'));
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

            {!isEdit && (
              <>
                <div className="col-span-2 mt-4">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Kullanıcı Bilgileri</h3>
                  <p className="text-sm text-slate-600 mb-4">Öğretmen için giriş yapabilmesi için kullanıcı bilgileri</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">Kullanıcı Adı *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required={!isEdit}
                    data-testid="teacher-username-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Şifre *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!isEdit}
                    data-testid="teacher-password-input"
                  />
                </div>
              </>
            )}
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