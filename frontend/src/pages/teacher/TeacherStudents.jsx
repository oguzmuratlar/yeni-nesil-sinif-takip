import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from '../../components/layouts/TeacherLayout';
import apiClient from '../../api/axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Book, Calendar, Search, User } from 'lucide-react';
import { toast } from 'sonner';

const TeacherStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await apiClient.get('/students');
      setStudents(response.data);
    } catch (error) {
      toast.error('Öğrenciler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <TeacherLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-3" data-testid="teacher-students-title">
            Öğrencilerim
          </h1>
          <p className="text-lg text-stone-600">
            Öğrencilerinizin ders takibini yapın
          </p>
        </div>

        <div className="teacher-card p-8 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
            <Input
              type="text"
              placeholder="Öğrenci adı ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="student-search-input"
              className="pl-12 h-14 text-base"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-stone-600">Yükleniyor...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="teacher-card p-12 text-center">
            <p className="text-stone-600">Henüz öğrenciniz yok</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                data-testid={`student-card-${student.id}`}
                className="teacher-card p-8 cursor-pointer"
                onClick={() => setSelectedStudent(student)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">{student.name}</h3>
                    <div className="flex items-center gap-4 text-stone-600">
                      <span>Sınıf: {student.level}</span>
                      <span>•</span>
                      <span>Veli: {student.parent_name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/teacher/students/${student.id}/profile`);
                      }}
                      data-testid={`view-student-${student.id}`}
                      variant="outline"
                      className="rounded-full"
                    >
                      <User size={18} className="mr-1" />
                      Profil
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Student Actions */}
        {selectedStudent && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 shadow-lg p-6 z-20">
            <div className="container mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-500 mb-1">Seçili Öğrenci</p>
                  <p className="font-bold text-slate-800 text-lg">{selectedStudent.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => navigate(`/teacher/students/${selectedStudent.id}/profile`)}
                    data-testid="lesson-entry-btn"
                    className="teacher-btn"
                  >
                    <Book size={20} className="mr-2" />
                    Ders Takip
                  </Button>
                  <Button
                    onClick={() => navigate(`/teacher/students/${selectedStudent.id}/profile`)}
                    data-testid="lesson-planning-btn"
                    variant="outline"
                    className="rounded-full px-8 py-3"
                  >
                    <Calendar size={20} className="mr-2" />
                    Ders Planlama
                  </Button>
                  <Button
                    onClick={() => setSelectedStudent(null)}
                    variant="outline"
                    data-testid="cancel-selection-btn"
                    className="rounded-full"
                  >
                    İptal
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};

export default TeacherStudents;