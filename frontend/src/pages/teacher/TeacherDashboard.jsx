import React from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from '../../components/layouts/TeacherLayout';
import { Users, Wallet, ArrowRight, Calendar, Tent, Youtube } from 'lucide-react';

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
      description: 'Ders planlamanızı görüntüleyin',
      icon: Calendar,
      color: 'bg-blue-500',
      path: '/teacher/schedule',
      testId: 'teacher-dashboard-schedule-card'
    },
    {
      title: 'Kamplarım',
      description: 'Atanan kamplarınızı görüntüleyin',
      icon: Tent,
      color: 'bg-emerald-500',
      path: '/teacher/camps',
      testId: 'teacher-dashboard-camps-card'
    },
    {
      title: 'YouTube',
      description: 'Video çekim kazançlarınız',
      icon: Youtube,
      color: 'bg-red-500',
      path: '/teacher/youtube',
      testId: 'teacher-dashboard-youtube-card'
    },
  ];

  return (
    <TeacherLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header - Mobile optimized */}
        <div className="mb-8 lg:mb-12 text-center">
          <h1 className="text-3xl lg:text-5xl font-extrabold text-slate-800 mb-2 lg:mb-3" data-testid="teacher-dashboard-title">
            Öğretmen Portalı
          </h1>
          <p className="text-base lg:text-lg text-stone-600">
            Öğrencilerinizi yönetin ve dersleri takip edin
          </p>
        </div>

        {/* Cards Grid - Mobile optimized */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6 mb-8 lg:mb-12">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.path}
                onClick={() => navigate(card.path)}
                data-testid={card.testId}
                className="teacher-card p-4 lg:p-8 cursor-pointer group active:scale-95 transition-transform"
              >
                <div className={`${card.color} w-10 h-10 lg:w-14 lg:h-14 rounded-lg lg:rounded-xl flex items-center justify-center mb-3 lg:mb-5 group-hover:scale-110 transition-transform`}>
                  <Icon size={20} className="lg:hidden text-white" />
                  <Icon size={28} className="hidden lg:block text-white" />
                </div>
                <h3 className="text-base lg:text-xl font-bold text-slate-800 mb-1 lg:mb-2">{card.title}</h3>
                <p className="text-stone-600 text-xs lg:text-sm leading-relaxed hidden sm:block">{card.description}</p>
                <div className="flex items-center gap-1 lg:gap-2 text-teal-600 font-semibold mt-2 lg:mt-4 group-hover:gap-2 lg:group-hover:gap-4 transition-all text-sm lg:text-base">
                  <span>Aç</span>
                  <ArrowRight size={16} className="lg:hidden" />
                  <ArrowRight size={18} className="hidden lg:block" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Welcome Card - Mobile optimized */}
        <div className="teacher-card p-6 lg:p-10 bg-gradient-to-br from-teal-50 to-stone-50 text-center">
          <h3 className="text-xl lg:text-2xl font-bold text-slate-800 mb-2 lg:mb-3">
            Hoş Geldiniz!
          </h3>
          <p className="text-sm lg:text-base text-stone-600 max-w-2xl mx-auto leading-relaxed">
            Portalımız üzerinden öğrencilerinizin ders takibini yapabilir ve kazancınızı takip edebilirsiniz.
          </p>
        </div>
      </div>
    </TeacherLayout>
  );
};

export default TeacherDashboard;
