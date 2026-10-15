import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { apiErrorMessage } from '../api/client';
import RouteBuilder, { type RouteData } from '../components/RouteBuilder';

type Tab = 'route' | 'data';

export default function CreateTripPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('route');
  const [route, setRoute] = useState<RouteData | null>(null);

  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [hasReturnTrip, setHasReturnTrip] = useState(false);
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [seatsTotal, setSeatsTotal] = useState(1);
  const [carInfo, setCarInfo] = useState('');
  const [routeAdjustment, setRouteAdjustment] = useState('');
  const [additionalContact, setAdditionalContact] = useState('');
  const [notes, setNotes] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const routeReady = !!route;

  const handleSubmit = async () => {
    if (!route) {
      setError('Спочатку побудуйте маршрут поїздки.');
      setTab('route');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const { data } = await api.post('/trips', {
        origin_address: route.origin.address,
        origin_lat: route.origin.lat,
        origin_lng: route.origin.lng,
        destination_address: route.destination.address,
        destination_lat: route.destination.lat,
        destination_lng: route.destination.lng,
        route_path: route.routePath,
        distance_meters: route.distanceMeters,
        duration_seconds: route.durationSeconds,
        departure_date: departureDate,
        departure_time: departureTime,
        has_return_trip: hasReturnTrip,
        return_date: hasReturnTrip ? returnDate : null,
        return_time: hasReturnTrip ? returnTime : null,
        seats_total: seatsTotal,
        car_info: carInfo,
        route_adjustment: routeAdjustment || null,
        additional_contact: additionalContact || null,
        notes: notes || null,
      });
      navigate(`/my-trips`, { state: { createdTripId: data.data.id } });
    } catch (err) {
      setError(apiErrorMessage(err, 'Не вдалося створити поїздку.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Додати поїздку</h1>
          <p>Спочатку побудуйте маршрут на карті, потім заповніть дані поїздки.</p>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          <button className={`tab-btn ${tab === 'route' ? 'active' : ''}`} onClick={() => setTab('route')}>
            1. Маршрут
          </button>
          <button
            className={`tab-btn ${tab === 'data' ? 'active' : ''}`}
            onClick={() => setTab('data')}
            disabled={!routeReady}
          >
            2. Дані
          </button>
        </div>

        {tab === 'route' && (
          <RouteBuilder onChange={setRoute} />
        )}

        {tab === 'data' && (
          <div>
            <div className="form-grid">
              <div className="field">
                <label>ПІБ</label>
                <input className="input" value={user.name} disabled />
              </div>
              <div className="field">
                <label>Телефон</label>
                <input className="input" value={user.phone} disabled />
              </div>
              <div className="field">
                <label>Військова частина</label>
                <input className="input" value={user.military_unit?.name ?? '—'} disabled />
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label>Дата виїзду</label>
                <input
                  className="input"
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>Час виїзду</label>
                <input
                  className="input"
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="checkbox-row">
              <input
                id="has_return"
                type="checkbox"
                checked={hasReturnTrip}
                onChange={(e) => setHasReturnTrip(e.target.checked)}
              />
              <label htmlFor="has_return">Задати дату повернення зворотнім маршрутом</label>
            </div>

            {hasReturnTrip && (
              <div className="form-grid">
                <div className="field">
                  <label>Дата повернення</label>
                  <input
                    className="input"
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    required={hasReturnTrip}
                  />
                </div>
                <div className="field">
                  <label>Час повернення</label>
                  <input
                    className="input"
                    type="time"
                    value={returnTime}
                    onChange={(e) => setReturnTime(e.target.value)}
                    required={hasReturnTrip}
                  />
                </div>
              </div>
            )}

            <div className="form-grid">
              <div className="field">
                <label>Вільні місця</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={20}
                  value={seatsTotal}
                  onChange={(e) => setSeatsTotal(Number(e.target.value))}
                  required
                />
              </div>
              <div className="field">
                <label>Марка та номер авто</label>
                <input
                  className="input"
                  placeholder="наприклад, Toyota Camry AA1234BB"
                  value={carInfo}
                  onChange={(e) => setCarInfo(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label>Можливість коригувати маршрут</label>
              <input
                className="input"
                placeholder="наприклад +-2 години"
                value={routeAdjustment}
                onChange={(e) => setRouteAdjustment(e.target.value)}
              />
              <span className="sub-hint">наприклад +-2 години</span>
            </div>

            <div className="field">
              <label>Додатковий контакт чи номер телефону</label>
              <input
                className="input"
                value={additionalContact}
                onChange={(e) => setAdditionalContact(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Примітки</label>
              <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            {error && <p className="error-text">{error}</p>}

            <button className="btn" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Збереження…' : 'Опублікувати поїздку'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
