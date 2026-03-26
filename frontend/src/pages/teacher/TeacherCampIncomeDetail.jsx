import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layouts/AdminLayout';
import TeacherLayout from '../../components/layouts/TeacherLayout';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/axios';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { ArrowLeft, Tent, Users } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

const TeacherCampIncomeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.user_type === 'admin';
  const teacherId = isAdmin ? id : user?.teacher_id;
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  
  const Layout = isAdmin ? AdminLayout : TeacherLayout;

  useEffect(() => {
    fetchData();
  }, [teacherId, selectedMonth]);

  const fetchData = async () => {
    if (!teacherId) return;
    try {
      let url = `/teachers/${teacherId}/camp-income-detail`;
      if (selectedMonth) {
        url += `?month=${selectedMonth}`;
      }
      const response = await apiClient.get(url);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching camp income detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY',
      minimumFractionDigits: 2 
    }).format(amount);
  };

  const months = [
    { value: '2024-12', label: 'Aralık 2024' },
    { value: '2025-01', label: 'Ocak 2025' },
    { value: '2025-02', label: 'Şubat 2025' },
    { value: '2025-03', label: 'Mart 2025' },
    { value: '2025-04', label: 'Nisan 2025' },
    { value: '2025-05', label: 'Mayıs 2025' },
    { value: '2026-01', label: 'Ocak 2026' },
    { value: '2026-02', label: 'Şubat 2026' },
    { value: '2026-03', label: 'Mart 2026' },
  ];

  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="page-title" data-testid="camp-income-detail-title">
              Kamp Kazanç Detayı
            </h1>
            <p className="page-subtitle mt-1">Kamp etkinliklerinden kazançlarınız</p>
          </div>
        </div>

        {/* Summary Cards */}
        {data && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="admin-card p-4">
              <p className="text-sm text-slate-500">Toplam Kazanç</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data.total_earning)}</p>
            </div>
            <div className="admin-card p-4">
              <p className="text-sm text-slate-500">Kamp Sayısı</p>
              <p className="text-2xl font-bold text-orange-600">{data.camp_count} kamp</p>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="admin-card p-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-700">Ay Filtresi:</span>
            <Select value={selectedMonth || 'all'} onValueChange={(v) => setSelectedMonth(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tüm zamanlar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Zamanlar</SelectItem>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Detail List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Yükleniyor...</p>
          </div>
        ) : data?.details?.length === 0 ? (
          <div className="admin-card p-12 text-center">
            <Tent size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-600">Bu dönemde kamp kaydı bulunamadı</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data?.details?.map((item, index) => (
              <div key={index} className="admin-card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-slate-800">{item.camp_name}</h3>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary">{item.class_level}. Sınıf</Badge>
                      <Badge variant={item.status === 'active' ? 'default' : 'outline'}>
                        {item.status === 'active' ? 'Aktif' : 'Tamamlandı'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">{formatCurrency(item.total_earning)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm text-slate-600 pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-slate-400" />
                    <div>
                      <p className="text-slate-400">Öğrenci</p>
                      <p className="font-semibold text-slate-800">{item.student_count} kişi</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-400">Öğrenci Başı</p>
                    <p className="font-semibold text-slate-800">{formatCurrency(item.per_student_fee)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Hesaplama</p>
                    <p className="font-semibold text-slate-800">{item.student_count} × {formatCurrency(item.per_student_fee)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeacherCampIncomeDetail;
