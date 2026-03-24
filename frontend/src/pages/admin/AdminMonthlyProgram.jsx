import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiClient from '../../api/axios';
import { Calendar, Filter, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

const AdminMonthlyProgram = () => {
  const [plannedLessons, setPlannedLessons] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [selectedTeacher, setSelectedTeacher] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [loading, setLoading] = useState(true);

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
  }, [selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plannedRes, teachersRes, branchesRes] = await Promise.all([
        apiClient.get(`/all-planned-lessons?month=${selectedMonth}`),
        apiClient.get('/teachers'),
        apiClient.get('/branches')
      ]);
      
      setPlannedLessons(plannedRes.data);
      setTeachers(teachersRes.data);
      setBranches(branchesRes.data);
    } catch (error) {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // Filter planned lessons
  const filteredLessons = plannedLessons.filter(pl => {
    if (selectedTeacher !== 'all' && pl.teacher_id !== selectedTeacher) return false;
    if (selectedBranch !== 'all' && pl.branch_id !== selectedBranch) return false;
    return true;
  });

  // Group by teacher for better visualization
  const groupedByTeacher = filteredLessons.reduce((acc, pl) => {
    const teacherName = pl.teacher_name || 'Bilinmiyor';
    if (!acc[teacherName]) {
      acc[teacherName] = [];
    }
    acc[teacherName].push(pl);
    return acc;
  }, {});

  // Summary calculations
  const totalPlannedLessons = filteredLessons.reduce((sum, pl) => sum + pl.number_of_lessons, 0);
  const uniqueStudents = new Set(filteredLessons.map(pl => pl.student_id)).size;
  const uniqueTeachers = new Set(filteredLessons.map(pl => pl.teacher_id)).size;

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-800 mb-2" data-testid="admin-monthly-program-title">
              Aylık Program
            </h1>
            <p className="text-slate-600">Tüm öğretmenlerin ders planlamaları</p>
          </div>
        </div>

        {/* Filters */}
        <div className="admin-card p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Filtreler:</span>
            </div>
            
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Ay seçin" />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Öğretmen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Öğretmenler</SelectItem>
                {teachers.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Branş" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Branşlar</SelectItem>
                {branches.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="admin-card p-6">
            <p className="text-sm text-slate-500 mb-1">Planlanan Ders</p>
            <p className="text-3xl font-bold text-blue-600">{totalPlannedLessons}</p>
          </div>
          <div className="admin-card p-6">
            <p className="text-sm text-slate-500 mb-1">Öğrenci Sayısı</p>
            <p className="text-3xl font-bold text-green-600">{uniqueStudents}</p>
          </div>
          <div className="admin-card p-6">
            <p className="text-sm text-slate-500 mb-1">Öğretmen Sayısı</p>
            <p className="text-3xl font-bold text-purple-600">{uniqueTeachers}</p>
          </div>
          <div className="admin-card p-6">
            <p className="text-sm text-slate-500 mb-1">Planlama Kaydı</p>
            <p className="text-3xl font-bold text-orange-600">{filteredLessons.length}</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Yükleniyor...</p>
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="admin-card p-12 text-center">
            <Calendar size={48} className="mx-auto mb-4 text-slate-400" />
            <p className="text-slate-600 text-lg">Bu dönem için planlı ders bulunamadı</p>
            <p className="text-slate-500 text-sm mt-2">
              Öğretmenler ders planlaması yaptığında burada görünecektir
            </p>
          </div>
        ) : (
          /* List View - Grouped by Teacher */
          <div className="space-y-6">
            {Object.entries(groupedByTeacher).map(([teacherName, lessons]) => (
              <div key={teacherName} className="admin-card p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Users size={20} className="text-blue-600" />
                  {teacherName}
                  <span className="text-sm font-normal text-slate-500">
                    ({lessons.length} planlama, {lessons.reduce((s, l) => s + l.number_of_lessons, 0)} ders)
                  </span>
                </h2>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 text-sm font-semibold text-slate-600">Öğrenci</th>
                        <th className="text-left py-3 px-2 text-sm font-semibold text-slate-600">Öğretmen</th>
                        <th className="text-left py-3 px-2 text-sm font-semibold text-slate-600">Branş</th>
                        <th className="text-left py-3 px-2 text-sm font-semibold text-slate-600">Tarihler</th>
                        <th className="text-center py-3 px-2 text-sm font-semibold text-slate-600">Ders Sayısı</th>
                        <th className="text-center py-3 px-2 text-sm font-semibold text-slate-600">Mesaj</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lessons.map((pl) => (
                        <tr key={pl.id} className="border-b hover:bg-slate-50">
                          <td className="py-3 px-2 font-medium">{pl.student_name}</td>
                          <td className="py-3 px-2">
                            <span className="text-sm text-slate-700 font-medium">
                              {pl.teacher_name}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {pl.branch_name}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-sm text-slate-600">
                            {pl.dates ? pl.dates.split(',').map((d, i) => (
                              <span key={i} className="inline-block bg-slate-100 px-2 py-0.5 rounded mr-1 mb-1">
                                {d.trim()}
                              </span>
                            )) : '-'}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className="font-bold text-blue-600">{pl.number_of_lessons}</span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            {pl.messaged ? (
                              <span className="text-green-600 text-xs">✓ Gönderildi</span>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminMonthlyProgram;
