const db = require('../services/mysql');

async function ensureSchema() {
  await db.query(`CREATE TABLE IF NOT EXISTS plants (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    farmer_image_url TEXT NULL,
    farm_location VARCHAR(255) NOT NULL,
    plant_name VARCHAR(255) NOT NULL,
    planted_date DATE NULL,
    harvest_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS qr_tokens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    plant_id BIGINT NOT NULL,
    token VARCHAR(128) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at DATETIME NULL,
    INDEX idx_qr_token (token),
    INDEX idx_qr_plant (plant_id),
    CONSTRAINT fk_qr_plant FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
  )`);
}

async function createPlant(req, res) {
  try {
    await ensureSchema();
    const { farmerImage, farmLocation, plantName, plantedDate, harvestDate } = req.body || {};
    if (!farmLocation || !plantName) {
      return res.status(400).json({ success: false, error: 'farmLocation and plantName are required' });
    }
    const sql = `INSERT INTO plants (farmer_image_url, farm_location, plant_name, planted_date, harvest_date)
                 VALUES (?, ?, ?, ?, ?)`;
    const params = [farmerImage || null, farmLocation, plantName, plantedDate || null, harvestDate || null];
    const result = await db.query(sql, params);
    const plantId = result.insertId;
    res.json({ success: true, plantId });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create plant', message: err.message });
  }
}

async function getPlant(req, res) {
  try {
    await ensureSchema();
    const { id } = req.params;
    const rows = await db.query('SELECT * FROM plants WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Plant not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get plant', message: err.message });
  }
}

module.exports = { createPlant, getPlant };
