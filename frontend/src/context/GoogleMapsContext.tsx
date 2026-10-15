import { createContext, useContext, type ReactNode } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

const LIBRARIES: ('places' | 'geometry')[] = ['places', 'geometry'];

interface GoogleMapsContextValue {
  isLoaded: boolean;
  loadError: Error | undefined;
}

const GoogleMapsContext = createContext<GoogleMapsContextValue>({ isLoaded: false, loadError: undefined });

export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'army-travel-google-maps',
    googleMapsApiKey: (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ?? '',
    libraries: LIBRARIES,
    language: 'uk',
    region: 'UA',
  });

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

export function useGoogleMaps() {
  return useContext(GoogleMapsContext);
}
