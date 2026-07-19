import { LogOut, UtensilsCrossed } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { appConfig } from '../config/appConfig';
import { useAuth } from '../context/AuthContext';

type NavKey = 'vendor' | 'admin' | 'staff';

export const DashboardLayout = ({ navKey }: { navKey: NavKey }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = appConfig.nav[navKey];

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <NavLink to={navItems[0].path} className="brand-mark">
          <UtensilsCrossed size={24} />
          <span>Campus Ops</span>
        </NavLink>
        <div className="sidebar-user">
          <strong>{user?.name}</strong>
          <span>{user?.role}</span>
        </div>
        <nav>
          {navItems.map(({ label, path, icon: Icon }) => (
            <NavLink key={path} to={path}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button className="ghost-button sidebar-logout" onClick={onLogout}>
          <LogOut size={18} />
          Log out
        </button>
      </aside>
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
};
