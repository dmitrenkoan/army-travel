import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

interface NavDropdownItem {
  to: string;
  label: string;
}

interface Props {
  label: string;
  items: NavDropdownItem[];
}

function matchesPath(pathname: string, to: string): boolean {
  return pathname === to || pathname.startsWith(`${to}/`);
}

export default function NavDropdown({ label, items }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const location = useLocation();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  if (items.length === 0) return null;

  // A single item doesn't need a flyout — just render it like the other plain nav links.
  if (items.length === 1) {
    return <NavLink to={items[0].to}>{items[0].label}</NavLink>;
  }

  const isActive = items.some((item) => matchesPath(location.pathname, item.to));

  return (
    <div className="nav-dropdown" ref={ref}>
      <button
        type="button"
        className={`nav-dropdown-trigger ${isActive ? 'active' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
        <span className="nav-dropdown-caret">▾</span>
      </button>
      {open && (
        <div className="nav-dropdown-menu">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} className="nav-dropdown-item">
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
