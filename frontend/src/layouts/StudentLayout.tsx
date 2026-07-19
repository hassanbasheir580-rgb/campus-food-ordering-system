import { LogOut, ShoppingCart, UtensilsCrossed } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { appConfig } from '../config/appConfig';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export const StudentLayout = () => {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-surface">
      <nav className="student-nav">
        <NavLink to="/student" className="brand-mark">
          <UtensilsCrossed size={24} />
          <span>Campus Bites</span>
        </NavLink>
        <div className="student-links">
          {appConfig.nav.student.map(({ label, path, icon: Icon }) => (
            <NavLink key={path} to={path}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>
        <div className="nav-profile">
          <NavLink to="/student/cart" className="cart-pill" aria-label={`${totalItems} cart items`}>
            <ShoppingCart size={18} />
            {totalItems}
          </NavLink>
          <span>{user?.name}</span>
          <button className="icon-button" onClick={onLogout} aria-label="Log out">
            <LogOut size={18} />
          </button>
        </div>
      </nav>
      <main className="student-main">
        <Outlet />
      </main>
    </div>
  );
};
