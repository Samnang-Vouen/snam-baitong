const express = require("express");
const router = express.Router();
const {
  createPlant,
  listPlants,
  getPlant,
  updatePlant,
  deletePlant,
} = require("../controllers/plants.controller");
const { authenticate, requireRole } = require("../middlewares/auth.middleware");

router.use(authenticate);

router.get("/", requireRole("admin", "ministry"), listPlants);
router.post("/", requireRole("admin"), createPlant);
router.get("/:id", requireRole("admin", "ministry"), getPlant);
router.put("/:id", requireRole("admin"), updatePlant);
router.delete("/:id", requireRole("admin"), deletePlant);

module.exports = router;
