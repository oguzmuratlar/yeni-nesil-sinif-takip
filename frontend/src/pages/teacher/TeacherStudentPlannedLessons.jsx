import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TeacherLayout from '../../components/layouts/TeacherLayout';
import apiClient from '../../api/axios';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const TeacherStudentPlannedLessons = () => {
  const { id, courseId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [plannedLessons, setPlannedLessons] = useState([]);
  const [branch, setBranch] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPlanned, setNewPlanned] = useState({
    dates: '',
    number_of_lessons: '',
    month: new Date().toISOString().substring(0, 7),
    messaged: false
  });

  const months = [
    { value: '2025-01', label: 'Ocak 2025' },
    { value: '2025-02', label: 'Şubat 2025' },
    { value: '2025-03', label: 'Mart 2025' },
    { value: '2025-04', label: 'Nisan 2025' },
    { value: '2025-05', label: 'Mayıs 2025' },
    { value: '2025-06', label: 'Haziran 2025' },
    { value: '2025-09', label: 'Eylül 2025' },
    { value: '2025-10', label: 'Ekim 2025' },
    { value: '2025-11', label: 'Kasım 2025' },
    { value: '2025-12', label: 'Aralık 2025' },
    { value: '2026-01', label: 'Ocak 2026' },
    { value: '2026-02', label: 'Şubat 2026' },
    { value: '2026-03', label: 'Mart 2026' },
    { value: '2026-04', label: 'Nisan 2026' },
    { value: '2026-05', label: 'Mayıs 2026' },
    { value: '2026-06', label: 'Haziran 2026' },
  ];

  useEffect(() => {
    fetchData();
  }, [id, courseId]);

  const fetchData = async () => {
    try {
      const [studentRes, courseRes, plannedRes, branchesRes] = await Promise.all([
        apiClient.get(`/students/${id}`),
        apiClient.get(`/student-courses?student_id=${id}`),
        apiClient.get(`/planned-lessons?student_course_id=${courseId}`),
        apiClient.get('/branches')
      ]);
      setStudent(studentRes.data);
      const foundCourse = courseRes.data.find(c => c.id === courseId);
      if (foundCourse) {
        const foundBranch = branchesRes.data.find(b => b.id === foundCourse.branch_id);
        setBranch(foundBranch);
      }
      setPlannedLessons(plannedRes.data);
    } catch (error) {
      toast.error('Veriler yüklenemedi');
    }
  };

  const handleAddPlanned = async (e) => {
    e.preventDefault();
    if (!newPlanned.dates || !newPlanned.number_of_lessons || !newPlanned.month) {
      toast.error('Tüm alanları doldurun');
      return;
    }
    try {
      await apiClient.post('/planned-lessons', {
        student_course_id: courseId,
        dates: newPlanned.dates,
        number_of_lessons: parseInt(newPlanned.number_of_lessons),
        month: newPlanned.month,
        messaged: false
      });
      toast.success('Planlanmış ders eklendi');
      setDialogOpen(false);
      setNewPlanned({ dates: '', number_of_lessons: '', month: new Date().toISOString().substring(0, 7), messaged: false });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Ders planlanamadı');
    }
  };

  const handleDeletePlanned = async (plannedId) => {
    if (!window.confirm('Bu planlanmış dersi silmek istediğinizden emin misiniz?')) return;
    try {
      await apiClient.delete(`/planned-lessons/${plannedId}`);
      toast.success('Planlanmış ders silindi');
      fetchData();
    } catch (error) {
      toast.error('Silinemedi');
    }
  };

  return (
    <TeacherLayout>
      <div className="max-w-5xl mx-auto">
        <Button
          onClick={() => navigate(`/teacher/students/${id}/profile`)}
          variant="ghost"
          className="mb-6 rounded-full"
        >
          <ArrowLeft size={20} className="mr-2" />
          Geri Dön
        </Button>

        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-slate-800 mb-2">
            Ders Planlama - {student?.name}
          </h1>
          <p className="text-lg text-stone-600">{branch?.name}</p>
        </div>

        <div className="teacher-card p-8 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">Planlanmış Dersler</h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="add-planned-lesson-btn" className="teacher-btn">
                  <Plus size={20} className="mr-2" />
                  Ders Planla
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yeni Ders Planla</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddPlanned} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Ay *</Label>
                    <Select value={newPlanned.month} onValueChange={(val) => setNewPlanned({ ...newPlanned, month: val })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Ay seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map(m => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dates">Tarihler *</Label>
                    <Input
                      id="dates"
                      type="text"
                      value={newPlanned.dates}
                      onChange={(e) => setNewPlanned({ ...newPlanned, dates: e.target.value })}
                      placeholder="Örn: 3-10-17-24"
                    />
                    <p className="text-xs text-slate-500">Tarihleri istediğiniz formatta yazın</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="number">Toplam Ders Sayısı *</Label>
                    <Input
                      id="number"
                      type="number"
                      min="1"
                      placeholder="Örn: 8"
                      value={newPlanned.number_of_lessons}
                      onChange={(e) => setNewPlanned({ ...newPlanned, number_of_lessons: e.target.value })}
                    />
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Bu plan admin aylık programında görünecektir.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" className="flex-1 teacher-btn">Kaydet</Button>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-full">İptal</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="teacher-card p-8">
          {plannedLessons.length === 0 ? (
            <p className="text-stone-600 text-center py-12">Henüz ders planlanmamış</p>
          ) : (
            <div className="space-y-4">
              {plannedLessons.map((planned) => (
                <div key={planned.id} className="flex items-center justify-between p-6 bg-stone-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-slate-800 text-lg">{planned.dates} ({planned.month})</p>
                    <p className="text-sm text-stone-600">{planned.number_of_lessons} ders</p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeletePlanned(planned.id)}
                    className="rounded-full"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
};

export default TeacherStudentPlannedLessons;