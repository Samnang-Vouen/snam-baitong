const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/health.routes");
const sensorsRoutes = require("./routes/sensors.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const telegramRoutes = require("./routes/telegram.routes");
const plantsRoutes = require("./routes/plants.routes");
const qrRoutes = require("./routes/qr.routes");
const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const errorHandler = require("./middlewares/errorHandler");

function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Routes
  app.use("/health", healthRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/sensors", sensorsRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/telegram", telegramRoutes);
  app.use("/api/plants", plantsRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/qr", qrRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ success: false, error: "Endpoint not found" });
  });

  // Error handling middleware
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
