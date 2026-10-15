import { useRef } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { useGoogleMaps } from '../context/GoogleMapsContext';

export interface AddressValue {
  address: string;
  lat: number;
  lng: number;
}

interface Props {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (value: AddressValue) => void;
  disabled?: boolean;
}

export default function AddressAutocomplete({ placeholder, value, onChange, onSelect, disabled }: Props) {
  const { isLoaded } = useGoogleMaps();
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    const location = place?.geometry?.location;
    if (!location) return;
    onSelect({
      address: place?.formatted_address || place?.name || value,
      lat: location.lat(),
      lng: location.lng(),
    });
  };

  if (!isLoaded) {
    return (
      <input
        className="input"
        placeholder="Завантаження карти…"
        disabled
      />
    );
  }

  return (
    <Autocomplete
      onLoad={(ac) => {
        autocompleteRef.current = ac;
      }}
      onPlaceChanged={handlePlaceChanged}
      options={{ componentRestrictions: { country: 'ua' } }}
    >
      <input
        className="input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </Autocomplete>
  );
}
