import { useEffect, useState } from 'react';
import { useLanguage } from './LanguageToggle';
import LoadingSpinner from './LoadingSpinner';
import {
  getMinistryUsers,
  createMinistryUser,
  updateMinistryUser,
  deleteMinistryUser,
} from '../services/api';

export default function ManageMinistry({ onBack }) {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ username: '', password: '', role: 'ministry' });
  const [savingId, setSavingId] = useState(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getMinistryUsers();
      setUsers(res?.data || []);
    } catch (err) {
      const message = err?.response?.data?.error || 'Failed to load users';
      setError(message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSavingId('new');
      setError('');
      await createMinistryUser(form);
      setForm({ username: '', password: '', role: 'ministry' });
      await loadUsers();
    } catch (err) {
      const message = err?.response?.data?.error || 'Failed to create user';
      setError(message);
    }
    setSavingId(null);
  };

  const handleStatusChange = async (userId, status) => {
    try {
      setSavingId(userId);
      setError('');
      await updateMinistryUser(userId, { status });
      await loadUsers();
    } catch (err) {
      const message = err?.response?.data?.error || 'Failed to update user';
      setError(message);
    }
    setSavingId(null);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      setSavingId(userId);
      setError('');
      await deleteMinistryUser(userId);
      await loadUsers();
    } catch (err) {
      const message = err?.response?.data?.error || 'Failed to delete user';
      setError(message);
    }
    setSavingId(null);
  };

  return (
    <>
      <button className="btn btn-secondary btn-large mb-3" onClick={onBack}>{t('back')}</button>
      <h2 className="mb-4">{t('manage_users')}</h2>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="mb-3">Create new user</h5>
          <form onSubmit={handleCreate} className="row g-3">
            <div className="col-md-4">
              <input
                className="form-control"
                placeholder="Username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div className="col-md-4">
              <input
                className="form-control"
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="ministry">Ministry</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="col-md-2">
              <button className="btn btn-success w-100" disabled={savingId === 'new'}>
                {savingId === 'new' ? t('loading') : t('save')}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h5 className="mb-3">Existing users</h5>
          {loading ? (
            <LoadingSpinner label={t('loading')} />
          ) : users.length === 0 ? (
            <p className="text-muted mb-0">No users yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.username}</td>
                      <td className="text-capitalize">{user.role}</td>
                      <td>
                        <select
                          className="form-select"
                          value={user.status}
                          onChange={(e) => handleStatusChange(user.id, e.target.value)}
                          disabled={savingId === user.id}
                        >
                          <option value="active">Active</option>
                          <option value="disabled">Disabled</option>
                        </select>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDelete(user.id)}
                          disabled={savingId === user.id}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}