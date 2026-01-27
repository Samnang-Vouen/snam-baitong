const mysql = require('mysql2/promise');
const { mysqlConfig, validateMySQLConfig } = require('../config/mysql');

validateMySQLConfig();

const pool = mysql.createPool(mysqlConfig);

async function query(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function getConnection() {
  return pool.getConnection();
}

module.exports = { pool, query, getConnection };
