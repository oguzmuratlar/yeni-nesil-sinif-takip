import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TeacherLayout from '../../components/layouts/TeacherLayout';
import apiClient from '../../api/axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';
import { Users, ArrowLeft, Plus, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';

const TeacherGroupPlannedLessons = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState(null);
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [plannedLessons, setPlannedLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({
    dates: '',
    number_of_lessons: 1,
    month: new Date().toISOString().substring(0, 7)
  });

  useEffect(() => {
    fetchData();
  }, [groupId]);

  const fetchData = async () => {
    try {
      const [groupsRes, studentsRes, branchesRes, plannedRes, coursesRes] = await Promise.all([
        apiClient.get('/student-groups'),
        apiClient.get('/students'),
        apiClient.get('/branches'),
        apiClient.get('/planned-lessons'),
        apiClient.get('/student-courses')
      ]);
      
      const foundGroup = groupsRes.data.find(g => g.id === groupId);
      setGroup(foundGroup);
      setStudents(studentsRes.data);
      setBranches(branchesRes.data);
      
      // Filter planned lessons for students in this group
      if (foundGroup) {
        const groupStudentIds = foundGroup.student_ids || [];
        const groupCourseIds = coursesRes.data
          .filter(c => groupStudentIds.includes(c.student_id) && c.branch_id === foundGroup.branch_id)
          .map(c => c.id);
        
        const groupPlanned = plannedRes.data.filter(p => groupCourseIds.includes(p.student_course_id));
        setPlannedLessons(groupPlanned);
      }
    } catch (error) {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlan = async () => {
    if (!newPlan.dates || !newPlan.number_of_lessons || !newPlan.month) {
      toast.error('Tüm alanları doldurun');
      return;
    }

    try {
      await apiClient.post('/group-planned-lessons', {
        group_id: groupId,
        dates: newPlan.dates,
        number_of_lessons: newPlan.number_of_lessons,
        month: newPlan.month
      });
      
      toast.success(`Grup planlaması eklendi - ${group.student_ids?.length || 0} öğrenciye kaydedildi`);
      setDialogOpen(false);
      setNewPlan({ dates: '', number_of_lessons: 1, month: new Date().toISOString().substring(0, 7) });
      fetchData();
    } catch (error) {
      toast.error('Planlama eklenemedi');
    }
  };

  const branch = group ? branches.find(b => b.id === group.branch_id) : null;
  const groupStudentsList = group ? students.filter(s => group.student_ids?.includes(s.id)) : [];

  // Group planned lessons by month
  const plansByMonth = plannedLessons.reduce((acc, plan) => {
    if (!acc[plan.month]) {
      acc[plan.month] = [];
    }
    acc[plan.month].push(plan);
    return acc;
  }, {});

  if (loading) {
    return (
      <TeacherLayout>
        <div className="text-center py-12">
          <p className="text-stone-600">Yükleniyor...</p>
        </div>
      </TeacherLayout>
    );
  }

  if (!group) {
    return (
      <TeacherLayout>
        <div className="text-center py-12">
          <p className="text-stone-600">Grup bulunamadı</p>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/teacher/students')}
            className="mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Geri
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
              <Calendar size={32} className="text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800">{group.name} - Ders Planı</h1>
              <p className="text-slate-600">
                {branch?.name} • {group.level}. Sınıf • {groupStudentsList.length} öğrenci
              </p>
            </div>
          </div>
        </div>

        {/* Group Students */}
        <div className="teacher-card p-6 mb-6">
          <h2 className="text-lg font-bold text-slate-800 mb-3">Gruptaki Öğrenciler</h2>
          <div className="flex flex-wrap gap-2">
            {groupStudentsList.map(s => (
              <span key={s.id} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                {s.name}
              </span>
            ))}
          </div>
          <p className="text-sm text-slate-500 mt-3">
            Grup için ders planladığınızda, yukarıdaki tüm öğrencilere otomatik kaydedilir.
          </p>
        </div>

        {/* Add Plan Button */}
        <div className="flex justify-end mb-6">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="teacher-btn">
                <Plus size={20} className="mr-2" />
                Grup Planı Ekle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Grup Ders Planı Ekle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Ay</Label>
                  <Input
                    type="month"
                    value={newPlan.month}
                    onChange={(e) => setNewPlan({ ...newPlan, month: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tarihler</Label>
                  <Textarea
                    placeholder="Örn: 5, 12, 19, 26 veya 5 Mart, 12 Mart..."
                    value={newPlan.dates}
                    onChange={(e) => setNewPlan({ ...newPlan, dates: e.target.value })}
                    rows={3}
                  />
                  <p className="text-xs text-slate-500">Tarihleri virgülle ayırarak yazın</p>
                </div>
                <div className="space-y-2">
                  <Label>Ders Sayısı (her tarih için)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newPlan.number_of_lessons}
                    onChange={(e) => setNewPlan({ ...newPlan, number_of_lessons: parseInt(e.target.value) })}
                  />
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-sm text-purple-700">
                    Bu plan <strong>{groupStudentsList.length} öğrenciye</strong> kaydedilecek.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleAddPlan} className="flex-1">Kaydet</Button>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Planned Lessons List */}
        <div className="teacher-card p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Planlı Dersler</h2>
          
          {Object.keys(plansByMonth).length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">Henüz planlama yapılmamış</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(plansByMonth).sort((a, b) => b[0].localeCompare(a[0])).map(([month, plans]) => (
                <div key={month} className="border-b pb-4">
                  <h3 className="font-semibold text-slate-800 mb-3">{month}</h3>
                  <div className="space-y-2">
                    {plans.map(plan => (
                      <div key={plan.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <div className="flex flex-wrap gap-1 mb-1">
                            {plan.dates.split(',').map((d, i) => (
                              <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                {d.trim()}
                              </span>
                            ))}
                          </div>
                          <p className="text-sm text-slate-600">{plan.number_of_lessons} ders</p>
                        </div>
                        {plan.messaged && (
                          <span className="text-xs text-green-600">✓ Mesaj gönderildi</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
};

export default TeacherGroupPlannedLessons;
