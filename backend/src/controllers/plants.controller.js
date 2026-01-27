const db = require("../services/mysql");
const sqlService = require("../services/sql");
const { formatTimestampLocal } = require("../utils/format");

const MEASUREMENT = process.env.INFLUXDB_MEASUREMENT || "sensor_data";
const ALLOWED_FIELDS = process.env.INFLUXDB_ALLOWED_FIELDS
  ? process.env.INFLUXDB_ALLOWED_FIELDS.split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : [
      "temperature",
      "moisture",
      "ec",
      "ph",
      "pH",
      "nitrogen",
      "phosphorus",
      "potassium",
      "salinity",
    ];

const STATUS_VALUES = ["well_planted", "not_planted", "died"];
let measurementValidated = false;

async function ensureMeasurement() {
  if (measurementValidated) return;
  const checkSql = `SELECT table_name FROM information_schema.tables WHERE table_name='${MEASUREMENT.replace(/'/g, "''")}' LIMIT 1`;
  const rows = await sqlService.query(checkSql);
  if (!Array.isArray(rows) || rows.length === 0) {
    const err = new Error(`Measurement/table not found: ${MEASUREMENT}`);
    err.code = "MEASUREMENT_NOT_FOUND";
    throw err;
  }
  measurementValidated = true;
}

function safeVal(v) {
  if (typeof v === "bigint") return v.toString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

function buildWhere() {
  const filters = [];
  if (process.env.INFLUXDB_DEVICE) {
    filters.push(
      `device = '${process.env.INFLUXDB_DEVICE.replace(/'/g, "''")}'`,
    );
  }
  if (process.env.INFLUXDB_LOCATION) {
    filters.push(
      `location = '${process.env.INFLUXDB_LOCATION.replace(/'/g, "''")}'`,
    );
  }
  return filters.length ? `WHERE ${filters.join(" AND ")}` : "";
}

async function fetchLatestSensorSnapshot() {
  await ensureMeasurement();
  const where = buildWhere();
  const sql = `SELECT * FROM "${MEASUREMENT}" ${where} ORDER BY time DESC LIMIT 1`;
  const rows = await sqlService.query(sql);
  const latest = Array.isArray(rows) && rows.length ? rows[0] : null;
  if (!latest) return null;

  const readings = {};
  for (const f of ALLOWED_FIELDS) {
    if (f in latest) {
      readings[f] = {
        value: safeVal(latest[f]),
        time: formatTimestampLocal(latest.time ?? null, {
          includeTZName: true,
        }),
        unit: "",
      };
    }
  }

  return {
    readings,
    location: safeVal(latest.location ?? null),
    recordedAt: formatTimestampLocal(latest.time ?? null, {
      includeTZName: true,
    }),
  };
}

async function ensureSchema() {
  await db.query(`CREATE TABLE IF NOT EXISTS plants (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    farmer_image_url TEXT NULL,
    farm_location VARCHAR(255) NOT NULL,
    plant_name VARCHAR(255) NOT NULL,
    planted_date DATE NULL,
    harvest_date DATE NULL,
    status ENUM('well_planted','not_planted','died') NOT NULL DEFAULT 'well_planted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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

  const columns = await db.query("SHOW COLUMNS FROM plants LIKE 'status'");
  if (!columns.length) {
    await db.query(
      "ALTER TABLE plants ADD COLUMN status ENUM('well_planted','not_planted','died') NOT NULL DEFAULT 'well_planted'",
    );
  }
}

function mapPlant(row) {
  return {
    id: row.id,
    farmerImage: row.farmer_image_url || null,
    farmLocation: row.farm_location,
    plantName: row.plant_name,
    plantedDate: row.planted_date,
    harvestDate: row.harvest_date,
    status: row.status || "well_planted",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function createPlant(req, res) {
  try {
    await ensureSchema();
    const {
      farmerImage,
      farmLocation,
      plantName,
      plantedDate,
      harvestDate,
      status,
    } = req.body || {};
    if (!farmLocation || !plantName) {
      return res
        .status(400)
        .json({
          success: false,
          error: "farmLocation and plantName are required",
        });
    }
    if (status && !STATUS_VALUES.includes(status)) {
      return res
        .status(400)
        .json({
          success: false,
          error: `status must be one of: ${STATUS_VALUES.join(", ")}`,
        });
    }

    const sql = `INSERT INTO plants (farmer_image_url, farm_location, plant_name, planted_date, harvest_date, status)
                 VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [
      farmerImage || null,
      farmLocation,
      plantName,
      plantedDate || null,
      harvestDate || null,
      status || "well_planted",
    ];
    const result = await db.query(sql, params);
    const inserted = await db.query("SELECT * FROM plants WHERE id = ?", [
      result.insertId,
    ]);
    res.status(201).json({ success: true, data: mapPlant(inserted[0]) });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to create plant",
        message: err.message,
      });
  }
}

