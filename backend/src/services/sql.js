const { config, validateRequired } = require("../config/influxdb");
const InfluxDBSQLService = require("./influx-sql.service");

// Allow disabling Influx SQL for local/dev by setting INFLUXDB_SQL_ENABLED=false
const sqlDisabled =
  String(process.env.INFLUXDB_SQL_ENABLED || "").toLowerCase() === "false";
if (sqlDisabled) {
  console.warn(
    "INFLUXDB_SQL_ENABLED=false -> using mock SQL service (returns empty results).",
  );
  module.exports = {
    query: async () => [],
    close: () => {},
  };
  return;
}

// Validate SQL-relevant env
validateRequired(["INFLUXDB_URL", "INFLUXDB_TOKEN"]);
const database = process.env.INFLUXDB_DATABASE || config.INFLUXDB_BUCKET;
if (!database) {
  const err = new Error("Missing INFLUXDB_DATABASE or INFLUXDB_BUCKET");
  err.code = "ENV_VALIDATION_ERROR";
  throw err;
}

const sqlService = new InfluxDBSQLService(
  config.INFLUXDB_URL,
  config.INFLUXDB_TOKEN,
  database,
);

module.exports = sqlService;
