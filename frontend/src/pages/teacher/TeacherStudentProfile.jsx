import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TeacherLayout from '../../components/layouts/TeacherLayout';
import apiClient from '../../api/axios';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft, Book, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const TeacherStudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [lessonTypes, setLessonTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [studentRes, coursesRes, branchesRes, teachersRes, typesRes] = await Promise.all([
        apiClient.get(`/students/${id}`),
        apiClient.get(`/student-courses?student_id=${id}`),
        apiClient.get('/branches'),
        apiClient.get('/teachers'),
        apiClient.get('/lesson-types')
      ]);
      setStudent(studentRes.data);
      setCourses(coursesRes.data);
      setBranches(branchesRes.data);
      setTeachers(teachersRes.data);
      setLessonTypes(typesRes.data);
    } catch (error) {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div className="text-center py-12">Yükleniyor...</div>
      </TeacherLayout>
    );
  }

  if (!student) {
    return (
      <TeacherLayout>
        <div className="text-center py-12">Öğrenci bulunamadı</div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="max-w-5xl mx-auto">
        <Button
          onClick={() => navigate('/teacher/students')}
          variant="ghost"
          className="mb-6 rounded-full"
          data-testid="back-to-students-btn"
        >
          <ArrowLeft size={20} className="mr-2" />
          Geri Dön
        </Button>

        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-slate-800 mb-3" data-testid="student-profile-title">
            {student.name}
          </h1>
          <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
            {student.status === 'active' ? 'Aktif' : 'Pasif'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="teacher-card p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Öğrenci Bilgileri</h2>
            <div className="space-y-4 text-stone-700">
              <div>
                <span className="text-sm text-stone-500 block mb-1">Veli Adı</span>
                <p className="font-semibold text-lg">{student.parent_name}</p>
              </div>
              <div>
                <span className="text-sm text-stone-500 block mb-1">Telefon</span>
                <p className="font-semibold text-lg">{student.phone}</p>
              </div>
              <div>
                <span className="text-sm text-stone-500 block mb-1">Sınıf</span>
                <p className="font-semibold text-lg">{student.level}</p>
              </div>
              {student.notes && (
                <div>
                  <span className="text-sm text-stone-500 block mb-1">Notlar</span>
                  <p className="font-semibold">{student.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="teacher-card p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Aldığı Dersler</h2>
            {courses.length === 0 ? (
              <p className="text-stone-600">Henüz ders eklenmemiş</p>
            ) : (
              <div className="space-y-4">
                {courses.map((course) => {
                  const branch = branches.find(b => b.id === course.branch_id);
                  const teacher = teachers.find(t => t.id === course.teacher_id);
                  const lessonType = lessonTypes.find(lt => lt.id === course.lesson_type_id);
                  return (
                    <div key={course.id} className="p-4 bg-stone-50 rounded-xl" data-testid={`course-${course.id}`}>
                      <p className="font-semibold text-slate-800 mb-2 text-lg">{branch?.name}</p>
                      <p className="text-sm text-stone-600 mb-4">
                        {teacher?.name} • {lessonType?.name} • {course.price} ₺/ders
                      </p>
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          className="rounded-full"
                          onClick={() => navigate(`/teacher/students/${id}/lessons/${course.id}`)}
                          data-testid={`lesson-tracking-${course.id}`}
                        >
                          <Book size={16} className="mr-1" />
                          Ders Takip
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => navigate(`/teacher/students/${id}/planned-lessons/${course.id}`)}
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
      </div>
    </TeacherLayout>
  );
};

export default TeacherStudentProfile;