import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiClient from '../../api/axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Users, CheckCircle, Filter, Edit, Trash2, Eye } from 'lucide-react';

const AdminCamps = () => {
  const navigate = useNavigate();
  const [camps, setCamps] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCamp, setEditingCamp] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    class_level: '',
    teacher_id: '',
    per_student_teacher_fee: ''
  });

  useEffect(() => {
    fetchData();
  }, [showCompleted]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [campsRes, teachersRes] = await Promise.all([
        apiClient.get(`/camps?include_completed=${showCompleted}`),
        apiClient.get('/teachers')
      ]);
      setCamps(campsRes.data);
      setTeachers(teachersRes.data.filter(t => t.status === 'active'));
    } catch (error) {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (camp = null) => {
    if (camp) {
      setEditingCamp(camp);
      setFormData({
        name: camp.name,
        class_level: camp.class_level,
        teacher_id: camp.teacher_id,
        per_student_teacher_fee: camp.per_student_teacher_fee.toString()
      });
    } else {
      setEditingCamp(null);
      setFormData({
        name: '',
        class_level: '',
        teacher_id: '',
        per_student_teacher_fee: ''
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.class_level || !formData.teacher_id || !formData.per_student_teacher_fee) {
      toast.error('Tüm alanları doldurun');
      return;
    }

    try {
      const payload = {
        name: formData.name,
        class_level: formData.class_level,
        teacher_id: formData.teacher_id,
        per_student_teacher_fee: parseFloat(formData.per_student_teacher_fee)
      };

      if (editingCamp) {
        await apiClient.put(`/camps/${editingCamp.id}`, payload);
        toast.success('Kamp güncellendi');
      } else {
        await apiClient.post('/camps', payload);
        toast.success('Kamp oluşturuldu');
      }
      
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const handleComplete = async (campId) => {
    if (!window.confirm('Bu kampı tamamlandı olarak işaretlemek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await apiClient.put(`/camps/${campId}/complete`);
      toast.success('Kamp tamamlandı olarak işaretlendi');
      fetchData();
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const handleDelete = async (campId) => {
    if (!window.confirm('Bu kampı silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await apiClient.delete(`/camps/${campId}`);
      toast.success('Kamp silindi');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Silme işlemi başarısız');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'completed') {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">Tamamlandı</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Aktif</span>;
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-800 mb-2" data-testid="admin-camps-title">
              Kamplar
            </h1>
            <p className="text-slate-600">Kamp organizasyonlarını yönetin</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="admin-btn" data-testid="new-camp-btn">
                <Plus size={20} className="mr-2" />
                Yeni Kamp
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingCamp ? 'Kamp Düzenle' : 'Yeni Kamp Oluştur'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Kamp Adı *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Örn: Yaz Matematik Kampı"
                    data-testid="camp-name-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Kamp Sınıfı *</Label>
                  <Select value={formData.class_level} onValueChange={(value) => setFormData({ ...formData, class_level: value })}>
                    <SelectTrigger data-testid="camp-level-select">
                      <SelectValue placeholder="Sınıf seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5. Sınıf</SelectItem>
                      <SelectItem value="6">6. Sınıf</SelectItem>
                      <SelectItem value="7">7. Sınıf</SelectItem>
                      <SelectItem value="8">8. Sınıf</SelectItem>
                      <SelectItem value="Karma">Karma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Öğretmen *</Label>
                  <Select value={formData.teacher_id} onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}>
                    <SelectTrigger data-testid="camp-teacher-select">
                      <SelectValue placeholder="Öğretmen seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Öğretmene Öğrenci Başı Ücret (₺) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.per_student_teacher_fee}
                    onChange={(e) => setFormData({ ...formData, per_student_teacher_fee: e.target.value })}
                    placeholder="150"
                    data-testid="camp-fee-input"
                  />
                  <p className="text-xs text-slate-500">Ödeme yapan her öğrenci için öğretmene verilecek tutar</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSave} className="flex-1" data-testid="save-camp-btn">
                    {editingCamp ? 'Güncelle' : 'Oluştur'}
                  </Button>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter */}
        <div className="admin-card p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter size={18} className="text-slate-500" />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-slate-600">Tamamlanan kampları göster</span>
            </label>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Yükleniyor...</p>
          </div>
        ) : camps.length === 0 ? (
          <div className="admin-card p-12 text-center">
            <Users size={48} className="mx-auto mb-4 text-slate-400" />
            <p className="text-slate-600 text-lg">Henüz kamp oluşturulmamış</p>
            <p className="text-slate-500 text-sm mt-2">Yeni kamp oluşturmak için yukarıdaki butonu kullanın</p>
          </div>
        ) : (
          <div className="admin-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-4 px-4 font-semibold text-slate-700">Kamp Adı</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-700">Sınıf</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-700">Öğretmen</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-700">Öğr. Başı Ücret</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-700">Toplam</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-700">Kesin</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-700">Ödemeli</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-700">Durum</th>
                  <th className="text-right py-4 px-4 font-semibold text-slate-700">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {camps.map((camp) => (
                  <tr key={camp.id} className="border-t hover:bg-slate-50" data-testid={`camp-row-${camp.id}`}>
                    <td className="py-4 px-4 font-medium text-slate-800">{camp.name}</td>
                    <td className="py-4 px-4 text-slate-600">{camp.class_level}. Sınıf</td>
                    <td className="py-4 px-4 text-slate-600">{camp.teacher_name}</td>
                    <td className="py-4 px-4 text-center text-slate-600">{camp.per_student_teacher_fee} ₺</td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-semibold text-slate-800">{camp.total_participants}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-semibold text-blue-600">{camp.confirmed_count}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-semibold text-green-600">{camp.paid_count}</span>
                    </td>
                    <td className="py-4 px-4 text-center">{getStatusBadge(camp.status)}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/camps/${camp.id}/students`)}
                          data-testid={`camp-students-btn-${camp.id}`}
                        >
                          <Eye size={16} className="mr-1" />
                          Katılımcılar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(camp)}
                          data-testid={`camp-edit-btn-${camp.id}`}
                        >
                          <Edit size={16} />
                        </Button>
                        {camp.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleComplete(camp.id)}
                            className="text-green-600 hover:bg-green-50"
                            data-testid={`camp-complete-btn-${camp.id}`}
                          >
                            <CheckCircle size={16} className="mr-1" />
                            Tamamla
                          </Button>
                        )}
                        {camp.total_participants === 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(camp.id)}
                            className="text-red-600 hover:bg-red-50"
                            data-testid={`camp-delete-btn-${camp.id}`}
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCamps;
