const PREFIX = '+380';

/**
 * Strips a pasted/typed value down to the local 9-digit part. Handles pasting
 * a full number in either international ("+380991112233") or local
 * ("0991112233") form — in both cases the leading "380"/"0" is dropped so it
 * doesn't get treated as the start of the subscriber number.
 */
function sanitizeDigits(raw: string): string {
  let digits = raw.replace(/\D/g, '');

  if (digits.startsWith('380') && digits.length > 9) {
    digits = digits.slice(3);
  } else if (digits.startsWith('0') && digits.length === 10) {
    digits = digits.slice(1);
  }

  return digits.slice(0, 9);
}

function formatDigits(digits: string): string {
  const groups = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)];
  return groups.filter(Boolean).join(' ');
}

export function isCompletePhone(value: string): boolean {
  return /^\+380\d{9}$/.test(value);
}

interface Props {
  value: string; // canonical "" or "+380" + up to 9 digits
  onChange: (value: string) => void;
  required?: boolean;
  autoFocus?: boolean;
  id?: string;
}

export default function PhoneInput({ value, onChange, required, autoFocus, id }: Props) {
  const digits = value.startsWith(PREFIX) ? value.slice(PREFIX.length) : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextDigits = sanitizeDigits(e.target.value);
    onChange(nextDigits.length > 0 ? `${PREFIX}${nextDigits}` : '');
  };

  return (
    <div className="phone-input">
      <span className="phone-input-prefix">{PREFIX}</span>
      <input
        id={id}
        className="phone-input-field"
        type="tel"
        inputMode="numeric"
        placeholder="XX XXX XX XX"
        value={formatDigits(digits)}
        onChange={handleChange}
        required={required}
        autoFocus={autoFocus}
      />
    </div>
  );
}
