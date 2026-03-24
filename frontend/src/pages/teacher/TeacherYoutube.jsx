import React, { useState, useEffect } from 'react';
import TeacherLayout from '../../components/layouts/TeacherLayout';
import apiClient from '../../api/axios';
import { Youtube } from 'lucide-react';
import { toast } from 'sonner';

const TeacherYoutube = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await apiClient.get('/youtube-contents');
      setRecords(response.data);
    } catch (error) {
      toast.error('Kayıtlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // Toplam kazanç hesapla
  const totalEarnings = records
    .filter(r => r.status === 'active')
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <TeacherLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-12 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Youtube size={32} className="text-red-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-3" data-testid="teacher-youtube-title">
            YouTube Kazançlarım
          </h1>
          <p className="text-lg text-stone-600">
            Video çekimlerinden kazandığınız tutarlar
          </p>
        </div>

        {/* Toplam Kazanç */}
        <div className="teacher-card p-8 mb-8 text-center">
          <p className="text-sm text-stone-500 mb-2">Toplam YouTube Kazancı</p>
          <p className="text-4xl font-bold text-red-600">{totalEarnings.toFixed(2)} ₺</p>
          <p className="text-sm text-stone-500 mt-2">{records.filter(r => r.status === 'active').length} aktif kayıt</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-stone-600">Yükleniyor...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="teacher-card p-12 text-center">
            <Youtube size={48} className="mx-auto mb-4 text-stone-400" />
            <p className="text-stone-600 text-lg">Henüz YouTube kaydınız bulunmuyor</p>
          </div>
        ) : (
          <div className="teacher-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-stone-50">
                <tr>
                  <th className="text-left py-4 px-4 font-semibold text-slate-700">Başlık</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-700">Tutar</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-700">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {records.filter(r => r.status === 'active').map((record) => (
                  <tr key={record.id} className="border-t hover:bg-stone-50" data-testid={`youtube-row-${record.id}`}>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                          <Youtube size={20} className="text-red-600" />
                        </div>
                        <span className="font-medium text-slate-800">{record.title}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-bold text-green-600 text-lg">{record.amount} ₺</span>
                    </td>
                    <td className="py-4 px-4 text-center text-slate-600">{record.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};

export default TeacherYoutube;
