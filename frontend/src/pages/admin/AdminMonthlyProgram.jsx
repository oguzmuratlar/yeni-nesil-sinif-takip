import React from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import { Calendar } from 'lucide-react';

const AdminMonthlyProgram = () => {
  return (
    <AdminLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-slate-800 mb-2" data-testid="admin-monthly-program-title">
            Aylık Program
          </h1>
          <p className="text-slate-600">Aylık ders ve ödeme programı</p>
        </div>

        <div className="admin-card p-12 text-center">
          <Calendar size={64} className="mx-auto mb-4 text-slate-400" />
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Yakında!</h3>
          <p className="text-slate-600">
            Aylık program özelliği yakında eklenecek. Bu bölümde tüm öğrencilerin aylık ders planlarını ve ödeme durumlarını görebileceksiniz.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminMonthlyProgram;