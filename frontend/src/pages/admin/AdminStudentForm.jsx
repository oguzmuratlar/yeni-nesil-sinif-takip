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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';

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
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({
    teacher_id: '',
    branch_id: '',
    lesson_type_id: '',
    price: ''
  });

  useEffect(() => {
    fetchReferenceData();
    if (isEdit) {
      fetchStudent();
      fetchCourses();
    }
  }, [id]);

  const fetchStudent = async () => {
    try {
      const response = await apiClient.get(`/students/${id}`);
      setFormData({
        name: response.data.name,
        parent_name: response.data.parent_name,
        phone: response.data.phone,
        level: response.data.level,
        payment_freq: response.data.payment_freq,
        notes: response.data.notes || '',
        bank_account_id: response.data.bank_account_id || ''
      });
    } catch (error) {
      toast.error('Öğrenci bilgileri yüklenemedi');
    }
  };

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
      setFormData({
        name: response.data.name,
        parent_name: response.data.parent_name,
        phone: response.data.phone,
        level: response.data.level,
        payment_freq: response.data.payment_freq,
        notes: response.data.notes || '',
        bank_account_id: response.data.bank_account_id || ''
      });
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
        const response = await apiClient.post('/students', formData);
        const studentId = response.data.id;
        
        // Add courses if any
        for (const course of courses) {
          await apiClient.post('/student-courses', {
            student_id: studentId,
            ...course
          });
        }
        
        toast.success('Öğrenci eklendi');
      }
      navigate('/admin/students');
    } catch (error) {
      toast.error(isEdit ? 'Güncelleme başarısız' : 'Ekleme başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = () => {
    if (!newCourse.teacher_id || !newCourse.branch_id || !newCourse.lesson_type_id || !newCourse.price) {
      toast.error('Tüm alanları doldurun');
      return;
    }
    
    setCourses([...courses, { ...newCourse, price: parseFloat(newCourse.price) }]);
    setNewCourse({ teacher_id: '', branch_id: '', lesson_type_id: '', price: '' });
    setCourseDialogOpen(false);
    toast.success('Ders eklendi');
  };

  const handleRemoveCourse = (index) => {
    setCourses(courses.filter((_, i) => i !== index));
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
                <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                  <SelectTrigger data-testid="level-select">
                    <SelectValue placeholder="Sınıf seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5. Sınıf</SelectItem>
                    <SelectItem value="6">6. Sınıf</SelectItem>
                    <SelectItem value="7">7. Sınıf</SelectItem>
                    <SelectItem value="8">8. Sınıf</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_freq">Ödeme Günü *</Label>
                <Input
                  id="payment_freq"
                  type="number"
                  value={formData.payment_freq}
                  onChange={(e) => setFormData({ ...formData, payment_freq: e.target.value })}
                  placeholder="Örn: 1, 15"
                  required
                  data-testid="payment-freq-input"
                />
                <p className="text-xs text-slate-500">Ayın kaçında ödeme yapacak (1-31 arası)</p>
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

          {!isEdit && (
            <div className="admin-card p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800">Alacağı Dersler</h2>
                <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" data-testid="add-course-btn">
                      <Plus size={16} className="mr-2" />
                      Ders Ekle
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Yeni Ders Ekle</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Branş *</Label>
                        <Select value={newCourse.branch_id} onValueChange={(value) => setNewCourse({ ...newCourse, branch_id: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Branş seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {branches.map((branch) => (
                              <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Öğretmen *</Label>
                        <Select value={newCourse.teacher_id} onValueChange={(value) => setNewCourse({ ...newCourse, teacher_id: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Öğretmen seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {teachers.map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Ders Tipi *</Label>
                        <Select value={newCourse.lesson_type_id} onValueChange={(value) => setNewCourse({ ...newCourse, lesson_type_id: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Ders tipi seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {lessonTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Ders Ücreti (₺) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newCourse.price}
                          onChange={(e) => setNewCourse({ ...newCourse, price: e.target.value })}
                          placeholder="250"
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button type="button" onClick={handleAddCourse} className="flex-1">Ekle</Button>
                        <Button type="button" variant="outline" onClick={() => setCourseDialogOpen(false)}>İptal</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              {courses.length > 0 && (
                <div className="space-y-3">
                  {courses.map((course, index) => {
                    const branch = branches.find(b => b.id === course.branch_id);
                    const teacher = teachers.find(t => t.id === course.teacher_id);
                    const lessonType = lessonTypes.find(lt => lt.id === course.lesson_type_id);
                    return (
                      <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-slate-800">{branch?.name}</p>
                          <p className="text-sm text-slate-600">
                            {teacher?.name} • {lessonType?.name} • {course.price} ₺
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveCourse(index)}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {courses.length === 0 && (
                <p className="text-slate-600 text-center py-8">Henüz ders eklenmemiş. Yukarıdaki butonu kullanarak ders ekleyin.</p>
              )}
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