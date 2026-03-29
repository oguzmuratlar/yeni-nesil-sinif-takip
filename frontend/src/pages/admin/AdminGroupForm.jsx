import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiClient from '../../api/axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { toast } from 'sonner';
import { Search } from 'lucide-react';

const AdminGroupForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    branch_id: '',
    level: '',
    teacher_id: '',
    student_ids: []
  });
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReferenceData();
    if (isEdit) {
      fetchGroup();
    }
  }, [id]);

  const fetchReferenceData = async () => {
    try {
      const [studentsRes, branchesRes, teachersRes] = await Promise.all([
        apiClient.get('/students'),
        apiClient.get('/branches'),
        apiClient.get('/teachers')
      ]);
      // Sadece aktif öğrencileri listele
      setStudents(studentsRes.data.filter(s => s.status === 'active'));
      setBranches(branchesRes.data);
      setTeachers(teachersRes.data.filter(t => t.status === 'active'));
    } catch (error) {
      toast.error('Veriler yüklenemedi');
    }
  };

  const fetchGroup = async () => {
    try {
      const response = await apiClient.get('/student-groups');
      const group = response.data.find(g => g.id === id);
      if (group) {
        setFormData({
          name: group.name || '',
          branch_id: group.branch_id || '',
          level: group.level || '',
          teacher_id: group.teacher_id || '',
          student_ids: group.student_ids || []
        });
      }
    } catch (error) {
      toast.error('Grup bilgileri yüklenemedi');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        await apiClient.put(`/student-groups/${id}`, formData);
        toast.success('Grup güncellendi');
      } else {
        await apiClient.post('/student-groups', formData);
        toast.success('Grup oluşturuldu');
      }
      navigate('/admin/groups');
    } catch (error) {
      toast.error(isEdit ? 'Güncelleme başarısız' : 'Oluşturma başarısız');
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (studentId) => {
    if (formData.student_ids.includes(studentId)) {
      setFormData({
        ...formData,
        student_ids: formData.student_ids.filter(id => id !== studentId)
      });
    } else {
      setFormData({
        ...formData,
        student_ids: [...formData.student_ids, studentId]
      });
    }
  };

  // İsme göre filtreleme
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-slate-800 mb-2" data-testid="group-form-title">
            {isEdit ? 'Grubu Düzenle' : 'Yeni Grup Oluştur'}
          </h1>
          <p className="text-slate-600">Grup bilgilerini girin ve öğrencileri seçin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="admin-card p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Grup Adı *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Örn: 8. Sınıf Matematik A Grubu"
                required
                data-testid="group-name-input"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="branch">Branş *</Label>
                <Select value={formData.branch_id || 'none'} onValueChange={(value) => setFormData({ ...formData, branch_id: value === 'none' ? '' : value })}>
                  <SelectTrigger data-testid="branch-select">
                    <SelectValue placeholder="Branş seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Branş seçin</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Sınıf *</Label>
                <Select value={formData.level ? String(formData.level) : 'none'} onValueChange={(value) => setFormData({ ...formData, level: value === 'none' ? '' : value })}>
                  <SelectTrigger data-testid="level-select">
                    <SelectValue placeholder="Sınıf seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sınıf seçin</SelectItem>
                    <SelectItem value="5">5. Sınıf</SelectItem>
                    <SelectItem value="6">6. Sınıf</SelectItem>
                    <SelectItem value="7">7. Sınıf</SelectItem>
                    <SelectItem value="8">8. Sınıf</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="teacher">Öğretmen (Opsiyonel)</Label>
              <Select value={formData.teacher_id || 'none'} onValueChange={(value) => setFormData({ ...formData, teacher_id: value === 'none' ? '' : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Öğretmen seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Seçilmedi</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="admin-card p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                Öğrenciler ({formData.student_ids.length} seçildi)
              </h3>
            </div>
            
            {/* Arama */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input
                type="text"
                placeholder="Öğrenci adına göre ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="student-search-input"
              />
            </div>
            
            {/* Seçilen öğrenci sayısı */}
            {formData.student_ids.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>{formData.student_ids.length}</strong> öğrenci seçildi
                  {formData.student_ids.length > 4 && (
                    <span className="text-orange-600 ml-2">
                      (4+ öğrenci: Öğretmen geliri 4 kişi üzerinden hesaplanacak)
                    </span>
                  )}
                </p>
              </div>
            )}
            
            {/* Öğrenci listesi */}
            <div className="space-y-1 max-h-80 overflow-y-auto border rounded-lg">
              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  {searchTerm ? 'Arama sonucu bulunamadı' : 'Aktif öğrenci yok'}
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <div 
                    key={student.id} 
                    className={`flex items-center space-x-3 p-3 hover:bg-slate-50 cursor-pointer border-b last:border-b-0 ${
                      formData.student_ids.includes(student.id) ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => toggleStudent(student.id)}
                  >
                    <Checkbox
                      id={`student-${student.id}`}
                      checked={formData.student_ids.includes(student.id)}
                      onCheckedChange={() => toggleStudent(student.id)}
                    />
                    <Label htmlFor={`student-${student.id}`} className="flex-1 cursor-pointer font-normal">
                      <span className="font-semibold">{student.name}</span>
                      <span className="text-sm text-slate-600 ml-2">({student.level}. Sınıf)</span>
                    </Label>
                  </div>
                ))
              )}
            </div>
            
            <p className="text-xs text-slate-500 mt-2">
              Sadece aktif öğrenciler listelenir. Pasif öğrencileri görmek için öğrenci sayfasından aktifleştirin.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              type="submit"
              disabled={loading}
              data-testid="save-group-btn"
              className="admin-btn"
            >
              {loading ? 'Kaydediliyor...' : (isEdit ? 'Güncelle' : 'Oluştur')}
            </Button>
            <Button
              type="button"
              onClick={() => navigate('/admin/groups')}
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

export default AdminGroupForm;
