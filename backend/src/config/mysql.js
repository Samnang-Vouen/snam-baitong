const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'snam_baitong',
  connectionLimit: Number(process.env.MYSQL_POOL_LIMIT || 10),
};

function validateMySQLConfig() {
  const requiredValues = [mysqlConfig.host, mysqlConfig.user, mysqlConfig.database];
  const names = ['host', 'user', 'database'];
  const missing = requiredValues
    .map((v, i) => (!v || String(v).trim() === '' ? names[i] : null))
    .filter(Boolean);
  if (missing.length) {
    const err = new Error(`Invalid MySQL configuration. Missing: ${missing.join(', ')}`);
    err.code = 'ENV_VALIDATION_ERROR';
    throw err;
  }
}

module.exports = { mysqlConfig, validateMySQLConfig };
