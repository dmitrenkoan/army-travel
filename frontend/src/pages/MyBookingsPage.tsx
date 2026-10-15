import { useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../api/client';
import type { TripBooking } from '../types';

const statusLabels: Record<string, string> = {
  pending: 'На розгляді',
  confirmed: 'Підтверджена',
  rejected: 'Відхилена',
  cancelled: 'Скасована',
};

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<TripBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/bookings/mine');
      setBookings(data.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCancel = async (booking: TripBooking) => {
    if (!confirm('Скасувати цю заявку?')) return;
    setCancellingId(booking.id);
    try {
      await api.post(`/bookings/${booking.id}/cancel`);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Мої бронювання</h1>
          <p>Статус ваших заявок на участь у поїздках інших водіїв.</p>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading && <p className="text-muted">Завантаження…</p>}

      {!loading && bookings.length === 0 && (
        <div className="empty-state card">У вас ще немає заявок на поїздки.</div>
      )}

      {!loading &&
        bookings.map((b) => (
          <div key={b.id} className="card">
            <div className="trip-route-line">
              <span>📍 {b.pickup_address} → {b.dropoff_address}</span>
              <span className={`badge badge-${b.status}`}>{statusLabels[b.status]}</span>
            </div>
            <div className="trip-meta">
              <span>📅 {b.trip.departure_date} о {b.trip.departure_time}</span>
              <span>🚘 {b.trip.car_info}</span>
              <span>Водій: {b.trip.driver.name} · {b.trip.driver.phone}</span>
            </div>
            {b.status === 'rejected' && b.rejection_reason && (
              <p className="error-text">Причина відмови: {b.rejection_reason}</p>
            )}
            {(b.status === 'pending' || b.status === 'confirmed') && (
              <div className="trip-footer">
                <span />
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleCancel(b)}
                  disabled={cancellingId === b.id}
                >
                  Скасувати заявку
                </button>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
