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
    date: '',
    number_of_lessons: 1,
    month: '',
    messaged: false,
    payment_status: 'pending'
  });

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
    try {
      await apiClient.post('/planned-lessons', {
        student_course_id: courseId,
        ...newPlanned
      });
      toast.success('Planlanmış ders eklendi');
      setDialogOpen(false);
      setNewPlanned({ date: '', number_of_lessons: 1, month: '', messaged: false, payment_status: 'pending' });
      fetchData();
    } catch (error) {
      toast.error('Ders planlanamadı');
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
                    <Label htmlFor="date">Tarih</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newPlanned.date}
                      onChange={(e) => setNewPlanned({ ...newPlanned, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="month">Ay</Label>
                    <Input
                      id="month"
                      type="month"
                      value={newPlanned.month}
                      onChange={(e) => setNewPlanned({ ...newPlanned, month: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="number">Ders Adedi</Label>
                    <Input
                      id="number"
                      type="number"
                      min="1"
                      value={newPlanned.number_of_lessons}
                      onChange={(e) => setNewPlanned({ ...newPlanned, number_of_lessons: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_status">Ödeme Durumu</Label>
                    <Select value={newPlanned.payment_status} onValueChange={(value) => setNewPlanned({ ...newPlanned, payment_status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Bekliyor</SelectItem>
                        <SelectItem value="paid">Ödendi</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <p className="font-semibold text-slate-800 text-lg">{planned.date} ({planned.month})</p>
                    <p className="text-sm text-stone-600">
                      {planned.number_of_lessons} ders • 
                      {planned.payment_status === 'paid' ? ' Ödendi' : ' Bekliyor'}
                    </p>
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