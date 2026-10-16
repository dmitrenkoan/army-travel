import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { apiErrorMessage } from '../api/client';
import type { Trip, TripBooking } from '../types';

const statusLabels: Record<string, string> = {
  pending: 'На розгляді',
  confirmed: 'Підтверджена',
  rejected: 'Відхилена',
  cancelled: 'Скасована',
};

export default function MyTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejectingBooking, setRejectingBooking] = useState<TripBooking | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/trips/mine');
      setTrips(data.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleConfirm = async (booking: TripBooking) => {
    setBusyId(booking.id);
    setError(null);
    try {
      await api.post(`/bookings/${booking.id}/confirm`);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const submitReject = async () => {
    if (!rejectingBooking || !rejectReason.trim()) return;
    setBusyId(rejectingBooking.id);
    try {
      await api.post(`/bookings/${rejectingBooking.id}/reject`, { rejection_reason: rejectReason });
      setRejectingBooking(null);
      setRejectReason('');
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleCancelTrip = async (trip: Trip) => {
    if (!confirm('Скасувати цю поїздку? Усі заявки, що очікують, будуть відхилені.')) return;
    setBusyId(trip.id);
    try {
      await api.delete(`/trips/${trip.id}`);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Мої поїздки</h1>
          <p>Поїздки, які ви створили як водій, та заявки пасажирів на них.</p>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading && <p className="text-muted">Завантаження…</p>}

      {!loading && trips.length === 0 && (
        <div className="empty-state card">Ви ще не створили жодної поїздки.</div>
      )}

      {!loading &&
        trips.map((trip) => (
          <div key={trip.id} className="card">
            <div className="trip-route-line">
              <span>📍 {trip.origin_address} → {trip.destination_address}</span>
              <span className={`badge badge-${trip.status}`}>
                {trip.status === 'active' ? `${trip.seats_available}/${trip.seats_total} вільних` : trip.status}
              </span>
            </div>
            <div className="trip-meta">
              <span>📅 {trip.departure_date} о {trip.departure_time}</span>
              <span>🚘 {trip.car_info}</span>
              {trip.cargo_capacity && <span>📦 {trip.cargo_capacity}</span>}
            </div>

            {trip.bookings && trip.bookings.length > 0 && (
              <table style={{ marginTop: 12 }}>
                <thead>
                  <tr>
                    <th>Пасажир</th>
                    <th>Ділянка</th>
                    <th>Статус</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {trip.bookings.map((b) => (
                    <tr key={b.id}>
                      <td>{b.passenger.name}<br /><span className="text-muted">{b.passenger.phone}</span></td>
                      <td>{b.pickup_address} → {b.dropoff_address}</td>
                      <td><span className={`badge badge-${b.status}`}>{statusLabels[b.status]}</span></td>
                      <td>
                        {b.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-sm" onClick={() => handleConfirm(b)} disabled={busyId === b.id}>
                              Підтвердити
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => {
                                setRejectingBooking(b);
                                setRejectReason('');
                              }}
                              disabled={busyId === b.id}
                            >
                              Відхилити
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {trip.status === 'active' && (
              <div className="trip-footer" style={{ marginTop: 12 }}>
                <span />
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link to={`/trips/${trip.id}/edit`} className="btn btn-sm btn-secondary">
                    Редагувати
                  </Link>
                  <button className="btn btn-sm btn-danger" onClick={() => handleCancelTrip(trip)} disabled={busyId === trip.id}>
                    Скасувати поїздку
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

      {rejectingBooking && (
        <div className="modal-backdrop" onClick={() => setRejectingBooking(null)}>
          <div className="card modal" onClick={(e) => e.stopPropagation()}>
            <h3>Причина відмови</h3>
            <p className="text-muted">Пасажир {rejectingBooking.passenger.name} побачить вказану причину.</p>
            <div className="field">
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Напишіть причину відхилення заявки"
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setRejectingBooking(null)}>
                Скасувати
              </button>
              <button className="btn btn-danger" onClick={submitReject} disabled={!rejectReason.trim()}>
                Відхилити заявку
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
