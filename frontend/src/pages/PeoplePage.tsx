import { useEffect, useState, type FormEvent } from 'react';
import api, { apiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PhoneInput, { isCompletePhone } from '../components/PhoneInput';
import type { MilitaryUnit, User } from '../types';

type RoleFilter = '' | 'unit_admin' | 'user';

export default function PeoplePage() {
  const { user: actor } = useAuth();
  const isSuperAdmin = actor?.role === 'super_admin';

  const [people, setPeople] = useState<User[]>([]);
  const [units, setUnits] = useState<MilitaryUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [militaryUnitId, setMilitaryUnitId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const loadPeople = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users', {
        params: {
          search: search || undefined,
          military_unit_id: isSuperAdmin ? unitFilter || undefined : undefined,
          role: isSuperAdmin ? roleFilter || undefined : undefined,
        },
      });
      setPeople(data.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      api
        .get('/military-units')
        .then(({ data }) => setUnits(data.data))
        .catch((err) => setError(apiErrorMessage(err)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live search/filter: reload shortly after the user stops typing or changes a filter.
  useEffect(() => {
    const timeout = setTimeout(loadPeople, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, unitFilter, roleFilter]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();

    if (!isCompletePhone(phone)) {
      setError('Введіть повний номер телефону: +380 та 9 цифр.');
      return;
    }

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
      await loadPeople();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (person: User) => {
    try {
      await api.put(`/users/${person.id}`, { is_active: !person.is_active });
      await loadPeople();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const handleDelete = async (person: User) => {
    if (!confirm(`Видалити користувача "${person.name}"?`)) return;
    try {
      await api.delete(`/users/${person.id}`);
      await loadPeople();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{isSuperAdmin ? 'Користувачі' : 'Користувачі вашої частини'}</h1>
          <p>
            {isSuperAdmin
              ? 'Усі користувачі системи. Користувачі, яким дозволено створювати інших у межах своєї частини, позначені як "Адмін".'
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
              <PhoneInput value={phone} onChange={setPhone} required />
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

        <div className="toolbar">
          <div className="field">
            <label>Пошук</label>
            <input
              className="input"
              placeholder="ПІБ або телефон"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {isSuperAdmin && (
            <>
              <div className="field">
                <label>Військова частина</label>
                <select value={unitFilter} onChange={(e) => setUnitFilter(e.target.value)}>
                  <option value="">Усі частини</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Роль</label>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}>
                  <option value="">Усі ролі</option>
                  <option value="unit_admin">Адміни</option>
                  <option value="user">Користувачі</option>
                </select>
              </div>
            </>
          )}
        </div>

        {loading && <p className="text-muted">Завантаження…</p>}
        {!loading && people.length === 0 && <p className="text-muted">Нічого не знайдено.</p>}
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
                  <td>
                    {p.name}
                    {p.role === 'unit_admin' && (
                      <>
                        {' '}
                        <span className="badge badge-role">Адмін</span>
                      </>
                    )}
                  </td>
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
