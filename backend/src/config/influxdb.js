const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load .env from backend working directory
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const config = {
  INFLUXDB_URL: process.env.INFLUXDB_URL,
  INFLUXDB_TOKEN: process.env.INFLUXDB_TOKEN,
  INFLUXDB_ORG: process.env.INFLUXDB_ORG,
  INFLUXDB_BUCKET: process.env.INFLUXDB_BUCKET,
  PORT: process.env.PORT || 3000,
};

function validateRequired(keys = ['INFLUXDB_URL', 'INFLUXDB_TOKEN', 'INFLUXDB_ORG', 'INFLUXDB_BUCKET']) {
  const missing = keys.filter((k) => !config[k] || String(config[k]).trim() === '');
  if (missing.length) {
    const message = `Missing required environment variables: ${missing.join(', ')}.`;
    const err = new Error(message);
    err.code = 'ENV_VALIDATION_ERROR';
    throw err;
  }
}

module.exports = { config, validateRequired };
