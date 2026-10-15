import { useCallback, useRef } from 'react';
import { GoogleMap, Marker, Polyline } from '@react-google-maps/api';
import { useGoogleMaps } from '../context/GoogleMapsContext';
import type { RoutePoint } from '../types';

interface Props {
  routePath: RoutePoint[];
  pickup?: { lat: number; lng: number } | null;
  dropoff?: { lat: number; lng: number } | null;
  height?: number;
}

export default function RouteMap({ routePath, pickup, dropoff, height = 320 }: Props) {
  const { isLoaded } = useGoogleMaps();
  const mapRef = useRef<google.maps.Map | null>(null);

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      if (routePath.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        routePath.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
        map.fitBounds(bounds, 40);
      }
    },
    [routePath]
  );

  if (!isLoaded) {
    return <div className="map-placeholder" style={{ height }}>Завантаження карти…</div>;
  }

  if (routePath.length === 0) {
    return <div className="map-placeholder" style={{ height }}>Маршрут ще не побудовано</div>;
  }

  const path = routePath.map((p) => ({ lat: p.lat, lng: p.lng }));

  return (
    <GoogleMap
      onLoad={onLoad}
      mapContainerStyle={{ width: '100%', height }}
      options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
    >
      <Polyline path={path} options={{ strokeColor: '#2f6fed', strokeWeight: 4 }} />
      <Marker position={path[0]} label="A" />
      <Marker position={path[path.length - 1]} label="B" />
      {pickup && <Marker position={pickup} label="П" />}
      {dropoff && <Marker position={dropoff} label="Д" />}
    </GoogleMap>
  );
}
