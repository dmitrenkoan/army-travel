import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationsBell from '../components/NotificationsBell';
import ComplaintButton from '../components/ComplaintButton';
import NavDropdown from '../components/NavDropdown';

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

  const tripsItems = [
    { to: '/trips', label: 'Пошук поїздок' },
    { to: '/trips/new', label: 'Додати поїздку' },
    { to: '/my-trips', label: 'Мої поїздки (водій)' },
    { to: '/my-bookings', label: 'Мої бронювання' },
  ];

  const unitsItems = [
    ...(user.role === 'super_admin' ? [{ to: '/military-units', label: 'Військові частини' }] : []),
    ...(user.role === 'super_admin' || user.role === 'unit_admin'
      ? [{ to: '/people', label: user.role === 'super_admin' ? 'Адміністратори' : 'Користувачі частини' }]
      : []),
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/trips" className="topbar-brand">
          🚗 Попутники
        </NavLink>
        <nav className="topbar-nav">
          <NavDropdown label="Поїздки" items={tripsItems} />
          <NavDropdown label="В/ч та користувачі" items={unitsItems} />
          {user.role === 'super_admin' && <NavLink to="/complaints">Скарги</NavLink>}
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
