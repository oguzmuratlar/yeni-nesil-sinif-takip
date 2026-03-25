import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiClient from '../../api/axios';
import { Calendar, Filter, X } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { debounce } from 'lodash';

const AdminMonthlyProgram = () => {
  const [programData, setProgramData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  
  // Filtreler
  const [filterStudent, setFilterStudent] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  const [filterPaymentDay, setFilterPaymentDay] = useState('all');

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
      const response = await apiClient.get(`/monthly-program-detailed?month=${selectedMonth}`);
      setProgramData(response.data);
    } catch (error) {
      toast.error('Veriler yüklenemedi');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced not kaydetme
  const saveNote = useCallback(
    debounce(async (studentId, field, value) => {
      try {
        const params = new URLSearchParams();
        params.append('month', selectedMonth);
        params.append(field, value);
        
        await apiClient.put(`/monthly-program-notes/${studentId}?${params.toString()}`);
        toast.success('Kaydedildi', { duration: 1000 });
      } catch (error) {
        toast.error('Kaydetme başarısız');
      }
    }, 500),
    [selectedMonth]
  );

  const handleNoteChange = (studentId, field, value) => {
    // Lokal state'i güncelle
    setProgramData(prev => ({
      ...prev,
      students: prev.students.map(s => 
        s.student_id === studentId ? { ...s, [field]: value } : s
      )
    }));
    // Backend'e kaydet
    saveNote(studentId, field, value);
  };

  // Benzersiz ödeme günleri listesi
  const uniquePaymentDays = useMemo(() => {
    if (!programData?.students) return [];
    const days = [...new Set(programData.students.map(s => s.payment_day).filter(Boolean))];
    return days.sort((a, b) => parseInt(a) - parseInt(b));
  }, [programData?.students]);

  // Benzersiz ödeme durumları listesi
  const uniquePaymentStatuses = useMemo(() => {
    if (!programData?.students) return [];
    const statuses = [...new Set(programData.students.map(s => s.payment_status).filter(Boolean))];
    return statuses.sort();
  }, [programData?.students]);

  // Filtreleme
  const filteredStudents = programData?.students?.filter(student => {
    // Öğrenci adı filtresi
    if (filterStudent && !student.student_name.toLowerCase().includes(filterStudent.toLowerCase())) {
      return false;
    }
    
    // Öğretmen filtresi
    if (filterTeacher !== 'all') {
      const teacherName = programData.teachers.find(t => t.id === filterTeacher)?.name;
      const hasTeacher = Object.keys(student.teacher_earnings || {}).includes(teacherName);
      if (!hasTeacher) return false;
    }
    
    // Branş filtresi
    if (filterBranch !== 'all') {
      if (!student.branch_details?.[filterBranch]) return false;
    }
    
    // Ödeme durumu filtresi
    if (filterPaymentStatus !== 'all') {
      const status = student.payment_status || '';
      if (filterPaymentStatus === 'empty' && status !== '') return false;
      if (filterPaymentStatus !== 'empty' && status !== filterPaymentStatus) return false;
    }
    
    // Ödeme günü filtresi
    if (filterPaymentDay !== 'all') {
      const day = student.payment_day || '';
      if (day !== filterPaymentDay) return false;
    }
    
    return true;
  }) || [];

  // Genel toplamlar
  const grandTotal = filteredStudents.reduce((sum, s) => sum + (s.total_payment || 0), 0);

  // Aktif filtre sayısı
  const activeFilterCount = [
    filterStudent,
    filterTeacher !== 'all' ? filterTeacher : '',
    filterBranch !== 'all' ? filterBranch : '',
    filterPaymentStatus !== 'all' ? filterPaymentStatus : '',
    filterPaymentDay !== 'all' ? filterPaymentDay : ''
  ].filter(Boolean).length;

  // Filtreleri temizle
  const clearFilters = () => {
    setFilterStudent('');
    setFilterTeacher('all');
    setFilterBranch('all');
    setFilterPaymentStatus('all');
    setFilterPaymentDay('all');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">Yükleniyor...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-800 mb-2" data-testid="admin-monthly-program-title">
              Aylık Program
            </h1>
            <p className="text-slate-600">Öğrenci ders planları ve ödeme takibi</p>
          </div>
        </div>

        {/* Filtreler */}
        <div className="admin-card p-6 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Filtreler:</span>
              {activeFilterCount > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                  {activeFilterCount} aktif
                </span>
              )}
            </div>
            
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40" data-testid="month-filter">
                <SelectValue placeholder="Ay seçin" />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input 
              placeholder="Öğrenci ara..." 
              value={filterStudent}
              onChange={(e) => setFilterStudent(e.target.value)}
              className="w-40"
              data-testid="student-filter"
            />

            <Select value={filterTeacher} onValueChange={setFilterTeacher}>
              <SelectTrigger className="w-40" data-testid="teacher-filter">
                <SelectValue placeholder="Öğretmen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Öğretmenler</SelectItem>
                {programData?.teachers?.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterBranch} onValueChange={setFilterBranch}>
              <SelectTrigger className="w-40" data-testid="branch-filter">
                <SelectValue placeholder="Branş" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Branşlar</SelectItem>
                {programData?.branches?.map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
              <SelectTrigger className="w-40" data-testid="payment-status-filter">
                <SelectValue placeholder="Ödeme Durumu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="empty">Boş (Girilmemiş)</SelectItem>
                {uniquePaymentStatuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterPaymentDay} onValueChange={setFilterPaymentDay}>
              <SelectTrigger className="w-40" data-testid="payment-day-filter">
                <SelectValue placeholder="Ödeme Günü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Günler</SelectItem>
                {uniquePaymentDays.map(day => (
                  <SelectItem key={day} value={day}>Ayın {day}. günü</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeFilterCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearFilters}
                className="text-slate-600 hover:text-slate-800"
              >
                <X size={16} className="mr-1" />
                Temizle
              </Button>
            )}
          </div>
        </div>

        {/* Özet Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="admin-card p-4">
            <p className="text-sm text-slate-500">Toplam Öğrenci</p>
            <p className="text-2xl font-bold text-blue-600">{filteredStudents.length}</p>
          </div>
          <div className="admin-card p-4">
            <p className="text-sm text-slate-500">Toplam Alınacak</p>
            <p className="text-2xl font-bold text-green-600">{grandTotal.toFixed(2)} ₺</p>
          </div>
          <div className="admin-card p-4">
            <p className="text-sm text-slate-500">Branş Sayısı</p>
            <p className="text-2xl font-bold text-purple-600">{programData?.branches?.length || 0}</p>
          </div>
          <div className="admin-card p-4">
            <p className="text-sm text-slate-500">Aktif Öğretmen</p>
            <p className="text-2xl font-bold text-orange-600">{programData?.teachers?.length || 0}</p>
          </div>
        </div>

        {/* Ana Tablo */}
        {filteredStudents.length === 0 ? (
          <div className="admin-card p-12 text-center">
            <Calendar size={48} className="mx-auto mb-4 text-slate-400" />
            <p className="text-slate-600 text-lg">
              {activeFilterCount > 0 ? 'Filtrelere uygun veri bulunamadı' : 'Bu dönem için veri bulunamadı'}
            </p>
            {activeFilterCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
                Filtreleri Temizle
              </Button>
            )}
          </div>
        ) : (
          <div className="admin-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    {/* Sabit Kolonlar */}
                    <th className="text-left py-3 px-3 font-semibold text-slate-700 whitespace-nowrap sticky left-0 bg-slate-100 z-10">Not</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">Ödeme Durumu</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">Hesap Adı</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">Dersler</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">Öğrenci</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">Veli</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">Ödeme Günü</th>
                    <th className="text-right py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">Toplam</th>
                    
                    {/* Branş Kolonları */}
                    {programData?.branches?.map(branch => (
                      <th key={branch} colSpan={3} className="text-center py-3 px-3 font-semibold text-blue-700 bg-blue-50 border-l whitespace-nowrap">
                        {branch}
                      </th>
                    ))}
                    
                    {/* Öğretmen Kolonları */}
                    {programData?.teachers?.map(teacher => (
                      <th key={teacher.id} className="text-center py-3 px-3 font-semibold text-emerald-700 bg-emerald-50 border-l whitespace-nowrap">
                        {teacher.name}
                      </th>
                    ))}
                  </tr>
                  
                  {/* Alt başlıklar - Branşlar için */}
                  <tr className="bg-slate-50">
                    <th colSpan={8}></th>
                    {programData?.branches?.map(branch => (
                      <React.Fragment key={`sub-${branch}`}>
                        <th className="text-center py-2 px-2 text-xs text-slate-500 border-l">Tarih</th>
                        <th className="text-center py-2 px-2 text-xs text-slate-500">Birim</th>
                        <th className="text-center py-2 px-2 text-xs text-slate-500">Toplam</th>
                      </React.Fragment>
                    ))}
                    {programData?.teachers?.map(teacher => (
                      <th key={`sub-t-${teacher.id}`} className="text-center py-2 px-2 text-xs text-slate-500 border-l">Kazanç</th>
                    ))}
                  </tr>
                </thead>
                
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.student_id} className="border-b hover:bg-slate-50" data-testid={`student-row-${student.student_id}`}>
                      {/* Not - Editable */}
                      <td className="py-2 px-2 sticky left-0 bg-white z-10">
                        <Input
                          value={student.note || ''}
                          onChange={(e) => handleNoteChange(student.student_id, 'note', e.target.value)}
                          className="w-28 h-8 text-xs"
                          placeholder="Not..."
                          data-testid={`note-${student.student_id}`}
                        />
                      </td>
                      
                      {/* Ödeme Durumu - Editable */}
                      <td className="py-2 px-2">
                        <Input
                          value={student.payment_status || ''}
                          onChange={(e) => handleNoteChange(student.student_id, 'payment_status', e.target.value)}
                          className="w-24 h-8 text-xs"
                          placeholder="Durum..."
                          data-testid={`payment-status-${student.student_id}`}
                        />
                      </td>
                      
                      {/* Hesap Adı */}
                      <td className="py-2 px-2 text-xs text-slate-600 whitespace-nowrap">
                        {student.account_name || '-'}
                      </td>
                      
                      {/* Dersler */}
                      <td className="py-2 px-2 text-xs">
                        <span className="text-blue-600">{student.courses || '-'}</span>
                      </td>
                      
                      {/* Öğrenci */}
                      <td className="py-2 px-2 font-medium text-slate-800 whitespace-nowrap">
                        {student.student_name}
                      </td>
                      
                      {/* Veli */}
                      <td className="py-2 px-2 text-xs text-slate-600 whitespace-nowrap">
                        {student.parent_name}
                      </td>
                      
                      {/* Ödeme Günü - Read Only (Öğrenci profilinden) */}
                      <td className="py-2 px-2 text-xs text-slate-700 whitespace-nowrap">
                        {student.payment_day ? (
                          <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded font-medium">
                            Ayın {student.payment_day}. günü
                          </span>
                        ) : '-'}
                      </td>
                      
                      {/* Toplam */}
                      <td className="py-2 px-2 text-right font-bold text-green-600 whitespace-nowrap">
                        {student.total_payment?.toFixed(2) || '0'} ₺
                      </td>
                      
                      {/* Branş Detayları */}
                      {programData?.branches?.map(branch => {
                        const detail = student.branch_details?.[branch];
                        return (
                          <React.Fragment key={`${student.student_id}-${branch}`}>
                            <td className="py-2 px-2 text-xs text-slate-600 border-l whitespace-nowrap">
                              {detail?.dates || '-'}
                            </td>
                            <td className="py-2 px-2 text-xs text-center text-slate-600">
                              {detail?.unit_price ? `${detail.unit_price}₺` : '-'}
                            </td>
                            <td className="py-2 px-2 text-xs text-center font-medium text-blue-600">
                              {detail?.total ? `${detail.total}₺` : '-'}
                            </td>
                          </React.Fragment>
                        );
                      })}
                      
                      {/* Öğretmen Kazançları */}
                      {programData?.teachers?.map(teacher => {
                        const earning = student.teacher_earnings?.[teacher.name];
                        return (
                          <td key={`${student.student_id}-t-${teacher.id}`} className="py-2 px-2 text-xs text-center font-medium text-emerald-600 border-l">
                            {earning ? `${earning.toFixed(2)}₺` : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Öğretmen Toplamları */}
        {programData?.teacher_totals && Object.keys(programData.teacher_totals).length > 0 && (
          <div className="admin-card p-6 mt-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Öğretmen Aylık Kazanç Toplamları</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Object.entries(programData.teacher_totals).map(([teacherName, total]) => (
                <div key={teacherName} className="p-4 bg-emerald-50 rounded-lg">
                  <p className="text-sm text-slate-600">{teacherName}</p>
                  <p className="text-xl font-bold text-emerald-600">{total.toFixed(2)} ₺</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminMonthlyProgram;
