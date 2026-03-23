import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  GraduationCap, 
  CreditCard, 
  Calendar, 
  UserPlus, 
  LogOut,
  LayoutDashboard,
  Landmark,
  BookOpen,
  UsersRound
} from 'lucide-react';

const AdminLayout = ({ children }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin/dashboard', label: 'Ana Sayfa', icon: LayoutDashboard },
    { path: '/admin/students', label: 'Öğrenciler', icon: Users },
    { path: '/admin/teachers', label: 'Öğretmenler', icon: GraduationCap },
    { path: '/admin/groups', label: 'Gruplar', icon: UsersRound },
    { path: '/admin/branches', label: 'Branşlar', icon: BookOpen },
    { path: '/admin/payments', label: 'Ödemeler', icon: CreditCard },
    { path: '/admin/bank-accounts', label: 'Banka Hesapları', icon: Landmark },
    { path: '/admin/monthly-program', label: 'Aylık Program', icon: Calendar },
    { path: '/admin/users/new', label: 'Kullanıcı Ekle', icon: UserPlus },
  ];

  return (
    <div className="min-h-screen admin-bg">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 shadow-sm z-10">
        <div className="p-6">
          <h1 className="text-2xl font-extrabold text-blue-600" data-testid="admin-logo">Eğitim Yönetim</h1>
          <p className="text-sm text-slate-500 mt-1">Admin Paneli</p>
        </div>
        
        <nav className="mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`admin-menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <button
            onClick={handleLogout}
            data-testid="admin-logout-btn"
            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
