import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { apiErrorMessage } from '../api/client';
import RouteBuilder, { type RouteData } from '../components/RouteBuilder';
import type { Trip } from '../types';

type Tab = 'route' | 'data';

export default function CreateTripPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [tab, setTab] = useState<Tab>(isEdit ? 'data' : 'route');
  // RouteBuilder is mounted on first visit to the route tab and then only hidden,
  // so the entered points survive switching to the data tab and back.
  const [routeTabVisited, setRouteTabVisited] = useState(!isEdit);
  const [route, setRoute] = useState<RouteData | null>(null);
  const [routeInitial, setRouteInitial] = useState<Partial<RouteData> | undefined>(undefined);

  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [hasReturnTrip, setHasReturnTrip] = useState(false);
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [seatsTotal, setSeatsTotal] = useState(1);
  const [carInfo, setCarInfo] = useState('');
  const [cargoCapacity, setCargoCapacity] = useState('');
  const [routeAdjustment, setRouteAdjustment] = useState('');
  const [additionalContact, setAdditionalContact] = useState('');
  const [notes, setNotes] = useState('');

  const [loadingTrip, setLoadingTrip] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;

    api
      .get(`/trips/${id}`)
      .then(({ data }) => {
        const trip: Trip = data.data;

        const loadedRoute: RouteData = {
          origin: { address: trip.origin_address, lat: trip.origin_lat, lng: trip.origin_lng },
          destination: { address: trip.destination_address, lat: trip.destination_lat, lng: trip.destination_lng },
          waypoints: trip.waypoints ?? [],
          routePath: trip.route_path,
          distanceMeters: trip.distance_meters,
          durationSeconds: trip.duration_seconds,
        };
        setRoute(loadedRoute);
        setRouteInitial(loadedRoute);

        setDepartureDate(trip.departure_date);
        setDepartureTime(trip.departure_time);
        setHasReturnTrip(trip.has_return_trip);
        setReturnDate(trip.return_date ?? '');
        setReturnTime(trip.return_time ?? '');
        setSeatsTotal(trip.seats_total);
        setCarInfo(trip.car_info);
        setCargoCapacity(trip.cargo_capacity ?? '');
        setRouteAdjustment(trip.route_adjustment ?? '');
        setAdditionalContact(trip.additional_contact ?? '');
        setNotes(trip.notes ?? '');
      })
      .catch((err) => setError(apiErrorMessage(err, 'Не вдалося завантажити поїздку.')))
      .finally(() => setLoadingTrip(false));
  }, [id, isEdit]);

  if (!user) return null;

  const routeReady = !!route;

  const goToRouteTab = () => {
    setRouteTabVisited(true);
    setTab('route');
  };

  const handleSubmit = async () => {
    if (!route) {
      setError('Спочатку побудуйте маршрут поїздки.');
      goToRouteTab();
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        origin_address: route.origin.address,
        origin_lat: route.origin.lat,
        origin_lng: route.origin.lng,
        destination_address: route.destination.address,
        destination_lat: route.destination.lat,
        destination_lng: route.destination.lng,
        waypoints: route.waypoints,
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
        cargo_capacity: cargoCapacity || null,
        route_adjustment: routeAdjustment || null,
        additional_contact: additionalContact || null,
        notes: notes || null,
      };

      if (isEdit) {
        await api.put(`/trips/${id}`, payload);
        navigate('/my-trips', { state: { updatedTripId: Number(id) } });
      } else {
        const { data } = await api.post('/trips', payload);
        navigate('/my-trips', { state: { createdTripId: data.data.id } });
      }
    } catch (err) {
      setError(apiErrorMessage(err, isEdit ? 'Не вдалося оновити поїздку.' : 'Не вдалося створити поїздку.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingTrip) {
    return <p className="text-muted">Завантаження…</p>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Редагувати поїздку' : 'Додати поїздку'}</h1>
          <p>
            {isEdit
              ? 'Змініть маршрут або дані поїздки та збережіть зміни.'
              : 'Спочатку побудуйте маршрут на карті, потім заповніть дані поїздки.'}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          <button className={`tab-btn ${tab === 'route' ? 'active' : ''}`} onClick={goToRouteTab}>
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

        {routeTabVisited && (
          <div style={{ display: tab === 'route' ? undefined : 'none' }}>
            <RouteBuilder initial={routeInitial} onChange={setRoute} />
          </div>
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
              <label>Вільний об'єм</label>
              <input
                className="input"
                placeholder="200 кг або 3 м3"
                value={cargoCapacity}
                onChange={(e) => setCargoCapacity(e.target.value)}
              />
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
              {submitting ? 'Збереження…' : isEdit ? 'Зберегти зміни' : 'Опублікувати поїздку'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
