import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from './LanguageToggle';
import CropGrid from './CropGrid';
import ManageMinistry from './ManageMinistry';
import LoadingSpinner from './LoadingSpinner';
import { getPlants } from '../services/api';

export default function Dashboard() {
  const { user, role, logout } = useAuth();
  const { t, toggleLang, lang } = useLanguage();
  const [crops, setCrops] = useState([]);
  const [showManage, setShowManage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCrops = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getPlants({ includeLatest: true });
        setCrops(res?.data || []);
      } catch (err) {
        const message = err?.response?.data?.error || 'Failed to load crops';
        setError(message);
      }
      setLoading(false);
    };
    fetchCrops();
  }, []);

  return (
    <>
      <nav className="navbar">
        <div className="container-fluid">
          <a className="navbar-brand" href="#">🌾 Crop Tracking</a>
          <div>
            <button className="btn btn-light btn-large me-3" onClick={toggleLang}>
              {lang === 'en' ? 'ខ្មែរ' : 'English'}
            </button>
            <button className="btn btn-light btn-large" onClick={logout}>{t('logout')}</button>
          </div>
        </div>
      </nav>

      <div className="container mt-4">
        {showManage ? (
          <ManageMinistry onBack={() => setShowManage(false)} />
        ) : (
          <>
            <h1>{t('crops_list')}</h1>
            {role === 'admin' && (
              <div className="mb-4">
                <button className="btn btn-success btn-large me-3" onClick={() => {/* TODO: open create modal */}}>
                  {t('create_new_crop')}
                </button>
                <button className="btn btn-primary btn-large" onClick={() => setShowManage(true)}>
                  {t('manage_users')}
                </button>
              </div>
            )}

            {loading && <LoadingSpinner label={t('loading')} />}
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            {!loading && !error && <CropGrid crops={crops} />}
          </>
        )}
      </div>
    </>
  );
}