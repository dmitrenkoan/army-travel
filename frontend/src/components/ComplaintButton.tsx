import { useState } from 'react';
import api, { apiErrorMessage } from '../api/client';

export default function ComplaintButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleOpen = () => {
    setMessage('');
    setError(null);
    setDone(false);
    setOpen(true);
  };

  const submit = async () => {
    if (message.trim().length < 5) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/complaints', { message });
      setDone(true);
    } catch (err) {
      setError(apiErrorMessage(err, 'Не вдалося надіслати скаргу.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button className="btn btn-outline-danger btn-sm" onClick={handleOpen}>
        Залиши скаргу
      </button>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="card modal" onClick={(e) => e.stopPropagation()}>
            {!done ? (
              <>
                <h3>Залишити скаргу</h3>
                <p className="text-muted">Скаргу побачить суперадміністратор.</p>
                <div className="field">
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Опишіть суть скарги"
                    autoFocus
                  />
                </div>
                {error && <p className="error-text">{error}</p>}
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setOpen(false)}>
                    Скасувати
                  </button>
                  <button className="btn btn-danger" onClick={submit} disabled={submitting || message.trim().length < 5}>
                    {submitting ? 'Надсилаємо…' : 'Надіслати скаргу'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>Скаргу надіслано</h3>
                <p>Вашу скаргу надіслано суперадміністратору на розгляд.</p>
                <div className="modal-actions">
                  <button className="btn" onClick={() => setOpen(false)}>
                    Добре
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
