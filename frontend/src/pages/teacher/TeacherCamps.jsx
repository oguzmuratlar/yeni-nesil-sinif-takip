import React, { useState, useEffect } from 'react';
import TeacherLayout from '../../components/layouts/TeacherLayout';
import apiClient from '../../api/axios';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { Tent, Users, ChevronDown, ChevronUp } from 'lucide-react';

const TeacherCamps = () => {
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCamp, setExpandedCamp] = useState(null);
  const [campStudents, setCampStudents] = useState({});

  useEffect(() => {
    fetchCamps();
  }, []);

  const fetchCamps = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/camps?include_completed=true');
      setCamps(response.data);
    } catch (error) {
      toast.error('Kamplar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchCampStudents = async (campId) => {
    if (campStudents[campId]) {
      // Already fetched
      return;
    }
    try {
      const response = await apiClient.get(`/camps/${campId}/students`);
      setCampStudents(prev => ({ ...prev, [campId]: response.data }));
    } catch (error) {
      toast.error('Katılımcılar yüklenemedi');
    }
  };

  const toggleCamp = (campId) => {
    if (expandedCamp === campId) {
      setExpandedCamp(null);
    } else {
      setExpandedCamp(campId);
      fetchCampStudents(campId);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'kesin_kayit':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Kesin Kayıt</span>;
      case 'yedek':
        return <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700">Yedek</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">Ön Kayıt</span>;
    }
  };

  const getCampStatusBadge = (status) => {
    if (status === 'completed') {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">Tamamlandı</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Aktif</span>;
  };

  return (
    <TeacherLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-3" data-testid="teacher-camps-title">
            Kamplarım
          </h1>
          <p className="text-lg text-stone-600">
            Size atanmış kamp organizasyonları
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-stone-600">Yükleniyor...</p>
          </div>
        ) : camps.length === 0 ? (
          <div className="teacher-card p-12 text-center">
            <Tent size={48} className="mx-auto mb-4 text-stone-400" />
            <p className="text-stone-600 text-lg">Size atanmış kamp bulunmuyor</p>
          </div>
        ) : (
          <div className="space-y-4">
            {camps.map((camp) => (
              <div key={camp.id} className="teacher-card overflow-hidden" data-testid={`camp-card-${camp.id}`}>
                {/* Camp Header */}
                <div 
                  className="p-6 cursor-pointer hover:bg-stone-50 transition-colors"
                  onClick={() => toggleCamp(camp.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Tent size={24} className="text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">{camp.name}</h3>
                        <p className="text-sm text-slate-600">
                          {camp.class_level}. Sınıf • {camp.total_participants} katılımcı
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getCampStatusBadge(camp.status)}
                      <Button variant="ghost" size="sm">
                        {expandedCamp === camp.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded Content - Students List */}
                {expandedCamp === camp.id && (
                  <div className="border-t">
                    <div className="p-6">
                      <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Users size={18} />
                        Katılımcı Listesi
                      </h4>
                      
                      {!campStudents[camp.id] ? (
                        <p className="text-slate-500 py-4 text-center">Yükleniyor...</p>
                      ) : campStudents[camp.id].length === 0 ? (
                        <p className="text-slate-500 py-4 text-center">Henüz katılımcı eklenmemiş</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-stone-50">
                              <tr>
                                <th className="text-left py-3 px-4 font-semibold text-slate-700">Öğrenci Adı</th>
                                <th className="text-left py-3 px-4 font-semibold text-slate-700">Veli Adı</th>
                                <th className="text-left py-3 px-4 font-semibold text-slate-700">Telefon</th>
                                <th className="text-center py-3 px-4 font-semibold text-slate-700">Kayıt Durumu</th>
                              </tr>
                            </thead>
                            <tbody>
                              {campStudents[camp.id].map((student) => (
                                <tr key={student.id} className="border-t">
                                  <td className="py-3 px-4 font-medium text-slate-800">{student.student_name}</td>
                                  <td className="py-3 px-4 text-slate-600">{student.parent_name}</td>
                                  <td className="py-3 px-4 text-slate-600">{student.phone}</td>
                                  <td className="py-3 px-4 text-center">{getStatusBadge(student.registration_status)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};

export default TeacherCamps;
