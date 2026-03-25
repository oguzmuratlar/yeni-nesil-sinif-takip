import React from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from '../../components/layouts/TeacherLayout';
import { Users, Wallet, BookOpen, ArrowRight, Calendar, Tent, Youtube } from 'lucide-react';

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
    {
      title: 'Ders Programı',
      description: 'Ders planlamanızı görüntüleyin ve düzenleyin',
      icon: Calendar,
      color: 'bg-blue-500',
      path: '/teacher/schedule',
      testId: 'teacher-dashboard-schedule-card'
    },
    {
      title: 'Kamplarım',
      description: 'Atanan kamplarınızı ve katılımcıları görüntüleyin',
      icon: Tent,
      color: 'bg-emerald-500',
      path: '/teacher/camps',
      testId: 'teacher-dashboard-camps-card'
    },
    {
      title: 'YouTube Kazançları',
      description: 'Video çekim kazançlarınızı görüntüleyin',
      icon: Youtube,
      color: 'bg-red-500',
      path: '/teacher/youtube',
      testId: 'teacher-dashboard-youtube-card'
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.path}
                onClick={() => navigate(card.path)}
                data-testid={card.testId}
                className="teacher-card p-8 cursor-pointer group"
              >
                <div className={`${card.color} w-14 h-14 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <Icon size={28} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{card.title}</h3>
                <p className="text-stone-600 mb-4 text-sm leading-relaxed">{card.description}</p>
                <div className="flex items-center gap-2 text-teal-600 font-semibold group-hover:gap-4 transition-all">
                  <span>Aç</span>
                  <ArrowRight size={18} />
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
