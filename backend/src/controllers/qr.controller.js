const db = require('../services/mysql');
const sqlService = require('../services/sql');
const { formatTimestampLocal } = require('../utils/format');
const { generateToken, generateQrDataUrl } = require('../utils/qr');
const { computePlantStatus } = require('../utils/status');

const MEASUREMENT = process.env.INFLUXDB_MEASUREMENT || 'sensor_data';
const ALLOWED_FIELDS = (process.env.INFLUXDB_ALLOWED_FIELDS
  ? process.env.INFLUXDB_ALLOWED_FIELDS.split(',').map((s) => s.trim()).filter(Boolean)
  : ['temperature','moisture','ec','ph','pH','nitrogen','phosphorus','potassium','salinity']);

function safeVal(v) {
  if (typeof v === 'bigint') return v.toString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

function buildWhere() {
  const filters = [];
  if (process.env.INFLUXDB_DEVICE) {
    filters.push(`device = '${process.env.INFLUXDB_DEVICE.replace(/'/g, "''")}'`);
  }
  if (process.env.INFLUXDB_LOCATION) {
    filters.push(`location = '${process.env.INFLUXDB_LOCATION.replace(/'/g, "''")}'`);
  }
  return filters.length ? `WHERE ${filters.join(' AND ')}` : '';
}

async function ensureSchema() {
  await db.query(`CREATE TABLE IF NOT EXISTS qr_tokens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    plant_id BIGINT NOT NULL,
    token VARCHAR(128) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at DATETIME NULL,
    INDEX idx_qr_token (token),
    INDEX idx_qr_plant (plant_id)
  )`);
}

async function generateQr(req, res) {
  try {
    await ensureSchema();
    const { plantId, expiresAt } = req.body || {};
    if (!plantId || !expiresAt) {
      return res.status(400).json({ success: false, error: 'plantId and expiresAt are required' });
    }
    const plants = await db.query('SELECT * FROM plants WHERE id = ?', [plantId]);
    if (!plants.length) return res.status(404).json({ success: false, error: 'Plant not found' });

    const token = generateToken(32);
    const urlBase = process.env.QR_BASE_URL || 'https://example.com/qr';
    const url = `${urlBase}?token=${encodeURIComponent(token)}`;

    await db.query('INSERT INTO qr_tokens (plant_id, token, expires_at) VALUES (?, ?, ?)', [plantId, token, new Date(expiresAt)]);
    const qrDataUrl = await generateQrDataUrl(url);

    res.json({ success: true, data: { token, expiresAt: new Date(expiresAt).toISOString(), url, qrDataUrl } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to generate QR', message: err.message });
  }
}

async function getAggregatedByToken(req, res) {
  try {
    const { token } = req.params;
    const rows = await db.query('SELECT * FROM qr_tokens WHERE token = ? AND (revoked_at IS NULL)', [token]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Invalid token' });
    const qr = rows[0];
    const now = new Date();
    const exp = new Date(qr.expires_at);
    const valid = now <= exp;
    if (!valid) return res.status(410).json({ success: false, error: 'QR token expired', expiresAt: exp.toISOString() });

    const plants = await db.query('SELECT * FROM plants WHERE id = ?', [qr.plant_id]);
    if (!plants.length) return res.status(404).json({ success: false, error: 'Plant not found for token' });
    const plant = plants[0];

    const where = buildWhere();
    const sql = `SELECT * FROM "${MEASUREMENT}" ${where} ORDER BY time DESC LIMIT 1`;
    const result = await sqlService.query(sql);
    const latest = Array.isArray(result) && result.length ? result[0] : null;

    const data = {};
    if (latest) {
      for (const f of ALLOWED_FIELDS) {
        if (f in latest) {
          data[f] = { value: safeVal(latest[f]), time: formatTimestampLocal(latest.time ?? null, { includeTZName: true }), unit: '' };
        }
      }
    }

    const snapshot = data;
    const status = computePlantStatus(snapshot);

    res.json({
      success: true,
      meta: {
        farmerImage: plant.farmer_image_url || null,
        farmLocation: plant.farm_location,
        plantName: plant.plant_name,
        plantedDate: plant.planted_date ? new Date(plant.planted_date).toISOString() : null,
        harvestDate: plant.harvest_date ? new Date(plant.harvest_date).toISOString() : null,
      },
      status,
      data: snapshot,
      location: latest ? safeVal(latest.location ?? null) : null,
      qr: { expiresAt: exp.toISOString(), valid: true },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch aggregated data', message: err.message });
  }
}

module.exports = { generateQr, getAggregatedByToken };
