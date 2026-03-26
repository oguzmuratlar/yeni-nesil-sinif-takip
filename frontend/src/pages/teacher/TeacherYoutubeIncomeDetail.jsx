import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layouts/AdminLayout';
import TeacherLayout from '../../components/layouts/TeacherLayout';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/axios';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { ArrowLeft, Youtube, Calendar } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

const TeacherYoutubeIncomeDetail = () => {
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
      let url = `/teachers/${teacherId}/youtube-income-detail`;
      if (selectedMonth) {
        url += `?month=${selectedMonth}`;
      }
      const response = await apiClient.get(url);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching youtube income detail:', error);
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
            <h1 className="page-title" data-testid="youtube-income-detail-title">
              YouTube Kazanç Detayı
            </h1>
            <p className="page-subtitle mt-1">YouTube içerik kazançlarınız</p>
          </div>
        </div>

        {/* Summary Cards */}
        {data && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="admin-card p-4">
              <p className="text-sm text-slate-500">Toplam Kazanç</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(data.total_earning)}</p>
            </div>
            <div className="admin-card p-4">
              <p className="text-sm text-slate-500">İçerik Sayısı</p>
              <p className="text-2xl font-bold text-slate-800">{data.record_count} içerik</p>
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
            <Youtube size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-600">Bu dönemde YouTube kaydı bulunamadı</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data?.details?.map((item, index) => (
              <div key={index} className="admin-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Youtube size={20} className="text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{item.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar size={12} className="text-slate-400" />
                        <span className="text-sm text-slate-500">{item.date}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(item.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeacherYoutubeIncomeDetail;
