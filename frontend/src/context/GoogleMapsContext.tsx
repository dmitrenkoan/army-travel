import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import api from '../api/client';

const LIBRARIES: ('places' | 'geometry')[] = ['places', 'geometry'];

interface GoogleMapsContextValue {
  isLoaded: boolean;
  loadError: Error | undefined;
}

const GoogleMapsContext = createContext<GoogleMapsContextValue>({ isLoaded: false, loadError: undefined });

// Only mounted once the real key is known — @react-google-maps/api's loader
// is a singleton that throws ("Loader must not be called again with
// different options") if the apiKey changes between calls, so we must not
// call useJsApiLoader first with a placeholder and then with the real key.
function GoogleMapsLoader({ apiKey, children }: { apiKey: string; children: ReactNode }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'army-travel-google-maps',
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
    language: 'uk',
    region: 'UA',
  });

  return <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>{children}</GoogleMapsContext.Provider>;
}

export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  // The Maps key is fetched at runtime from the backend (GET /api/config)
  // rather than baked in at build time — some hosts only let you set env
  // vars at runtime, not during the frontend's build step.
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    api
      .get('/config')
      .then(({ data }) => {
        if (!cancelled) setApiKey(data.google_maps_api_key ?? '');
      })
      .catch(() => {
        if (!cancelled) {
          setFetchError(new Error('Не вдалося отримати конфігурацію карт.'));
          setApiKey('');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (apiKey === null) {
    // Still waiting on /api/config. Every map/autocomplete component already
    // renders its own placeholder while isLoaded is false, so this is the
    // same loading state they already handle, nothing special here.
    return (
      <GoogleMapsContext.Provider value={{ isLoaded: false, loadError: fetchError }}>
        {children}
      </GoogleMapsContext.Provider>
    );
  }

  return <GoogleMapsLoader apiKey={apiKey}>{children}</GoogleMapsLoader>;
}

export function useGoogleMaps() {
  return useContext(GoogleMapsContext);
}
