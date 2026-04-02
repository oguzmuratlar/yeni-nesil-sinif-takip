import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiClient from '../../api/axios';
import { Calendar, Filter, X, ChevronDown, ChevronUp, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { debounce } from 'lodash';
import { formatMoney } from '../../lib/utils';

// Ödeme durumu seçenekleri
const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'Seçiniz' },
  { value: 'odedi', label: 'Ödedi' },
  { value: 'mesaj_atildi', label: 'Mesaj atıldı' },
  { value: 'hatirlatma_2', label: '2. hatırlatma yapıldı' },
  { value: 'hatirlatma_3', label: '3. hatırlatma yapıldı' },
  { value: 'parcali', label: 'Parçalı ödeyecek' },
];

// Satır renk sınıfları
const getRowColorClass = (paymentStatus, isRisky) => {
  if (paymentStatus === 'odedi') return 'bg-green-50';
  if (isRisky) return 'bg-red-50';
  if (paymentStatus === 'mesaj_atildi') return 'bg-yellow-50';
  if (paymentStatus === 'hatirlatma_2') return 'bg-yellow-100';
  if (paymentStatus === 'hatirlatma_3') return 'bg-yellow-200';
  return '';
};

const AdminMonthlyProgram = () => {
  const [programData, setProgramData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
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

  // Fiyat override kaydetme
  const savePriceOverride = useCallback(
    debounce(async (studentId, priceOverrides) => {
      try {
        const params = new URLSearchParams();
        params.append('month', selectedMonth);
        params.append('price_overrides', JSON.stringify(priceOverrides));
        
        await apiClient.put(`/monthly-program-notes/${studentId}?${params.toString()}`);
        toast.success('Tutar kaydedildi', { duration: 1000 });
      } catch (error) {
        toast.error('Kaydetme başarısız');
      }
    }, 500),
    [selectedMonth]
  );

  const handleNoteChange = (studentId, field, value) => {
    setProgramData(prev => ({
      ...prev,
      students: prev.students.map(s => 
        s.student_id === studentId ? { ...s, [field]: value } : s
      )
    }));
    saveNote(studentId, field, value);
  };

  // Fiyat override değişikliği
  const handlePriceOverrideChange = (studentId, branchName, value) => {
    setProgramData(prev => {
      const updatedStudents = prev.students.map(s => {
        if (s.student_id === studentId) {
          const newOverrides = { ...(s.price_overrides || {}) };
          if (value === '' || value === null) {
            delete newOverrides[branchName];
          } else {
            newOverrides[branchName] = parseFloat(value) || 0;
          }
          return { ...s, price_overrides: newOverrides };
        }
        return s;
      });
      return { ...prev, students: updatedStudents };
    });
    
    // Override'ları kaydet
    const student = programData.students.find(s => s.student_id === studentId);
    const newOverrides = { ...(student?.price_overrides || {}) };
    if (value === '' || value === null) {
      delete newOverrides[branchName];
    } else {
      newOverrides[branchName] = parseFloat(value) || 0;
    }
    savePriceOverride(studentId, newOverrides);
  };

  // Öğrencinin toplam ödemesini hesapla (override'ları dikkate alarak)
  const calculateStudentTotal = (student) => {
    let total = 0;
    const branches = programData?.branches || [];
    
    for (const branch of branches) {
      const detail = student.branch_details?.[branch];
      if (detail) {
        // Override varsa onu kullan, yoksa hesaplanan değeri
        const override = student.price_overrides?.[branch];
        total += override !== undefined ? override : (detail.total || 0);
      }
    }
    return total;
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

  // Sıralama fonksiyonu
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Sıralama ikonu
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={14} className="ml-1 text-slate-400" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} className="ml-1 text-blue-600" />
      : <ArrowDown size={14} className="ml-1 text-blue-600" />;
  };

  // Filtreleme
  const filteredStudents = programData?.students?.filter(student => {
    if (filterStudent && !student.student_name.toLowerCase().includes(filterStudent.toLowerCase())) {
      return false;
    }
    if (filterTeacher !== 'all') {
      const teacherName = programData.teachers.find(t => t.id === filterTeacher)?.name;
      const hasTeacher = Object.keys(student.teacher_earnings || {}).includes(teacherName);
      if (!hasTeacher) return false;
    }
    if (filterBranch !== 'all') {
      if (!student.branch_details?.[filterBranch]) return false;
    }
    if (filterPaymentStatus !== 'all') {
      const status = student.payment_status || '';
      if (filterPaymentStatus === 'empty' && status !== '') return false;
      if (filterPaymentStatus !== 'empty' && status !== filterPaymentStatus) return false;
    }
    if (filterPaymentDay !== 'all') {
      const day = student.payment_day || '';
      if (day !== filterPaymentDay) return false;
    }
    return true;
  }) || [];

  // Sıralama uygula
  const sortedStudents = useMemo(() => {
    if (!sortConfig.key) return filteredStudents;
    
    return [...filteredStudents].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortConfig.key) {
        case 'student_name':
          aVal = a.student_name || '';
          bVal = b.student_name || '';
          break;
        case 'total':
          aVal = calculateStudentTotal(a);
          bVal = calculateStudentTotal(b);
          break;
        case 'payment_status':
          aVal = a.payment_status || '';
          bVal = b.payment_status || '';
          break;
        default:
          return 0;
      }
      
      // Sayısal değerler için
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      // Alfabetik sıralama
      const comparison = aVal.toString().localeCompare(bVal.toString(), 'tr');
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredStudents, sortConfig, calculateStudentTotal]);

  const grandTotal = sortedStudents.reduce((sum, s) => sum + calculateStudentTotal(s), 0);

  // Toplam öğretmen gideri
  const totalTeacherExpense = useMemo(() => {
    if (!programData?.teacher_totals) return 0;
    return Object.values(programData.teacher_totals).reduce((sum, val) => sum + val, 0);
  }, [programData?.teacher_totals]);

  // Toplam kar = Ciro - Öğretmen Gideri
  const totalProfit = grandTotal - totalTeacherExpense;

  const activeFilterCount = [
    filterStudent,
    filterTeacher !== 'all' ? filterTeacher : '',
    filterBranch !== 'all' ? filterBranch : '',
    filterPaymentStatus !== 'all' ? filterPaymentStatus : '',
    filterPaymentDay !== 'all' ? filterPaymentDay : ''
  ].filter(Boolean).length;

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
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="page-title" data-testid="admin-monthly-program-title">
            Aylık Program
          </h1>
          <p className="page-subtitle mt-1">Öğrenci ders planları ve ödeme takibi</p>
        </div>

        {/* Ay Seçimi + Filter Toggle (Mobile) */}
        <div className="admin-card p-4 lg:p-6 mb-4 lg:mb-6">
          <div className="flex flex-col lg:flex-row lg:flex-wrap lg:items-center gap-3 lg:gap-4">
            {/* First row - always visible */}
            <div className="flex items-center gap-3">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-36 lg:w-40 h-11 lg:h-10" data-testid="month-filter">
                  <SelectValue placeholder="Ay seçin" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden h-11 px-3"
              >
                <Filter size={18} className="mr-2" />
                Filtre
                {activeFilterCount > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>

            {/* Filters - Hidden on mobile by default */}
            <div className={`${showFilters ? 'flex' : 'hidden'} lg:flex flex-col lg:flex-row lg:flex-wrap lg:items-center gap-3 lg:gap-4`}>
              <div className="hidden lg:flex items-center gap-2">
                <Filter size={18} className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Filtreler:</span>
                {activeFilterCount > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                    {activeFilterCount} aktif
                  </span>
                )}
              </div>

              <Input 
                placeholder="Öğrenci ara..." 
                value={filterStudent}
                onChange={(e) => setFilterStudent(e.target.value)}
                className="h-11 lg:h-10 lg:w-40"
                data-testid="student-filter"
              />

              <div className="grid grid-cols-2 gap-2 lg:flex lg:gap-3">
                <Select value={filterTeacher} onValueChange={setFilterTeacher}>
                  <SelectTrigger className="h-11 lg:h-10 lg:w-40" data-testid="teacher-filter">
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
                  <SelectTrigger className="h-11 lg:h-10 lg:w-40" data-testid="branch-filter">
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
                  <SelectTrigger className="h-11 lg:h-10 lg:w-40" data-testid="payment-status-filter">
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
                  <SelectTrigger className="h-11 lg:h-10 lg:w-40" data-testid="payment-day-filter">
                    <SelectValue placeholder="Ödeme Günü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Günler</SelectItem>
                    {uniquePaymentDays.map(day => (
                      <SelectItem key={day} value={day}>Ayın {day}. günü</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {activeFilterCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={clearFilters}
                  className="h-10 text-slate-600"
                >
                  <X size={16} className="mr-1" />
                  Temizle
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6">
          <div className="admin-card p-3 lg:p-4" data-testid="student-count-card">
            <p className="text-xs lg:text-sm text-slate-500">Öğrenci Sayısı</p>
            <p className="text-xl lg:text-2xl font-bold text-blue-600">{filteredStudents.length}</p>
          </div>
          <div className="admin-card p-3 lg:p-4" data-testid="total-revenue-card">
            <p className="text-xs lg:text-sm text-slate-500">Toplam Ciro</p>
            <p className="text-xl lg:text-2xl font-bold text-green-600">{formatMoney(grandTotal, false)} ₺</p>
          </div>
          <div className="admin-card p-3 lg:p-4" data-testid="total-expense-card">
            <p className="text-xs lg:text-sm text-slate-500">Öğretmen Gideri</p>
            <p className="text-xl lg:text-2xl font-bold text-orange-600">{formatMoney(totalTeacherExpense, false)} ₺</p>
          </div>
          <div className="admin-card p-3 lg:p-4" data-testid="total-profit-card">
            <p className="text-xs lg:text-sm text-slate-500">Toplam Kar</p>
            <p className={`text-xl lg:text-2xl font-bold ${totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatMoney(totalProfit, false)} ₺
            </p>
          </div>
        </div>

        {/* Data Display */}
        {sortedStudents.length === 0 ? (
          <div className="admin-card p-8 lg:p-12 text-center">
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
          <>
            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {sortedStudents.map((student) => (
                <div 
                  key={student.student_id} 
                  className={`admin-card overflow-hidden ${getRowColorClass(student.payment_status, student.is_risky)}`}
                  data-testid={`student-row-${student.student_id}`}
                >
                  {/* Card Header - Always Visible */}
                  <div 
                    className="p-4 cursor-pointer active:bg-slate-50"
                    onClick={() => setExpandedStudent(expandedStudent === student.student_id ? null : student.student_id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-800 truncate">{student.student_name}</h3>
                          {student.is_risky && student.payment_status !== 'odedi' && (
                            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Riskli</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">{student.parent_name}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {student.payment_day && (
                            <span className="bg-amber-50 text-amber-700 text-xs px-2 py-1 rounded">
                              Ayın {student.payment_day}. günü
                            </span>
                          )}
                          <span className="text-xs text-slate-500">{student.courses || '-'}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end ml-3">
                        <p className="font-bold text-green-600">{formatMoney(calculateStudentTotal(student), false)} ₺</p>
                        {expandedStudent === student.student_id ? (
                          <ChevronUp size={20} className="text-slate-400 mt-2" />
                        ) : (
                          <ChevronDown size={20} className="text-slate-400 mt-2" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedStudent === student.student_id && (
                    <div className="border-t border-slate-100 p-4 bg-slate-50 space-y-4">
                      {/* Editable Fields */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-500 block mb-1">Not</label>
                          <Input
                            value={student.note || ''}
                            onChange={(e) => handleNoteChange(student.student_id, 'note', e.target.value)}
                            className="h-10 text-sm"
                            placeholder="Not..."
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 block mb-1">Ödeme Durumu</label>
                          <Input
                            value={student.payment_status || ''}
                            onChange={(e) => handleNoteChange(student.student_id, 'payment_status', e.target.value)}
                            className="h-10 text-sm"
                            placeholder="Durum..."
                          />
                        </div>
                      </div>

                      {/* Branch Details */}
                      {programData?.branches?.map(branch => {
                        const detail = student.branch_details?.[branch];
                        if (!detail || !detail.total) return null;
                        const hasOverride = student.price_overrides?.[branch] !== undefined;
                        const displayTotal = hasOverride ? student.price_overrides[branch] : detail.total;
                        return (
                          <div key={branch} className="bg-white p-3 rounded-lg">
                            <p className="text-sm font-semibold text-blue-700 mb-2">{branch}</p>
                            <div className="grid grid-cols-4 gap-2 text-xs">
                              <div>
                                <span className="text-slate-500">Tarih:</span>
                                <p className="text-slate-700">{detail.dates || '-'}</p>
                              </div>
                              <div>
                                <span className="text-slate-500">Birim:</span>
                                <p className="text-slate-700">{detail.unit_price}₺</p>
                              </div>
                              <div>
                                <span className="text-slate-500">Hesaplanan:</span>
                                <p className={`${hasOverride ? 'line-through text-slate-400' : 'text-slate-700'}`}>{detail.total}₺</p>
                              </div>
                              <div>
                                <span className="text-slate-500">Tutar:</span>
                                <Input
                                  type="number"
                                  value={hasOverride ? student.price_overrides[branch] : ''}
                                  onChange={(e) => handlePriceOverrideChange(student.student_id, branch, e.target.value)}
                                  placeholder="-"
                                  className={`h-7 text-sm w-24 ${hasOverride ? 'border-orange-400 bg-orange-50' : ''}`}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Teacher Earnings */}
                      {Object.keys(student.teacher_earnings || {}).length > 0 && (
                        <div className="bg-emerald-50 p-3 rounded-lg">
                          <p className="text-sm font-semibold text-emerald-700 mb-2">Öğretmen Kazançları</p>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(student.teacher_earnings).map(([teacher, earning]) => (
                              <div key={teacher} className="flex justify-between text-sm">
                                <span className="text-slate-600">{teacher}:</span>
                                <span className="font-semibold text-emerald-600">{formatMoney(earning, false)}₺</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block admin-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="text-left py-3 px-3 font-semibold text-slate-700 whitespace-nowrap sticky left-0 bg-slate-100 z-10">Not</th>
                      <th className="text-left py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">Ödeme Durumu</th>
                      <th className="text-left py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">Hesap Adı</th>
                      <th className="text-left py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">Dersler</th>
                      <th className="text-left py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">Öğrenci</th>
                      <th className="text-left py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">Veli</th>
                      <th className="text-left py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">Ödeme Günü</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">Toplam</th>
                      
                      {programData?.branches?.map(branch => (
                        <th key={branch} colSpan={4} className="text-center py-3 px-3 font-semibold text-blue-700 bg-blue-50 border-l whitespace-nowrap">
                          {branch}
                        </th>
                      ))}
                      
                      {programData?.teachers?.map(teacher => (
                        <th key={teacher.id} className="text-center py-3 px-3 font-semibold text-emerald-700 bg-emerald-50 border-l whitespace-nowrap">
                          {teacher.name}
                        </th>
                      ))}
                    </tr>
                    
                    <tr className="bg-slate-50">
                      <th colSpan={8}></th>
                      {programData?.branches?.map(branch => (
                        <React.Fragment key={`sub-${branch}`}>
                          <th className="text-center py-2 px-2 text-xs text-slate-500 border-l">Tarih</th>
                          <th className="text-center py-2 px-2 text-xs text-slate-500">Birim</th>
                          <th className="text-center py-2 px-2 text-xs text-slate-500">Hesaplanan</th>
                          <th className="text-center py-2 px-2 text-xs text-orange-600 bg-orange-50">Özel Tutar</th>
                        </React.Fragment>
                      ))}
                      {programData?.teachers?.map(teacher => (
                        <th key={`sub-t-${teacher.id}`} className="text-center py-2 px-2 text-xs text-slate-500 border-l">Kazanç</th>
                      ))}
                    </tr>
                  </thead>
                  
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.student_id} className="border-b hover:bg-slate-50">
                        <td className="py-2 px-2 sticky left-0 bg-white z-10">
                          <Input
                            value={student.note || ''}
                            onChange={(e) => handleNoteChange(student.student_id, 'note', e.target.value)}
                            className="w-28 h-8 text-xs"
                            placeholder="Not..."
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            value={student.payment_status || ''}
                            onChange={(e) => handleNoteChange(student.student_id, 'payment_status', e.target.value)}
                            className="w-24 h-8 text-xs"
                            placeholder="Durum..."
                          />
                        </td>
                        <td className="py-2 px-2 text-xs text-slate-600 whitespace-nowrap">{student.account_name || '-'}</td>
                        <td className="py-2 px-2 text-xs"><span className="text-blue-600">{student.courses || '-'}</span></td>
                        <td className="py-2 px-2 font-medium text-slate-800 whitespace-nowrap">{student.student_name}</td>
                        <td className="py-2 px-2 text-xs text-slate-600 whitespace-nowrap">{student.parent_name}</td>
                        <td className="py-2 px-2 text-xs text-slate-700 whitespace-nowrap">
                          {student.payment_day ? (
                            <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded font-medium">
                              Ayın {student.payment_day}. günü
                            </span>
                          ) : '-'}
                        </td>
                        <td className="py-2 px-2 text-right font-bold text-green-600 whitespace-nowrap">
                          {formatMoney(calculateStudentTotal(student), false)} ₺
                        </td>
                        
                        {programData?.branches?.map(branch => {
                          const detail = student.branch_details?.[branch];
                          const hasOverride = student.price_overrides?.[branch] !== undefined;
                          return (
                            <React.Fragment key={`${student.student_id}-${branch}`}>
                              <td className="py-2 px-2 text-xs text-slate-600 border-l whitespace-nowrap">{detail?.dates || '-'}</td>
                              <td className="py-2 px-2 text-xs text-center text-slate-600">{detail?.unit_price ? `${formatMoney(detail.unit_price, false)}₺` : '-'}</td>
                              <td className={`py-2 px-2 text-xs text-center ${hasOverride ? 'line-through text-slate-400' : 'text-slate-600'}`}>
                                {detail?.total ? `${formatMoney(detail.total, false)}₺` : '-'}
                              </td>
                              <td className="py-2 px-2">
                                <Input
                                  type="number"
                                  value={hasOverride ? student.price_overrides[branch] : ''}
                                  onChange={(e) => handlePriceOverrideChange(student.student_id, branch, e.target.value)}
                                  placeholder="-"
                                  className={`w-24 h-7 text-sm text-center ${hasOverride ? 'border-orange-400 bg-orange-50' : ''}`}
                                />
                              </td>
                            </React.Fragment>
                          );
                        })}
                        
                        {programData?.teachers?.map(teacher => {
                          const earning = student.teacher_earnings?.[teacher.name];
                          return (
                            <td key={`${student.student_id}-t-${teacher.id}`} className="py-2 px-2 text-xs text-center font-medium text-emerald-600 border-l">
                              {earning ? `${formatMoney(earning, false)}₺` : '-'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Teacher Totals */}
        {programData?.teacher_totals && Object.keys(programData.teacher_totals).length > 0 && (
          <div className="admin-card p-4 lg:p-6 mt-4 lg:mt-6">
            <h2 className="text-base lg:text-lg font-bold text-slate-800 mb-3 lg:mb-4">Öğretmen Kazanç Toplamları</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 lg:gap-4">
              {Object.entries(programData.teacher_totals).map(([teacherName, total]) => (
                <div key={teacherName} className="p-3 lg:p-4 bg-emerald-50 rounded-lg">
                  <p className="text-xs lg:text-sm text-slate-600 truncate">{teacherName}</p>
                  <p className="text-lg lg:text-xl font-bold text-emerald-600">{formatMoney(total, false)} ₺</p>
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
