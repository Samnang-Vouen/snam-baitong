import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from './LanguageToggle';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: loginWithApi } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await loginWithApi(username, password);
      navigate('/');
    } catch (err) {
      const message = err?.response?.data?.error || 'Login failed';
      setError(message);
    }
    setLoading(false);
  };

  return (
    <div className="container mt-5 text-center">
      <h1>{t('welcome')}</h1>
      <form onSubmit={handleSubmit} className="mx-auto" style={{ maxWidth: '400px' }}>
        <div className="mb-3">
          <label className="form-label">{t('username')}</label>
          <input type="text" className="form-control" value={username} onChange={e => setUsername(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className="form-label">{t('password')}</label>
          <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-danger">{error}</p>}
        <button type="submit" className="btn btn-success btn-large" disabled={loading}>
          {loading ? t('loading') : t('login')}
        </button>
      </form>
      <p className="mt-3 text-muted">Default admin: admin / admin123 (change via env)</p>
    </div>
  );
}