async function listPlants(req, res) {
  try {
    await ensureSchema();
    const rows = await db.query(
      "SELECT * FROM plants ORDER BY created_at DESC",
    );
    const includeSensors = req.query.includeLatest === "true";
    let snapshot = null;
    if (includeSensors) {
      try {
        snapshot = await fetchLatestSensorSnapshot();
      } catch (err) {
        console.error(
          "Failed to fetch latest sensors for plants list:",
          err.message,
        );
      }
    }
    const data = rows.map((row) => ({
      ...mapPlant(row),
      latestSensors: snapshot,
    }));
    res.json({ success: true, data });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to list plants",
        message: err.message,
      });
  }
}

async function getPlant(req, res) {
  try {
    await ensureSchema();
    const { id } = req.params;
    const includeSensors = req.query.includeSensors === "true";
    const rows = await db.query("SELECT * FROM plants WHERE id = ?", [id]);
    if (!rows.length)
      return res.status(404).json({ success: false, error: "Plant not found" });

    let snapshot = null;
    if (includeSensors) {
      try {
        snapshot = await fetchLatestSensorSnapshot();
      } catch (err) {
        console.error(
          "Failed to fetch latest sensors for plant detail:",
          err.message,
        );
      }
    }

    res.json({
      success: true,
      data: { ...mapPlant(rows[0]), latestSensors: snapshot },
    });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to get plant",
        message: err.message,
      });
  }
}

async function updatePlant(req, res) {
  try {
    await ensureSchema();
    const { id } = req.params;
    const {
      farmerImage,
      farmLocation,
      plantName,
      plantedDate,
      harvestDate,
      status,
    } = req.body || {};

    const rows = await db.query("SELECT * FROM plants WHERE id = ?", [id]);
    if (!rows.length)
      return res.status(404).json({ success: false, error: "Plant not found" });
    if (status && !STATUS_VALUES.includes(status)) {
      return res
        .status(400)
        .json({
          success: false,
          error: `status must be one of: ${STATUS_VALUES.join(", ")}`,
        });
    }

    const updates = [];
    const params = [];
    if (farmerImage !== undefined) {
      updates.push("farmer_image_url = ?");
      params.push(farmerImage || null);
    }
    if (farmLocation) {
      updates.push("farm_location = ?");
      params.push(farmLocation);
    }
    if (plantName) {
      updates.push("plant_name = ?");
      params.push(plantName);
    }
    if (plantedDate !== undefined) {
      updates.push("planted_date = ?");
      params.push(plantedDate || null);
    }
    if (harvestDate !== undefined) {
      updates.push("harvest_date = ?");
      params.push(harvestDate || null);
    }
    if (status) {
      updates.push("status = ?");
      params.push(status);
    }

    if (!updates.length) {
      return res
        .status(400)
        .json({ success: false, error: "No fields to update" });
    }

    params.push(id);
    await db.query(
      `UPDATE plants SET ${updates.join(", ")} WHERE id = ?`,
      params,
    );
    const updated = await db.query("SELECT * FROM plants WHERE id = ?", [id]);
    res.json({ success: true, data: mapPlant(updated[0]) });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to update plant",
        message: err.message,
      });
  }
}

async function deletePlant(req, res) {
  try {
    await ensureSchema();
    const { id } = req.params;
    const rows = await db.query("SELECT * FROM plants WHERE id = ?", [id]);
    if (!rows.length)
      return res.status(404).json({ success: false, error: "Plant not found" });
    await db.query("DELETE FROM plants WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to delete plant",
        message: err.message,
      });
  }
}

module.exports = {
  createPlant,
  listPlants,
  getPlant,
  updatePlant,
  deletePlant,
};
