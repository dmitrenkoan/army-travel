import { useCallback, useEffect, useRef, useState } from 'react';
import { DirectionsRenderer, GoogleMap } from '@react-google-maps/api';
import { useGoogleMaps } from '../context/GoogleMapsContext';
import AddressAutocomplete, { type AddressValue } from './AddressAutocomplete';
import type { RoutePoint } from '../types';

export interface RouteData {
  origin: AddressValue;
  destination: AddressValue;
  waypoints: AddressValue[];
  routePath: RoutePoint[];
  distanceMeters: number;
  durationSeconds: number;
}

interface Props {
  initial?: Partial<RouteData>;
  onChange: (data: RouteData | null) => void;
}

/**
 * Builds a densely-sampled route path (every road-geometry vertex, not just
 * step endpoints) so that search matching can find towns the route passes
 * near even when Google's turn-by-turn steps are tens of km apart on a
 * highway with no intermediate maneuver.
 */
function buildRoutePath(result: google.maps.DirectionsResult): {
  routePath: RoutePoint[];
  distance: number;
  duration: number;
} {
  const legs = result.routes[0].legs;

  // Minimum spacing (meters) between stored points. Far finer than the ~8km search
  // threshold, but keeps the payload from ballooning on long highway routes.
  const MIN_SEGMENT_METERS = 400;

  const routePath: RoutePoint[] = [
    {
      lat: legs[0].start_location.lat(),
      lng: legs[0].start_location.lng(),
      distance: 0,
      duration: 0,
    },
  ];

  let cumDistance = 0;
  let cumDuration = 0;
  let lastPushedDistance = 0;
  let prevPoint = legs[0].start_location;

  const totalSteps = legs.reduce((sum, leg) => sum + leg.steps.length, 0);
  let stepIndex = 0;

  legs.forEach((leg) => {
    leg.steps.forEach((step) => {
      stepIndex += 1;
      const isLastStep = stepIndex === totalSteps;
      const path = step.path && step.path.length > 0 ? step.path : [step.end_location];

      // Distances for each sub-segment of this step, measured on the actual road geometry.
      const segmentDistances: number[] = [];
      let runningPoint = prevPoint;
      let stepDistanceTotal = 0;

      path.forEach((point) => {
        const d = google.maps.geometry.spherical.computeDistanceBetween(runningPoint, point);
        segmentDistances.push(d);
        stepDistanceTotal += d;
        runningPoint = point;
      });

      const stepDuration = step.duration?.value ?? 0;

      path.forEach((point, idx) => {
        cumDistance += segmentDistances[idx];
        cumDuration += stepDistanceTotal > 0 ? stepDuration * (segmentDistances[idx] / stepDistanceTotal) : 0;

        const isLastPoint = isLastStep && idx === path.length - 1;
        if (isLastPoint || cumDistance - lastPushedDistance >= MIN_SEGMENT_METERS) {
          routePath.push({
            lat: point.lat(),
            lng: point.lng(),
            distance: cumDistance,
            duration: cumDuration,
          });
          lastPushedDistance = cumDistance;
        }
      });

      prevPoint = path[path.length - 1];
    });
  });

  const totalDistance = legs.reduce((sum, leg) => sum + (leg.distance?.value ?? 0), 0);
  const totalDuration = legs.reduce((sum, leg) => sum + (leg.duration?.value ?? 0), 0);

  return {
    routePath,
    distance: totalDistance || cumDistance,
    duration: totalDuration || cumDuration,
  };
}

let stopCounter = 0;
function nextStopId() {
  stopCounter += 1;
  return stopCounter;
}

interface StopField {
  id: number;
  text: string;
  value: AddressValue | null;
}

export default function RouteBuilder({ initial, onChange }: Props) {
  const { isLoaded } = useGoogleMaps();

  // All route points in order: first is the origin (A), last is the destination (B),
  // everything in between is an intermediate stop.
  const [points, setPoints] = useState<StopField[]>(() => {
    const initialPoints = [
      ...(initial?.origin ? [initial.origin] : []),
      ...(initial?.waypoints ?? []),
      ...(initial?.destination ? [initial.destination] : []),
    ];
    const fields: StopField[] = initialPoints.map((p) => ({ id: nextStopId(), text: p.address, value: p }));
    while (fields.length < 2) {
      fields.push({ id: nextStopId(), text: '', value: null });
    }
    return fields;
  });

  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);

  const updatePointText = (id: number, text: string) => {
    setPoints((prev) => prev.map((p) => (p.id === id ? { ...p, text } : p)));
  };

  const selectPoint = (id: number, v: AddressValue) => {
    setPoints((prev) => prev.map((p) => (p.id === id ? { ...p, text: v.address, value: v } : p)));
  };

  const addStop = () => {
    // A new point becomes the destination; the previous destination turns into a stop.
    setPoints((prev) => [...prev, { id: nextStopId(), text: '', value: null }]);
  };

  const removePoint = (id: number) => {
    setPoints((prev) => (prev.length > 2 ? prev.filter((p) => p.id !== id) : prev));
  };

  const movePoint = (index: number, delta: -1 | 1) => {
    setPoints((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const allPointsReady = points.every((p) => !!p.value);

  const computeRoute = useCallback(() => {
    if (!allPointsReady || !isLoaded) return;
    setError(null);

    const origin = points[0].value!;
    const destination = points[points.length - 1].value!;
    const intermediateStops = points.slice(1, -1).map((p) => p.value!);

    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new google.maps.DirectionsService();
    }

    directionsServiceRef.current.route(
      {
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        waypoints: intermediateStops.map((s) => ({ location: { lat: s.lat, lng: s.lng }, stopover: true })),
        optimizeWaypoints: false,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          const { routePath, distance, duration } = buildRoutePath(result);
          onChange({
            origin,
            destination,
            waypoints: intermediateStops,
            routePath,
            distanceMeters: distance,
            durationSeconds: duration,
          });
        } else {
          setError('Не вдалося побудувати маршрут. Перевірте всі точки маршруту.');
          onChange(null);
        }
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, isLoaded, allPointsReady]);

  useEffect(() => {
    computeRoute();
  }, [computeRoute]);

  return (
    <div className="route-builder">
      <label style={{ display: 'block', marginBottom: 10 }}>Задайте пункт виїзду та кінцеву точку призначення</label>

      {points.map((point, index) => {
        const isFirst = index === 0;
        const isLast = index === points.length - 1;
        return (
          <div className="route-stop-row" key={point.id}>
            <span className="route-stop-marker">{isFirst ? 'A' : isLast ? 'B' : `${index}`}</span>
            <AddressAutocomplete
              placeholder={isFirst ? 'Пункт виїзду' : isLast ? 'Пункт призначення' : `Зупинка ${index}`}
              value={point.text}
              onChange={(text) => updatePointText(point.id, text)}
              onSelect={(v) => selectPoint(point.id, v)}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => movePoint(index, -1)}
              disabled={isFirst}
              title="Перемістити вище"
            >
              ↑
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => movePoint(index, 1)}
              disabled={isLast}
              title="Перемістити нижче"
            >
              ↓
            </button>
            {points.length > 2 && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => removePoint(point.id)}
                title="Видалити точку"
              >
                ✕
              </button>
            )}
          </div>
        );
      })}

      <button type="button" className="btn btn-secondary btn-sm" onClick={addStop} style={{ marginTop: 4 }}>
        + Додати зупинку
      </button>

      {error && <p className="error-text">{error}</p>}

      <div className="map-wrapper" style={{ marginTop: 14 }}>
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: 360 }}
            center={points[0].value ? { lat: points[0].value.lat, lng: points[0].value.lng } : { lat: 49.0, lng: 31.5 }}
            zoom={points[0].value ? 7 : 6}
            options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
          >
            {directions && <DirectionsRenderer directions={directions} />}
          </GoogleMap>
        ) : (
          <div className="map-placeholder" style={{ height: 360 }}>Завантаження карти…</div>
        )}
      </div>

      {directions && (
        <p className="hint">
          Відстань: {
            Math.round(
              directions.routes[0].legs.reduce((sum, leg) => sum + (leg.distance?.value ?? 0), 0) / 1000
            )
          } км · Час у дорозі: ~
          {Math.round(
            directions.routes[0].legs.reduce((sum, leg) => sum + (leg.duration?.value ?? 0), 0) / 60
          )} хв
        </p>
      )}
    </div>
  );
}
