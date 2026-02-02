require('dotenv').config();
const createApp = require('./app');
const { seedPredefinedAdmins } = require('./scripts/seed-admins');
let sqlService;
try {
  sqlService = require('./services/sql');
} catch (e) {
  console.error('\nFailed to initialize SQL service.');
  console.error(e.message);
  process.exit(1);
}

// Initialize MQTT connection (non-fatal if broker is unreachable; it will reconnect)
//const mqttService = require('./services/mqtt.service');
//mqttService.init();

const app = createApp();
const PORT = process.env.PORT || 3000;

// Initialize MySQL auth-related schema and seed predefined admins
const { initSchema } = require('./services/user.service');
const { initCommentsSchema } = require('./controllers/comments.controller');
(async () => {
  try {
    await initSchema();
    await initCommentsSchema();
    
    // Seed predefined admin accounts (hardcoded in seed-admins.js)
    await seedPredefinedAdmins();
  } catch (e) {
    console.error('Failed to initialize auth schema/seed:', e.message);
  }
})();

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`InfluxDB URL: ${process.env.INFLUXDB_URL}`);
  console.log(`Database: ${process.env.INFLUXDB_DATABASE || process.env.INFLUXDB_BUCKET}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /api/sensors/latest - Latest readings`);
  console.log(`   GET  /api/dashboard - Dashboard data`);
  console.log(`   POST /api/plants - Create plant metadata (admin)`);
  console.log(`   POST /api/qr/generate - Generate QR for plant`);
  console.log(`   GET  /api/qr/scan/:token - Public aggregated view`);
  console.log(`   POST /api/auth/login - Login with email/password`);
  console.log(`   POST /api/auth/logout - Logout (revoke token)`);
  console.log(`   GET  /api/users - List users (admin)`);
  console.log(`   POST /api/users - Create user (admin)`);
  console.log(`   GET  /api/comments - List comments`);
  console.log(`   POST /api/comments - Add comment`);
  //console.log(`\nMQTT: ${mqttService.status().connected ? 'connected' : 'connecting...'} | Pump topic: ${mqttService.status().pumpTopic}`);
});

function shutdown(signal) {
  console.log(`${signal} signal received: closing HTTP server`);
  try {
    if (sqlService && typeof sqlService.close === 'function') {
      sqlService.close();
    }
    if (mqttService && typeof mqttService.close === 'function') {
      mqttService.close();
    }
  } catch (e) {
    console.error('Error during service shutdown:', e);
  }
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
