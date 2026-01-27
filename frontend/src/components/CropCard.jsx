import { Link } from 'react-router-dom';
import { useLanguage } from './LanguageToggle';

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString();
}

export default function CropCard({ crop }) {
  const { t } = useLanguage();
  const statusLabel = crop.status?.replace('_', ' ') || t('status_unknown');
  const latestTime = crop.latestSensors?.recordedAt || null;

  return (
    <div className="card h-100 shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h5 className="card-title mb-0">{crop.plantName}</h5>
          <span className={`badge bg-${crop.status === 'died' ? 'danger' : crop.status === 'not_planted' ? 'warning' : 'success'}`}>
            {statusLabel}
          </span>
        </div>
        <p className="mb-2"><strong>{t('location')}:</strong> {crop.farmLocation}</p>
        <p className="mb-3"><strong>{t('planting_date')}:</strong> {formatDate(crop.plantedDate)}</p>
        {latestTime && (
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>
            {t('last_updated')}: {latestTime}
          </p>
        )}
        <Link to={`/crop/${crop.id}`} className="btn btn-success btn-large w-100">
          {t('view_details')}
        </Link>
      </div>
    </div>
  );
}