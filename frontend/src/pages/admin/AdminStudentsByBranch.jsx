import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiClient from '../../api/axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ArrowLeft, Search, Users, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';

const AdminStudentsByBranch = () => {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [branchId]);

  const fetchData = async () => {
    try {
      const response = await apiClient.get(`/students/by-branch/${branchId}`);
      setData(response.data);
    } catch (error) {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY',
      minimumFractionDigits: 0 
    }).format(amount);
  };

  const filteredStudents = data?.students?.filter(s => 
    s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.parent_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/students')}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="page-title" data-testid="students-by-branch-title">
              {data?.branch_name || 'Branş'} Öğrencileri
            </h1>
            <p className="page-subtitle mt-1">Branş bazlı öğrenci finans durumu</p>
          </div>
        </div>

        {/* Summary Cards */}
        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="admin-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Öğrenci</p>
                  <p className="text-xl font-bold text-slate-800">{data.summary?.total_students}</p>
                </div>
              </div>
            </div>
            <div className="admin-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Toplam Ödeme</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(data.summary?.total_paid || 0)}</p>
                </div>
              </div>
            </div>
            <div className="admin-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingDown size={20} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Kullanılan</p>
                  <p className="text-xl font-bold text-orange-600">{formatCurrency(data.summary?.total_used || 0)}</p>
                </div>
              </div>
            </div>
            <div className="admin-card p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${(data.summary?.total_balance || 0) >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
                  <AlertCircle size={20} className={(data.summary?.total_balance || 0) >= 0 ? 'text-blue-600' : 'text-red-600'} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Net Bakiye</p>
                  <p className={`text-xl font-bold ${(data.summary?.total_balance || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {formatCurrency(data.summary?.total_balance || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="admin-card p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              type="text"
              placeholder="Öğrenci veya veli adına göre ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Student List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Yükleniyor...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="admin-card p-12 text-center">
            <Users size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-600">Öğrenci bulunamadı</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStudents.map((student) => (
              <div 
                key={student.student_id} 
                className={`admin-card p-4 border-l-4 ${
                  student.status === 'borclu' ? 'border-l-red-500' : 'border-l-green-500'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Student Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-800">{student.student_name}</h3>
                      <Badge variant={student.status === 'borclu' ? 'destructive' : 'secondary'}>
                        {student.status === 'borclu' ? 'Borçlu' : 'Alacaklı'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500">Veli: {student.parent_name}</p>
                    <p className="text-xs text-slate-400">{student.level}. Sınıf • {student.teacher_name}</p>
                  </div>
                  
                  {/* Finance Info */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
                    <div className="text-center p-2 bg-slate-50 rounded">
                      <p className="text-slate-500 text-xs">Ders Ücreti</p>
                      <p className="font-bold">{formatCurrency(student.student_price)}</p>
                    </div>
                    <div className="text-center p-2 bg-slate-50 rounded">
                      <p className="text-slate-500 text-xs">Girilen Ders</p>
                      <p className="font-bold">{student.total_lessons}</p>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <p className="text-green-600 text-xs">Ödenen</p>
                      <p className="font-bold text-green-700">{formatCurrency(student.total_paid)}</p>
                    </div>
                    <div className="text-center p-2 bg-orange-50 rounded">
                      <p className="text-orange-600 text-xs">Kullanılan</p>
                      <p className="font-bold text-orange-700">{formatCurrency(student.used_amount)}</p>
                    </div>
                    <div className={`text-center p-2 rounded ${student.remaining_balance >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
                      <p className={`text-xs ${student.remaining_balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        Kalan ({student.remaining_lessons} ders)
                      </p>
                      <p className={`font-bold ${student.remaining_balance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                        {formatCurrency(student.remaining_balance)}
                      </p>
                    </div>
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

export default AdminStudentsByBranch;
