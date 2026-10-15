import { useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../api/client';
import type { Complaint } from '../types';

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/complaints');
        setComplaints(data.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Скарги</h1>
          <p>Скарги користувачів із контактними даними заявників.</p>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading && <p className="text-muted">Завантаження…</p>}

      {!loading && complaints.length === 0 && (
        <div className="empty-state card">Скарг ще немає.</div>
      )}

      {!loading &&
        complaints.map((c) => (
          <div key={c.id} className="card">
            <div className="trip-route-line">
              <span>
                {c.trip
                  ? `📍 ${c.trip.origin_address} → ${c.trip.destination_address}`
                  : 'Загальна скарга'}
              </span>
              <span className="text-muted" style={{ fontSize: 13 }}>
                {formatDateTime(c.created_at)}
              </span>
            </div>

            <p style={{ whiteSpace: 'pre-wrap', margin: '10px 0' }}>{c.message}</p>

            <div className="contact-panel">
              <div>
                <span className="contact-label">Скаргу залишив</span>
                <strong>{c.reporter.name}</strong>
              </div>
              <div>
                <span className="contact-label">Телефон</span>
                <a href={`tel:${c.reporter.phone}`}>{c.reporter.phone}</a>
              </div>
              {c.reporter.email && (
                <div>
                  <span className="contact-label">Email</span>
                  <a href={`mailto:${c.reporter.email}`}>{c.reporter.email}</a>
                </div>
              )}
              <div>
                <span className="contact-label">Військова частина</span>
                <strong>{c.reporter.military_unit?.name ?? '—'}</strong>
              </div>
            </div>

            {c.trip && (
              <div className="trip-meta" style={{ marginTop: 10 }}>
                {c.reported_user && (
                  <span>Скарга на водія: {c.reported_user.name} · {c.reported_user.phone}</span>
                )}
                {c.reported_user?.military_unit && <span>ВЧ водія: {c.reported_user.military_unit.name}</span>}
                <span>
                  📅 {c.trip.departure_date} о {c.trip.departure_time} · 🚘 {c.trip.car_info}
                </span>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
