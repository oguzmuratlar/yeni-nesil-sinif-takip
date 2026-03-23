import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiClient from '../../api/axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Plus, X } from 'lucide-react';

const AdminTeacherForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    season_id: '',
    username: '',
    password: '',
    branches: [],  // [{branch_id, birebir_price, group_prices: {1, 2, 3, 4}}]
  });
  const [seasons, setSeasons] = useState([]);
  const [branches, setBranches] = useState([]);
  const [lessonTypes, setLessonTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [newBranch, setNewBranch] = useState({
    branch_id: '',
    birebir_price: '',
    group_1: '',
    group_2: '',
    group_3: '',
    group_4: ''
  });

  useEffect(() => {
    fetchReferenceData();
    if (isEdit) {
      fetchTeacher();
    }
  }, [id]);

  const fetchReferenceData = async () => {
    try {
      const [seasonsRes, branchesRes, typesRes] = await Promise.all([
        apiClient.get('/seasons'),
        apiClient.get('/branches'),
        apiClient.get('/lesson-types')
      ]);
      setSeasons(seasonsRes.data.filter(s => s.status === 'active'));
      setBranches(branchesRes.data);
      setLessonTypes(typesRes.data);
    } catch (error) {
      toast.error('Veriler yüklenemedi');
    }
  };

  const fetchTeacher = async () => {
    try {
      const response = await apiClient.get(`/teachers/${id}`);
      setFormData(response.data);
    } catch (error) {
      toast.error('Öğretmen bilgileri yüklenemedi');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        await apiClient.put(`/teachers/${id}`, {
          name: formData.name,
          phone: formData.phone,
          season_id: formData.season_id
        });
        toast.success('Öğretmen güncellendi');
      } else {
        // First create teacher
        const teacherResponse = await apiClient.post('/teachers', {
          name: formData.name,
          phone: formData.phone,
          season_id: formData.season_id
        });
        const teacherId = teacherResponse.data.id;
        
        // Create prices for each branch
        const birebirType = lessonTypes.find(t => t.name === 'Birebir');
        const grupType = lessonTypes.find(t => t.name === 'Grup');
        
        for (const branch of formData.branches) {
          // Birebir price
          await apiClient.post('/teacher-prices', {
            teacher_id: teacherId,
            branch_id: branch.branch_id,
            lesson_type_id: birebirType.id,
            price: parseFloat(branch.birebir_price),
            season_id: formData.season_id
          });
          
          // Group prices
          if (grupType) {
            for (let i = 1; i <= 4; i++) {
              const groupPrice = branch[`group_${i}`];
              if (groupPrice) {
                await apiClient.post('/teacher-prices', {
                  teacher_id: teacherId,
                  branch_id: branch.branch_id,
                  lesson_type_id: grupType.id,
                  price: parseFloat(groupPrice),
                  group_size: i,
                  season_id: formData.season_id
                });
              }
            }
          }
        }
        
        // Then create user for this teacher
        await apiClient.post('/auth/register', {
          username: formData.username,
          password: formData.password,
          user_type: 'teacher',
          teacher_id: teacherId
        });
        
        toast.success('Öğretmen ve kullanıcı oluşturuldu');
      }
      navigate('/admin/teachers');
    } catch (error) {
      toast.error(error.response?.data?.detail || (isEdit ? 'Güncelleme başarısız' : 'Ekleme başarısız'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddBranch = () => {
    if (!newBranch.branch_id || !newBranch.birebir_price) {
      toast.error('Branş ve birebir ders ücreti zorunlu');
      return;
    }
    
    formData.branches.push({
      branch_id: newBranch.branch_id,
      birebir_price: newBranch.birebir_price,
      group_1: newBranch.group_1,
      group_2: newBranch.group_2,
      group_3: newBranch.group_3,
      group_4: newBranch.group_4
    });
    
    setFormData({ ...formData });
    setNewBranch({ branch_id: '', birebir_price: '', group_1: '', group_2: '', group_3: '', group_4: '' });
    setBranchDialogOpen(false);
    toast.success('Branş eklendi');
  };

  const handleRemoveBranch = (index) => {
    formData.branches.splice(index, 1);
    setFormData({ ...formData });
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-slate-800 mb-2" data-testid="teacher-form-title">
            {isEdit ? 'Öğretmen Düzenle' : 'Yeni Öğretmen Ekle'}
          </h1>
          <p className="text-slate-600">Öğretmen bilgilerini girin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="admin-card p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Öğretmen Adı *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="teacher-name-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                data-testid="teacher-phone-input"
              />
            </div>

            {!isEdit && (
              <>
                <div className="col-span-2 mt-4">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Kullanıcı Bilgileri</h3>
                  <p className="text-sm text-slate-600 mb-4">Öğretmen için giriş yapabilmesi için kullanıcı bilgileri</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">Kullanıcı Adı *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required={!isEdit}
                    data-testid="teacher-username-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Şifre *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!isEdit}
                    data-testid="teacher-password-input"
                  />
                </div>
              </>
            )}
          </div>

          {!isEdit && (
            <div className="admin-card p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">Branş ve Ücretlendirme</h3>
                <Dialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline">
                      <Plus size={16} className="mr-2" />
                      Branş Ekle
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Branş ve Fiyatlandırma Ekle</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Branş *</Label>
                        <Select value={newBranch.branch_id} onValueChange={(value) => setNewBranch({ ...newBranch, branch_id: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Branş seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {branches.map((branch) => (
                              <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Birebir Ders Ücreti (₺) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newBranch.birebir_price}
                          onChange={(e) => setNewBranch({ ...newBranch, birebir_price: e.target.value })}
                          placeholder="200"
                        />
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-semibold text-slate-800 mb-3">Grup Dersi Ücretleri</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>1 Kişilik Grup (₺)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={newBranch.group_1}
                              onChange={(e) => setNewBranch({ ...newBranch, group_1: e.target.value })}
                              placeholder="150"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>2 Kişilik Grup (₺)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={newBranch.group_2}
                              onChange={(e) => setNewBranch({ ...newBranch, group_2: e.target.value })}
                              placeholder="100"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>3 Kişilik Grup (₺)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={newBranch.group_3}
                              onChange={(e) => setNewBranch({ ...newBranch, group_3: e.target.value })}
                              placeholder="75"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>4 Kişilik Grup (₺)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={newBranch.group_4}
                              onChange={(e) => setNewBranch({ ...newBranch, group_4: e.target.value })}
                              placeholder="60"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button type="button" onClick={handleAddBranch} className="flex-1">Ekle</Button>
                        <Button type="button" variant="outline" onClick={() => setBranchDialogOpen(false)}>İptal</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              {formData.branches.length > 0 ? (
                <div className="space-y-3">
                  {formData.branches.map((branch, index) => {
                    const branchData = branches.find(b => b.id === branch.branch_id);
                    return (
                      <div key={index} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-800 mb-2">{branchData?.name}</p>
                            <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                              <p>• Birebir: {branch.birebir_price} ₺</p>
                              {branch.group_1 && <p>• Grup 1: {branch.group_1} ₺</p>}
                              {branch.group_2 && <p>• Grup 2: {branch.group_2} ₺</p>}
                              {branch.group_3 && <p>• Grup 3: {branch.group_3} ₺</p>}
                              {branch.group_4 && <p>• Grup 4: {branch.group_4} ₺</p>}
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveBranch(index)}
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-600 text-center py-8">Branş ekleyin</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button
              type="submit"
              disabled={loading}
              data-testid="save-teacher-btn"
              className="admin-btn"
            >
              {loading ? 'Kaydediliyor...' : (isEdit ? 'Güncelle' : 'Kaydet')}
            </Button>
            <Button
              type="button"
              onClick={() => navigate('/admin/teachers')}
              variant="outline"
              data-testid="cancel-btn"
            >
              İptal
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminTeacherForm;