import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiClient from '../../api/axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';

const AdminStudentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    parent_name: '',
    phone: '',
    level: '',
    payment_freq: '1',
    notes: '',
    bank_account_id: ''
  });

  const [bankAccounts, setBankAccounts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [lessonTypes, setLessonTypes] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReferenceData();
    if (isEdit) {
      fetchStudent();
      fetchCourses();
    }
  }, [id]);

  const fetchReferenceData = async () => {
    try {
      const [banksRes, branchesRes, teachersRes, typesRes, seasonsRes] = await Promise.all([
        apiClient.get('/bank-accounts'),
        apiClient.get('/branches'),
        apiClient.get('/teachers'),
        apiClient.get('/lesson-types'),
        apiClient.get('/seasons')
      ]);
      setBankAccounts(banksRes.data);
      setBranches(branchesRes.data);
      setTeachers(teachersRes.data.filter(t => t.status === 'active'));
      setLessonTypes(typesRes.data);
      setSeasons(seasonsRes.data.filter(s => s.status === 'active'));
    } catch (error) {
      toast.error('Referans veriler yüklenemedi');
    }
  };

  const fetchStudent = async () => {
    try {
      const response = await apiClient.get(`/students/${id}`);
      setFormData(response.data);
    } catch (error) {
      toast.error('Öğrenci bilgileri yüklenemedi');
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await apiClient.get(`/student-courses?student_id=${id}`);
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        await apiClient.put(`/students/${id}`, formData);
        toast.success('Öğrenci güncellendi');
      } else {
        await apiClient.post('/students', formData);
        toast.success('Öğrenci eklendi');
      }
      navigate('/admin/students');
    } catch (error) {
      toast.error(isEdit ? 'Güncelleme başarısız' : 'Ekleme başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    // This will be handled in a modal or separate section
    toast.info('Ders ekleme özelliği yakında eklenecek');
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-slate-800 mb-2" data-testid="student-form-title">
            {isEdit ? 'Öğrenci Düzenle' : 'Yeni Öğrenci Ekle'}
          </h1>
          <p className="text-slate-600">Öğrenci bilgilerini girin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="admin-card p-8 space-y-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Temel Bilgiler</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Öğrenci Adı *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="student-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parent_name">Veli Adı *</Label>
                <Input
                  id="parent_name"
                  value={formData.parent_name}
                  onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                  required
                  data-testid="parent-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  data-testid="phone-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Sınıf *</Label>
                <Input
                  id="level"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  placeholder="Örn: 9. Sınıf"
                  required
                  data-testid="level-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_freq">Ödeme Sıklığı (Gün) *</Label>
                <Input
                  id="payment_freq"
                  type="number"
                  value={formData.payment_freq}
                  onChange={(e) => setFormData({ ...formData, payment_freq: e.target.value })}
                  required
                  data-testid="payment-freq-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_account_id">Banka Hesabı</Label>
                <Select
                  value={formData.bank_account_id}
                  onValueChange={(value) => setFormData({ ...formData, bank_account_id: value })}
                >
                  <SelectTrigger data-testid="bank-account-select">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                data-testid="notes-input"
              />
            </div>
          </div>

          {isEdit && courses.length > 0 && (
            <div className="admin-card p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Aldığı Dersler</h2>
              <div className="space-y-3">
                {courses.map((course) => {
                  const branch = branches.find(b => b.id === course.branch_id);
                  const teacher = teachers.find(t => t.id === course.teacher_id);
                  const lessonType = lessonTypes.find(lt => lt.id === course.lesson_type_id);
                  return (
                    <div key={course.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-slate-800">{branch?.name}</p>
                        <p className="text-sm text-slate-600">
                          {teacher?.name} • {lessonType?.name} • {course.price} ₺
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button
              type="submit"
              disabled={loading}
              data-testid="save-student-btn"
              className="admin-btn"
            >
              {loading ? 'Kaydediliyor...' : (isEdit ? 'Güncelle' : 'Kaydet')}
            </Button>
            <Button
              type="button"
              onClick={() => navigate('/admin/students')}
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

export default AdminStudentForm;