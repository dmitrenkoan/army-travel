import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationsBell from '../components/NotificationsBell';
import ComplaintButton from '../components/ComplaintButton';

const roleLabels: Record<string, string> = {
  super_admin: 'Супер адміністратор',
  unit_admin: 'Адміністратор частини',
  user: 'Користувач',
};

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/trips" className="topbar-brand">
          🚗 Попутники
        </NavLink>
        <nav className="topbar-nav">
          <NavLink to="/trips">Пошук поїздок</NavLink>
          <NavLink to="/trips/new">Додати поїздку</NavLink>
          <NavLink to="/my-trips">Мої поїздки (водій)</NavLink>
          <NavLink to="/my-bookings">Мої бронювання</NavLink>
          {user.role === 'super_admin' && <NavLink to="/military-units">Військові частини</NavLink>}
          {user.role === 'super_admin' && <NavLink to="/complaints">Скарги</NavLink>}
          {(user.role === 'super_admin' || user.role === 'unit_admin') && (
            <NavLink to="/people">
              {user.role === 'super_admin' ? 'Адміністратори' : 'Користувачі частини'}
            </NavLink>
          )}
        </nav>
        <div className="topbar-right">
          <ComplaintButton />
          <NotificationsBell />
          <div className="user-chip">
            <strong>{user.name}</strong>
            <span>{roleLabels[user.role]}</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Вийти
          </button>
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
