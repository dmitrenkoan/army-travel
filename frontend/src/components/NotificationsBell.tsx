import { useEffect, useRef, useState } from 'react';
import api from '../api/client';
import type { AppNotification } from '../types';

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'щойно';
  if (mins < 60) return `${mins} хв тому`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} год тому`;
  const days = Math.floor(hours / 24);
  return `${days} дн тому`;
}

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    try {
      const { data } = await api.get('/notifications');
      setItems(data.data);
      setUnread(data.unread_count);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      try {
        await api.post('/notifications/read-all');
        setUnread(0);
        setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
      } catch {
        // ignore
      }
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="notif-bell" onClick={handleOpen} aria-label="Сповіщення">
        🔔
        {unread > 0 && <span className="notif-dot" />}
      </button>
      {open && (
        <div className="notif-dropdown">
          {items.length === 0 && <div className="notif-item">Сповіщень немає</div>}
          {items.map((n) => (
            <div key={n.id} className={`notif-item ${n.read_at ? '' : 'unread'}`}>
              <div className="notif-title">{n.data.title}</div>
              <div>{n.data.message}</div>
              <div className="notif-time">{timeAgo(n.created_at)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
