import { useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../api/client';
import AddressAutocomplete, { type AddressValue } from '../components/AddressAutocomplete';
import RouteMap from '../components/RouteMap';
import type { Trip } from '../types';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h === 0) return `${m} хв`;
  return `${h} год ${m > 0 ? `${m} хв` : ''}`.trim();
}

function formatDistance(meters: number): string {
  return `${Math.round(meters / 1000)} км`;
}

export default function TripsSearchPage() {
  const [originText, setOriginText] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [origin, setOrigin] = useState<AddressValue | null>(null);
  const [destination, setDestination] = useState<AddressValue | null>(null);
  const [date, setDate] = useState('');

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bookingTripId, setBookingTripId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ title: string; text: string } | null>(null);
  const [viewingTrip, setViewingTrip] = useState<Trip | null>(null);
  const [revealedContacts, setRevealedContacts] = useState<number[]>([]);

  const toggleContact = (tripId: number) => {
    setRevealedContacts((prev) =>
      prev.includes(tripId) ? prev.filter((id) => id !== tripId) : [...prev, tripId]
    );
  };

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/trips', { params: { exclude_mine: 1, date: date || undefined } });
      setTrips(data.data);
      setSearched(false);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async () => {
    if (!origin || !destination) {
      setError('Оберіть пункт виїзду та пункт призначення зі списку підказок.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/trips', {
        params: {
          origin_lat: origin.lat,
          origin_lng: origin.lng,
          destination_lat: destination.lat,
          destination_lng: destination.lng,
          date: date || undefined,
          exclude_mine: 1,
        },
      });
      setTrips(data.data);
      setSearched(true);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (trip: Trip) => {
    setBookingTripId(trip.id);
    setError(null);
    try {
      const pickup = trip.match
        ? { address: origin?.address ?? trip.origin_address, lat: trip.match.pickup.lat, lng: trip.match.pickup.lng }
        : { address: trip.origin_address, lat: trip.origin_lat, lng: trip.origin_lng };
      const dropoff = trip.match
        ? { address: destination?.address ?? trip.destination_address, lat: trip.match.dropoff.lat, lng: trip.match.dropoff.lng }
        : { address: trip.destination_address, lat: trip.destination_lat, lng: trip.destination_lng };

      await api.post(`/trips/${trip.id}/bookings`, {
        pickup_address: pickup.address,
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        dropoff_address: dropoff.address,
        dropoff_lat: dropoff.lat,
        dropoff_lng: dropoff.lng,
        leg_duration_seconds: trip.match?.leg_duration_seconds ?? trip.duration_seconds,
        leg_distance_meters: trip.match?.leg_distance_meters ?? trip.distance_meters,
      });

      setNotice({
        title: 'Заявку подано',
        text: `Ваша заявка подана на розгляд ${trip.driver.name}`,
      });
      setTrips((prev) => prev.filter((t) => t.id !== trip.id));
    } catch (err) {
      setError(apiErrorMessage(err, 'Не вдалося забронювати місце.'));
    } finally {
      setBookingTripId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Пошук поїздок</h1>
          <p>Знайдіть попутника за напрямком — враховуються й проміжні ділянки чужих маршрутів.</p>
        </div>
      </div>

      <div className="card">
        <div className="form-grid">
          <div className="field">
            <label>Пункт виїзду</label>
            <AddressAutocomplete
              placeholder="Звідки їдете"
              value={originText}
              onChange={setOriginText}
              onSelect={(v) => {
                setOriginText(v.address);
                setOrigin(v);
              }}
            />
          </div>
          <div className="field">
            <label>Пункт призначення</label>
            <AddressAutocomplete
              placeholder="Куди їдете"
              value={destinationText}
              onChange={setDestinationText}
              onSelect={(v) => {
                setDestinationText(v.address);
                setDestination(v);
              }}
            />
          </div>
          <div className="field">
            <label>Дата (необов'язково)</label>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <button className="btn" onClick={handleSearch} disabled={loading}>
          Знайти поїздку
        </button>
        {searched && (
          <button className="btn btn-secondary" style={{ marginLeft: 8 }} onClick={loadAll} disabled={loading}>
            Показати всі поїздки
          </button>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}

      <div style={{ marginTop: 20 }}>
        {loading && <p className="text-muted">Завантаження…</p>}
        {!loading && trips.length === 0 && (
          <div className="empty-state card">Поїздок не знайдено. Спробуйте інший напрямок або дату.</div>
        )}
        {!loading &&
          trips.map((trip) => (
            <div key={trip.id} className="trip-result">
              <div className="trip-route-line">
                <span>
                  {trip.match ? (
                    <>
                      📍 {origin?.address ?? trip.origin_address} → {destination?.address ?? trip.destination_address}
                    </>
                  ) : (
                    <>
                      📍 {trip.origin_address} → {trip.destination_address}
                    </>
                  )}
                </span>
                <span className={`badge badge-${trip.status}`}>{trip.seats_available} вільних місць</span>
              </div>
              {trip.match && (
                <p className="hint">Проміжна ділянка маршруту водія: {trip.origin_address} → {trip.destination_address}</p>
              )}
              <div className="trip-meta">
                <span>📅 {trip.departure_date} о {trip.departure_time}</span>
                <span>⏱ У дорозі: {formatDuration(trip.match?.leg_duration_seconds ?? trip.duration_seconds)}</span>
                <span>📏 {formatDistance(trip.match?.leg_distance_meters ?? trip.distance_meters)}</span>
                {trip.route_adjustment && <span>🔄 Коригування часу: {trip.route_adjustment}</span>}
                <span>🚘 {trip.car_info}</span>
              </div>
              {revealedContacts.includes(trip.id) && (
                <div className="contact-panel">
                  <div>
                    <span className="contact-label">ПІБ водія</span>
                    <strong>{trip.driver.name}</strong>
                  </div>
                  <div>
                    <span className="contact-label">Телефон</span>
                    <a href={`tel:${trip.driver.phone}`}>{trip.driver.phone}</a>
                  </div>
                  {trip.additional_contact && (
                    <div>
                      <span className="contact-label">Додатковий контакт</span>
                      <strong>{trip.additional_contact}</strong>
                    </div>
                  )}
                </div>
              )}

              <div className="trip-footer">
                <span className="text-muted">
                  {trip.military_unit?.name ?? 'Військова частина не вказана'}
                </span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => toggleContact(trip.id)}>
                    {revealedContacts.includes(trip.id) ? 'Сховати контакт' : 'Показати контакт'}
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => setViewingTrip(trip)}>
                    Показати маршрут
                  </button>
                  <button className="btn btn-sm" onClick={() => handleBook(trip)} disabled={bookingTripId === trip.id}>
                    {bookingTripId === trip.id ? 'Бронюємо…' : 'Забронювати місце'}
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {viewingTrip && (
        <div className="modal-backdrop" onClick={() => setViewingTrip(null)}>
          <div className="card modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <h3>
              Маршрут: {viewingTrip.origin_address} → {viewingTrip.destination_address}
            </h3>
            <RouteMap
              routePath={viewingTrip.route_path}
              pickup={viewingTrip.match ? viewingTrip.match.pickup : null}
              dropoff={viewingTrip.match ? viewingTrip.match.dropoff : null}
            />
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setViewingTrip(null)}>
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}

      {notice && (
        <div className="modal-backdrop" onClick={() => setNotice(null)}>
          <div className="card modal" onClick={(e) => e.stopPropagation()}>
            <h3>{notice.title}</h3>
            <p>{notice.text}</p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setNotice(null)}>
                Добре
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
