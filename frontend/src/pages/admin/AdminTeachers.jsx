import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiClient from '../../api/axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Plus, Search, Wallet } from 'lucide-react';
import { toast } from 'sonner';

const AdminTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await apiClient.get('/teachers');
      setTeachers(response.data);
    } catch (error) {
      toast.error('Öğretmenler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (teacherId, currentStatus) => {
    try {
      const teacher = teachers.find(t => t.id === teacherId);
      await apiClient.put(`/teachers/${teacherId}`, {
        ...teacher,
        status: currentStatus === 'active' ? 'inactive' : 'active'
      });
      toast.success('Durum güncellendi');
      fetchTeachers();
    } catch (error) {
      toast.error('Güncelleme başarısız');
    }
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-800 mb-2" data-testid="admin-teachers-title">
              Öğretmenler
            </h1>
            <p className="text-slate-600">Öğretmenlerinizi yönetin</p>
          </div>
          <Button
            onClick={() => navigate('/admin/teachers/new')}
            data-testid="add-teacher-btn"
            className="admin-btn"
          >
            <Plus size={20} className="mr-2" />
            Öğretmen Ekle
          </Button>
        </div>

        <div className="admin-card p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <Input
              type="text"
              placeholder="Öğretmen adı ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="teacher-search-input"
              className="pl-10 h-12"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Yükleniyor...</p>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="admin-card p-12 text-center">
            <p className="text-slate-600">Henüz öğretmen eklenmemiş</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTeachers.map((teacher) => (
              <div
                key={teacher.id}
                data-testid={`teacher-card-${teacher.id}`}
                className="admin-card p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-slate-800">{teacher.name}</h3>
                      <Badge variant={teacher.status === 'active' ? 'default' : 'secondary'}>
                        {teacher.status === 'active' ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">Telefon: {teacher.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => navigate(`/admin/teachers/${teacher.id}`)}
                      data-testid={`view-teacher-${teacher.id}`}
                      variant="outline"
                      size="sm"
                    >
                      Profil
                    </Button>
                    <Button
                      onClick={() => navigate(`/admin/teachers/${teacher.id}/balance`)}
                      data-testid={`teacher-balance-${teacher.id}`}
                      variant="outline"
                      size="sm"
                    >
                      <Wallet size={16} className="mr-1" />
                      Bakiye
                    </Button>
                    <Button
                      onClick={() => toggleStatus(teacher.id, teacher.status)}
                      size="sm"
                      variant={teacher.status === 'active' ? 'destructive' : 'default'}
                    >
                      {teacher.status === 'active' ? 'Pasifleştir' : 'Aktifleştir'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminTeachers;