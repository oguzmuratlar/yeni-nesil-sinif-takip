import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Wallet, LogOut, Home } from 'lucide-react';

const TeacherLayout = ({ children }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/teacher/dashboard', label: 'Ana Sayfa', icon: Home },
    { path: '/teacher/students', label: 'Öğrencilerim', icon: Users },
    { path: '/teacher/balance', label: 'Bakiye Takip', icon: Wallet },
  ];

  return (
    <div className="min-h-screen teacher-bg">
      {/* Top Navigation */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-100 sticky top-0 z-10">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-teal-600" data-testid="teacher-logo">Eğitim Portalı</h1>
            
            <nav className="flex items-center gap-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    data-testid={`teacher-menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-md'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
              
              <button
                onClick={handleLogout}
                data-testid="teacher-logout-btn"
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-full transition-colors ml-4"
              >
                <LogOut size={18} />
                <span className="font-medium">Çıkış</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {children}
      </main>
    </div>
  );
};

export default TeacherLayout;
