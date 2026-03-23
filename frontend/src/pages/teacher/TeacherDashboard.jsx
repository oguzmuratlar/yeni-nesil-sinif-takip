import React from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from '../../components/layouts/TeacherLayout';
import { Users, Wallet, BookOpen, ArrowRight } from 'lucide-react';

const TeacherDashboard = () => {
  const navigate = useNavigate();

  const cards = [
    {
      title: 'Öğrencilerim',
      description: 'Öğrencilerinizi görüntüleyin ve ders takibi yapın',
      icon: Users,
      color: 'bg-teal-500',
      path: '/teacher/students',
      testId: 'teacher-dashboard-students-card'
    },
    {
      title: 'Bakiye Takip',
      description: 'Kazancınızı ve ödeme geçmişinizi görüntüleyin',
      icon: Wallet,
      color: 'bg-amber-500',
      path: '/teacher/balance',
      testId: 'teacher-dashboard-balance-card'
    },
  ];

  return (
    <TeacherLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-3" data-testid="teacher-dashboard-title">
            Öğretmen Portalı
          </h1>
          <p className="text-lg text-stone-600">
            Öğrencilerinizi yönetin ve dersleri takip edin
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.path}
                onClick={() => navigate(card.path)}
                data-testid={card.testId}
                className="teacher-card p-10 cursor-pointer group"
              >
                <div className={`${card.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon size={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">{card.title}</h3>
                <p className="text-stone-600 mb-6 leading-relaxed">{card.description}</p>
                <div className="flex items-center gap-2 text-teal-600 font-semibold group-hover:gap-4 transition-all">
                  <span>Aç</span>
                  <ArrowRight size={20} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="teacher-card p-10 bg-gradient-to-br from-teal-50 to-stone-50 text-center">
          <BookOpen size={48} className="mx-auto mb-4 text-teal-600" />
          <h3 className="text-2xl font-bold text-slate-800 mb-3">
            Hoş Geldiniz! 🎓
          </h3>
          <p className="text-stone-600 max-w-2xl mx-auto leading-relaxed">
            Portalımız üzerinden öğrencilerinizin ders takibini yapabilir, 
            ders planlarını oluşturabilir ve kazancınızı takip edebilirsiniz.
          </p>
        </div>
      </div>
    </TeacherLayout>
  );
};

export default TeacherDashboard;
