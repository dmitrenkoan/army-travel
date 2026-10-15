import { useEffect, useState, type FormEvent } from 'react';
import api, { apiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { MilitaryUnit, User } from '../types';

export default function PeoplePage() {
  const { user: actor } = useAuth();
  const isSuperAdmin = actor?.role === 'super_admin';

  const [people, setPeople] = useState<User[]>([]);
  const [units, setUnits] = useState<MilitaryUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [militaryUnitId, setMilitaryUnitId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users');
      setPeople(data.data);
      if (isSuperAdmin) {
        const unitsRes = await api.get('/military-units');
        setUnits(unitsRes.data.data);
      }
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/users', {
        name,
        phone,
        email: email || null,
        password,
        ...(isSuperAdmin ? { military_unit_id: Number(militaryUnitId) } : {}),
      });
      setName('');
      setPhone('');
      setEmail('');
      setPassword('');
      setMilitaryUnitId('');
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (person: User) => {
    try {
      await api.put(`/users/${person.id}`, { is_active: !person.is_active });
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const handleDelete = async (person: User) => {
    if (!confirm(`Видалити користувача "${person.name}"?`)) return;
    try {
      await api.delete(`/users/${person.id}`);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{isSuperAdmin ? 'Адміністратори військових частин' : 'Користувачі вашої частини'}</h1>
          <p>
            {isSuperAdmin
              ? 'Створюйте облікові записи адміністраторів для кожної військової частини.'
              : 'Створюйте облікові записи військовослужбовців вашої частини.'}
          </p>
        </div>
      </div>

      <div className="card">
        <h3>Новий обліковий запис</h3>
        <form onSubmit={handleCreate}>
          <div className="form-grid">
            <div className="field">
              <label>ПІБ</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="field">
              <label>Телефон</label>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div className="field">
              <label>Email (необов'язково)</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label>Пароль</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {isSuperAdmin && (
              <div className="field">
                <label>Військова частина</label>
                <select value={militaryUnitId} onChange={(e) => setMilitaryUnitId(e.target.value)} required>
                  <option value="" disabled>
                    Оберіть частину
                  </option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn" type="submit" disabled={submitting}>
            Створити
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Список</h3>
        {loading && <p className="text-muted">Завантаження…</p>}
        {!loading && people.length === 0 && <p className="text-muted">Ще немає жодного облікового запису.</p>}
        {!loading && people.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>ПІБ</th>
                <th>Телефон</th>
                {isSuperAdmin && <th>Частина</th>}
                <th>Статус</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.phone}</td>
                  {isSuperAdmin && <td>{p.military_unit?.name ?? '—'}</td>}
                  <td>
                    <span className={`badge ${p.is_active ? 'badge-confirmed' : 'badge-cancelled'}`}>
                      {p.is_active ? 'Активний' : 'Деактивований'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => toggleActive(p)}>
                        {p.is_active ? 'Деактивувати' : 'Активувати'}
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p)}>
                        Видалити
                      </button>
                    </div>
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
