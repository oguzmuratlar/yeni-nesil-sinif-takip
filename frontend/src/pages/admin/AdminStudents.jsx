import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiClient from '../../api/axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Plus, Search, Book, Calendar } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, [showInactive]);

  const fetchStudents = async () => {
    try {
      const response = await apiClient.get('/students');
      const filtered = showInactive 
        ? response.data 
        : response.data.filter(s => s.status === 'active');
      setStudents(filtered);
    } catch (error) {
      toast.error('Öğrenciler yüklenemedi');
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStudentStatus = async (studentId, currentStatus) => {
    try {
      const student = students.find(s => s.id === studentId);
      await apiClient.put(`/students/${studentId}`, {
        ...student,
        status: currentStatus === 'active' ? 'inactive' : 'active'
      });
      toast.success(currentStatus === 'active' ? 'Öğrenci pasifleştirildi' : 'Öğrenci aktifleştirildi');
      fetchStudents();
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.parent_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-800 mb-2" data-testid="admin-students-title">
              Öğrenciler
            </h1>
            <p className="text-slate-600">Tüm öğrencilerinizi görüntüleyin ve yönetin</p>
          </div>
          <Button
            onClick={() => navigate('/admin/students/new')}
            data-testid="add-student-btn"
            className="admin-btn"
          >
            <Plus size={20} className="mr-2" />
            Öğrenci Ekle
          </Button>
        </div>

        <div className="admin-card p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 mr-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <Input
                type="text"
                placeholder="Öğrenci veya veli adı ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="student-search-input"
                className="pl-10 h-12"
              />
            </div>
            <Button
              onClick={() => setShowInactive(!showInactive)}
              variant={showInactive ? "default" : "outline"}
              data-testid="toggle-inactive-btn"
            >
              {showInactive ? 'Sadece Aktifler' : 'Pasifleri Göster'}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Yükleniyor...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="admin-card p-12 text-center">
            <p className="text-slate-600">Henüz öğrenci eklenmemiş</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                data-testid={`student-card-${student.id}`}
                className="admin-card p-6 hover:scale-[1.01] transition-all cursor-pointer"
                onClick={() => setSelectedStudent(student)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-slate-800">{student.name}</h3>
                      <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                        {student.status === 'active' ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span>Veli: {student.parent_name}</span>
                      <span>•</span>
                      <span>Sınıf: {student.level}</span>
                      <span>•</span>
                      <span>Tel: {student.phone}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/students/${student.id}`);
                      }}
                      data-testid={`view-student-${student.id}`}
                      variant="outline"
                      size="sm"
                    >
                      Profil
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/students/${student.id}/edit`);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Düzenle
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStudentStatus(student.id, student.status);
                      }}
                      variant={student.status === 'active' ? 'destructive' : 'default'}
                      size="sm"
                    >
                      {student.status === 'active' ? 'Pasifleştir' : 'Aktifleştir'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Student Actions */}
        {selectedStudent && (
          <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-slate-200 shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Seçili Öğrenci</p>
                <p className="font-bold text-slate-800">{selectedStudent.name}</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => {
                    // Navigate to course selection for lessons
                    navigate(`/admin/students/${selectedStudent.id}`);
                  }}
                  data-testid="lesson-entry-btn"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Book size={18} className="mr-2" />
                  Ders Giriş
                </Button>
                <Button
                  onClick={() => {
                    navigate(`/admin/students/${selectedStudent.id}`);
                  }}
                  data-testid="lesson-planning-btn"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Calendar size={18} className="mr-2" />
                  Ders Planlama
                </Button>
                <Button
                  onClick={() => setSelectedStudent(null)}
                  variant="outline"
                  data-testid="cancel-selection-btn"
                >
                  İptal
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminStudents;