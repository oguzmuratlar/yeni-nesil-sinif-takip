import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiClient from '../../api/axios';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Plus, Users } from 'lucide-react';
import { toast } from 'sonner';

const AdminBranches = () => {
  const [branches, setBranches] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [branchesRes, teachersRes] = await Promise.all([
        apiClient.get('/branches'),
        apiClient.get('/teachers')
      ]);
      setBranches(branchesRes.data);
      setTeachers(teachersRes.data);
    } catch (error) {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBranch = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post(`/branches?name=${encodeURIComponent(newBranchName)}`);
      toast.success('Branş eklendi');
      setDialogOpen(false);
      setNewBranchName('');
      fetchData();
    } catch (error) {
      toast.error('Branş eklenemedi');
    }
  };

  const getBranchTeachers = (branchId) => {
    // This would need teacher_branches table, for now show all teachers
    return teachers.filter(t => t.status === 'active');
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-800 mb-2" data-testid="admin-branches-title">
              Branş Yönetimi
            </h1>
            <p className="text-slate-600">Branşları ve öğretmenlerini görüntüleyin</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-branch-btn" className="admin-btn">
                <Plus size={20} className="mr-2" />
                Branş Ekle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Branş Ekle</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddBranch} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="branch_name">Branş Adı *</Label>
                  <Input
                    id="branch_name"
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    placeholder="Örn: Fizik"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1">Kaydet</Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Yükleniyor...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map((branch) => {
              const branchTeachers = getBranchTeachers(branch.id);
              return (
                <div
                  key={branch.id}
                  data-testid={`branch-card-${branch.id}`}
                  className="admin-card p-6 cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => setSelectedBranch(selectedBranch?.id === branch.id ? null : branch)}
                >
                  <h3 className="text-xl font-bold text-slate-800 mb-3">{branch.name}</h3>
                  <div className="flex items-center gap-2 text-slate-600 mb-4">
                    <Users size={18} />
                    <span className="text-sm">{branchTeachers.length} öğretmen</span>
                  </div>
                  
                  {selectedBranch?.id === branch.id && branchTeachers.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <p className="text-sm font-semibold text-slate-700 mb-2">Öğretmenler:</p>
                      <div className="space-y-1">
                        {branchTeachers.map((teacher) => (
                          <p key={teacher.id} className="text-sm text-slate-600">• {teacher.name}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBranches;