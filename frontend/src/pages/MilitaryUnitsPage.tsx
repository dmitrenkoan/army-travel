import { useEffect, useState, type FormEvent } from 'react';
import api, { apiErrorMessage } from '../api/client';
import type { MilitaryUnit } from '../types';

export default function MilitaryUnitsPage() {
  const [units, setUnits] = useState<MilitaryUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [city, setCity] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/military-units');
      setUnits(data.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/military-units', { name, code, city: city || null });
      setName('');
      setCode('');
      setCity('');
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (unit: MilitaryUnit) => {
    if (!confirm(`Видалити військову частину "${unit.name}"?`)) return;
    try {
      await api.delete(`/military-units/${unit.id}`);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Військові частини</h1>
          <p>Створюйте військові частини, щоб потім призначати їм адміністраторів.</p>
        </div>
      </div>

      <div className="card">
        <h3>Нова військова частина</h3>
        <form onSubmit={handleCreate}>
          <div className="form-grid">
            <div className="field">
              <label>Назва</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="field">
              <label>Код (унікальний)</label>
              <input className="input" value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>
            <div className="field">
              <label>Місто</label>
              <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn" type="submit" disabled={submitting}>
            Додати частину
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Список частин</h3>
        {loading && <p className="text-muted">Завантаження…</p>}
        {!loading && units.length === 0 && <p className="text-muted">Ще немає жодної частини.</p>}
        {!loading && units.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Назва</th>
                <th>Код</th>
                <th>Місто</th>
                <th>Користувачів</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {units.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.code}</td>
                  <td>{u.city ?? '—'}</td>
                  <td>{u.users_count}</td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u)}>
                      Видалити
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
