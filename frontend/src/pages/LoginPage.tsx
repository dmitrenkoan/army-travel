import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../api/client';
import Footer from '../components/Footer';

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to="/trips" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(phone, password);
      navigate('/trips');
    } catch (err) {
      setError(apiErrorMessage(err, 'Невірний номер телефону або пароль.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="card login-card">
        <h1>Попутники в дорозі</h1>
        <p className="subtitle">Закритий сервіс для військовослужбовців</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Номер телефону</label>
            <input
              className="input"
              type="tel"
              placeholder="+380..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label>Пароль</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn" type="submit" disabled={submitting} style={{ width: '100%' }}>
            {submitting ? 'Вхід…' : 'Увійти'}
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}
