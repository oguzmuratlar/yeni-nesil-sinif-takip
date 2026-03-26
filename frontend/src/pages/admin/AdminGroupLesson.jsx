import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiClient from '../../api/axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { DateInput } from '../../components/ui/date-input';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const AdminGroupLesson = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [branch, setBranch] = useState(null);
  const [formData, setFormData] = useState({
    date: '',
    number_of_lessons: 1
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGroup();
  }, [id]);

  const fetchGroup = async () => {
    try {
      const [groupsRes, branchesRes] = await Promise.all([
        apiClient.get('/student-groups'),
        apiClient.get('/branches')
      ]);
      const foundGroup = groupsRes.data.find(g => g.id === id);
      setGroup(foundGroup);
      if (foundGroup) {
        const foundBranch = branchesRes.data.find(b => b.id === foundGroup.branch_id);
        setBranch(foundBranch);
      }
    } catch (error) {
      toast.error('Grup bilgileri yüklenemedi');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient.post(
        `/group-lessons?group_id=${id}&branch_id=${group.branch_id}&date=${formData.date}&number_of_lessons=${formData.number_of_lessons}`
      );
      toast.success(`Grup için ${group.student_ids.length} öğrenciye ders eklendi`);
      navigate('/admin/groups');
    } catch (error) {
      toast.error('Ders girişi başarısız');
    } finally {
      setLoading(false);
    }
  };

  if (!group) {
    return (
      <AdminLayout>
        <div className="text-center py-12">Yükleniyor...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <Button
          onClick={() => navigate('/admin/groups')}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Geri Dön
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-slate-800 mb-2">
            Grup Ders Girişi
          </h1>
          <p className="text-slate-600">{group.name} - {branch?.name}</p>
          <p className="text-sm text-slate-500 mt-1">{group.student_ids.length} öğrenciye ders eklenecek</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="admin-card p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="date">Ders Tarihi *</Label>
              <DateInput
                value={formData.date}
                onChange={(date) => setFormData({ ...formData, date })}
                placeholder="GG.AA.YYYY"
              />
              <p className="text-xs text-muted-foreground">Örnek: 12.02.2025</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="number">Ders Adedi *</Label>
              <Input
                id="number"
                type="number"
                min="1"
                value={formData.number_of_lessons}
                onChange={(e) => setFormData({ ...formData, number_of_lessons: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="admin-btn"
            >
              {loading ? 'Kaydediliyor...' : 'Ders Ekle'}
            </Button>
            <Button
              type="button"
              onClick={() => navigate('/admin/groups')}
              variant="outline"
            >
              İptal
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminGroupLesson;