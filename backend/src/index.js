require("dotenv").config();
const createApp = require("./app");
let sqlService;
try {
  sqlService = require("./services/sql");
} catch (e) {
  console.error("\nFailed to initialize SQL service.");
  console.error(e.message);
  process.exit(1);
}

const app = createApp();
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`InfluxDB URL: ${process.env.INFLUXDB_URL}`);
  console.log(
    `Database: ${process.env.INFLUXDB_DATABASE || process.env.INFLUXDB_BUCKET}`,
  );
  console.log(`\nAvailable endpoints:`);
  console.log(`   POST /api/auth/login - User login`);
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /api/sensors/latest - Latest readings`);
  console.log(`   GET  /api/dashboard - Dashboard data`);
  console.log(`   GET  /api/plants - List plant metadata`);
  console.log(`   POST /api/plants - Create plant metadata`);
  console.log(`   PUT  /api/plants/:id - Update plant metadata/status`);
  console.log(`   DELETE /api/plants/:id - Delete plant metadata`);
  console.log(`   GET  /api/users - List ministry users (admin)`);
  console.log(`   POST /api/users - Create ministry user (admin)`);
  console.log(`   POST /api/qr/generate - Generate QR for plant`);
  console.log(`   GET  /api/qr/scan/:token - Public aggregated view`);
});

function shutdown(signal) {
  console.log(`${signal} signal received: closing HTTP server`);
  try {
    if (sqlService && typeof sqlService.close === "function") {
      sqlService.close();
    }
  } catch (e) {
    console.error("Error during service shutdown:", e);
  }
  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
