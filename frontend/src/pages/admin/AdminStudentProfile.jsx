import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiClient from '../../api/axios';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Edit, Book, Calendar, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const AdminStudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [groups, setGroups] = useState([]);
  const [branches, setBranches] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [lessonTypes, setLessonTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [studentRes, coursesRes, branchesRes, teachersRes, typesRes, groupsRes] = await Promise.all([
        apiClient.get(`/students/${id}`),
        apiClient.get(`/student-courses?student_id=${id}`),
        apiClient.get('/branches'),
        apiClient.get('/teachers'),
        apiClient.get('/lesson-types'),
        apiClient.get('/student-groups')
      ]);
      setStudent(studentRes.data);
      setCourses(coursesRes.data);
      setBranches(branchesRes.data);
      setTeachers(teachersRes.data);
      setLessonTypes(typesRes.data);
      
      // Find groups that include this student
      const studentGroups = groupsRes.data.filter(g => g.student_ids.includes(id));
      setGroups(studentGroups);
      
      // Fetch all lessons for all courses
      const allLessons = [];
      for (const course of coursesRes.data) {
        const lessonsRes = await apiClient.get(`/lessons?student_course_id=${course.id}`);
        allLessons.push(...lessonsRes.data.map(l => ({ ...l, course_id: course.id })));
      }
      setLessons(allLessons.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">Yükleniyor...</div>
      </AdminLayout>
    );
  }

  if (!student) {
    return (
      <AdminLayout>
        <div className="text-center py-12">Öğrenci bulunamadı</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <Button
          onClick={() => navigate('/admin/students')}
          variant="ghost"
          className="mb-4"
          data-testid="back-to-students-btn"
        >
          <ArrowLeft size={20} className="mr-2" />
          Geri Dön
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-800 mb-2" data-testid="student-profile-title">
              {student.name}
            </h1>
            <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
              {student.status === 'active' ? 'Aktif' : 'Pasif'}
            </Badge>
          </div>
          <Button
            onClick={() => navigate(`/admin/students/${id}/edit`)}
            data-testid="edit-student-btn"
            className="admin-btn"
          >
            <Edit size={20} className="mr-2" />
            Düzenle
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="admin-card p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Öğrenci Bilgileri</h2>
            <div className="space-y-3 text-slate-700">
              <div>
                <span className="text-sm text-slate-500">Veli Adı:</span>
                <p className="font-semibold">{student.parent_name}</p>
              </div>
              <div>
                <span className="text-sm text-slate-500">Telefon:</span>
                <p className="font-semibold">{student.phone}</p>
              </div>
              <div>
                <span className="text-sm text-slate-500">Sınıf:</span>
                <p className="font-semibold">{student.level}</p>
              </div>
              <div>
                <span className="text-sm text-slate-500">Ödeme Sıklığı:</span>
                <p className="font-semibold">Her {student.payment_freq} günde bir</p>
              </div>
              {student.notes && (
                <div>
                  <span className="text-sm text-slate-500">Notlar:</span>
                  <p className="font-semibold">{student.notes}</p>
                </div>
              )}
              {groups.length > 0 && (
                <div>
                  <span className="text-sm text-slate-500">Gruplar:</span>
                  <div className="mt-1">
                    {groups.map(group => (
                      <Badge key={group.id} variant="secondary" className="mr-1">
                        {group.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="admin-card p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Aldığı Dersler</h2>
            {courses.length === 0 ? (
              <p className="text-slate-600">Henüz ders eklenmemiş</p>
            ) : (
              <div className="space-y-3">
                {courses.map((course) => {
                  const branch = branches.find(b => b.id === course.branch_id);
                  const teacher = teachers.find(t => t.id === course.teacher_id);
                  const lessonType = lessonTypes.find(lt => lt.id === course.lesson_type_id);
                  const courseLessons = lessons.filter(l => l.course_id === course.id);
                  const totalLessons = courseLessons.reduce((sum, l) => sum + l.number_of_lessons, 0);
                  
                  return (
                    <div key={course.id} className="p-4 bg-slate-50 rounded-lg" data-testid={`course-${course.id}`}>
                      <p className="font-semibold text-slate-800 mb-1">{branch?.name}</p>
                      <p className="text-sm text-slate-600 mb-1">
                        {teacher?.name} • {lessonType?.name} • {course.price} ₺/ders
                      </p>
                      <p className="text-xs text-slate-500 mb-3">Toplam {totalLessons} ders yapıldı</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={() => navigate(`/admin/students/${id}/lessons/${course.id}`)}
                          data-testid={`lesson-tracking-${course.id}`}
                        >
                          <Book size={16} className="mr-1" />
                          Ders Takip
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/admin/students/${id}/planned-lessons/${course.id}`)}
                          data-testid={`lesson-planning-${course.id}`}
                        >
                          <Calendar size={16} className="mr-1" />
                          Planlama
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Ders Geçmişi */}
        <div className="admin-card p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Ders Geçmişi (Tüm Branşlar)</h2>
          {lessons.length === 0 ? (
            <p className="text-slate-600 text-center py-8">Henüz ders yapılmamış</p>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson) => {
                const course = courses.find(c => c.id === lesson.course_id);
                const branch = branches.find(b => b.id === course?.branch_id);
                return (
                  <div key={lesson.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-slate-800">{lesson.date}</p>
                      <p className="text-sm text-slate-600">
                        {branch?.name} - {lesson.number_of_lessons} ders
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-blue-600">
                        {(course?.price * lesson.number_of_lessons).toFixed(2)} ₺
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminStudentProfile;