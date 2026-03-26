import React, { useState, useEffect } from 'react';
import TeacherLayout from '../../components/layouts/TeacherLayout';
import apiClient from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Filter, BookOpen, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { formatDateTurkish } from '../../lib/dateUtils';

const TeacherSchedule = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [plannedLessons, setPlannedLessons] = useState([]);
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));

  const months = [
    { value: '2024-12', label: 'Aralık 2024' },
    { value: '2025-01', label: 'Ocak 2025' },
    { value: '2025-02', label: 'Şubat 2025' },
    { value: '2025-03', label: 'Mart 2025' },
    { value: '2025-04', label: 'Nisan 2025' },
    { value: '2025-05', label: 'Mayıs 2025' },
    { value: '2025-06', label: 'Haziran 2025' },
    { value: '2026-01', label: 'Ocak 2026' },
    { value: '2026-02', label: 'Şubat 2026' },
    { value: '2026-03', label: 'Mart 2026' },
    { value: '2026-04', label: 'Nisan 2026' },
  ];

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user?.teacher_id) return;
    
    setLoading(true);
    try {
      const [plannedRes, studentsRes, branchesRes, coursesRes, groupsRes] = await Promise.all([
        apiClient.get('/planned-lessons'),
        apiClient.get('/students'),
        apiClient.get('/branches'),
        apiClient.get('/student-courses'),
        apiClient.get('/student-groups')
      ]);
      
      setStudents(studentsRes.data);
      setBranches(branchesRes.data);
      setCourses(coursesRes.data);
      setGroups(groupsRes.data);
      
      // Öğretmene ait kursları filtrele
      const teacherCourseIds = coursesRes.data
        .filter(c => c.teacher_id === user.teacher_id)
        .map(c => c.id);
      
      // Öğretmene ait planlı dersleri filtrele
      const teacherPlanned = plannedRes.data.filter(p => 
        teacherCourseIds.includes(p.student_course_id)
      );
      
      setPlannedLessons(teacherPlanned);
    } catch (error) {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // Seçili aya göre filtrele
  const filteredLessons = plannedLessons.filter(p => p.month === selectedMonth);

  // Aylık istatistikleri hesapla - Doğru formül:
  // Birebir: ders sayısı x öğretmen ücreti
  // Grup: ders sayısı x grup ücreti (grup ücreti = price alanı)
  const calculateStats = () => {
    let totalLessons = 0;
    let estimatedEarning = 0;
    
    // Önce benzersiz planları bul (grup dersleri için çoklama var)
    const processedGroupPlans = new Set();
    
    filteredLessons.forEach(plan => {
      const course = courses.find(c => c.id === plan.student_course_id);
      if (!course) return;
      
      const student = students.find(s => s.id === course.student_id);
      const group = groups.find(g => 
        g.student_ids?.includes(course.student_id) && g.branch_id === course.branch_id
      );
      
      // Grup dersi mi kontrol et
      if (group) {
        // Bu grup için zaten hesaplama yaptık mı?
        const groupPlanKey = `${group.id}-${plan.month}-${plan.dates}`;
        if (!processedGroupPlans.has(groupPlanKey)) {
          processedGroupPlans.add(groupPlanKey);
          // Grup dersi: sadece bir kez sayılır (öğretmen için)
          totalLessons += plan.number_of_lessons;
          estimatedEarning += plan.number_of_lessons * (course.price || 0);
        }
      } else {
        // Birebir ders
        totalLessons += plan.number_of_lessons;
        estimatedEarning += plan.number_of_lessons * (course.price || 0);
      }
    });
    
    return { totalLessons, estimatedEarning };
  };

  const stats = calculateStats();

  // Planları öğrencilere göre grupla
  const getEnrichedPlans = () => {
    return filteredLessons.map(plan => {
      const course = courses.find(c => c.id === plan.student_course_id);
      const student = course ? students.find(s => s.id === course.student_id) : null;
      const branch = course ? branches.find(b => b.id === course.branch_id) : null;
      const group = course ? groups.find(g => 
        g.student_ids?.includes(course.student_id) && g.branch_id === course.branch_id
      ) : null;
      
      return {
        ...plan,
        course,
        student,
        branch,
        group,
        totalLessons: plan.number_of_lessons,
        earning: course ? (plan.number_of_lessons * (course.price || 0)) : 0
      };
    }).sort((a, b) => (a.student?.name || '').localeCompare(b.student?.name || ''));
  };

  const enrichedPlans = getEnrichedPlans();

  // Grup ve birebir ayrımı
  const groupPlans = enrichedPlans.filter(p => p.group);
  const individualPlans = enrichedPlans.filter(p => !p.group);

  // Unique gruplar (aynı grup için sadece bir kez göster)
  const uniqueGroups = [];
  const seenGroups = new Set();
  groupPlans.forEach(p => {
    if (p.group) {
      const groupPlanKey = `${p.group.id}-${p.month}-${p.dates}`;
      if (!seenGroups.has(groupPlanKey)) {
        seenGroups.add(groupPlanKey);
        uniqueGroups.push({
          ...p,
          totalGroupLessons: p.number_of_lessons,
          groupEarning: p.number_of_lessons * (p.course?.price || 0)
        });
      }
    }
  });

  if (loading) {
    return (
      <TeacherLayout>
        <div className="text-center py-12">
          <p className="text-stone-600">Yükleniyor...</p>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <Calendar size={32} className="text-blue-600" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-800 mb-2" data-testid="teacher-schedule-title">
            Ders Programım
          </h1>
          <p className="text-stone-600">Planlanan derslerinizi görüntüleyin</p>
        </div>

        {/* Ay Filtresi */}
        <div className="teacher-card p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter size={18} className="text-stone-500" />
            <span className="text-sm font-medium text-stone-700">Ay:</span>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Ay seçin" />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Özet Kartları */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="teacher-card p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <BookOpen size={20} className="text-blue-600" />
              <p className="text-sm text-stone-500">Toplam Planlı Ders</p>
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats.totalLessons}</p>
          </div>
          <div className="teacher-card p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp size={20} className="text-green-600" />
              <p className="text-sm text-stone-500">Tahmini Kazanç</p>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.estimatedEarning.toFixed(0)} ₺</p>
          </div>
        </div>

        {/* Grup Dersleri */}
        {uniqueGroups.length > 0 && (
          <div className="teacher-card p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Users size={20} className="text-purple-600" />
              <h2 className="text-xl font-bold text-slate-800">Grup Dersleri</h2>
            </div>
            <div className="space-y-3">
              {uniqueGroups.map((plan, idx) => (
                <div key={idx} className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-800">{plan.group?.name}</h3>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary">{plan.branch?.name}</Badge>
                        <Badge variant="outline">{plan.group?.student_ids?.length || 0} öğrenci</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {plan.dates.split(',').map((d, i) => (
                          <span key={i} className="text-xs bg-white text-purple-700 px-2 py-0.5 rounded border">
                            {d.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-stone-500">{plan.totalGroupLessons} ders</p>
                      <p className="text-lg font-bold text-green-600">{plan.groupEarning.toFixed(0)} ₺</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Birebir Dersler */}
        {individualPlans.length > 0 && (
          <div className="teacher-card p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={20} className="text-blue-600" />
              <h2 className="text-xl font-bold text-slate-800">Birebir Dersler</h2>
            </div>
            <div className="space-y-3">
              {individualPlans.map((plan, idx) => (
                <div key={idx} className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-800">{plan.student?.name || 'Bilinmiyor'}</h3>
                      <Badge variant="secondary" className="mt-1">{plan.branch?.name}</Badge>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {plan.dates.split(',').map((d, i) => (
                          <span key={i} className="text-xs bg-white text-blue-700 px-2 py-0.5 rounded border">
                            {d.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-stone-500">{plan.totalLessons} ders</p>
                      <p className="text-lg font-bold text-green-600">{plan.earning.toFixed(0)} ₺</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Boş durum */}
        {filteredLessons.length === 0 && (
          <div className="teacher-card p-12 text-center">
            <Calendar size={48} className="mx-auto mb-4 text-stone-300" />
            <p className="text-stone-600">Bu ay için planlı ders bulunmuyor</p>
            <p className="text-sm text-stone-500 mt-2">
              Öğrencilerinizin profillerinden ders planlayabilirsiniz
            </p>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};

export default TeacherSchedule;
