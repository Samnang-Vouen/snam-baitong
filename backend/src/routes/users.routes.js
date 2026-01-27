const express = require("express");
const router = express.Router();
const {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/users.controller");
const { authenticate, requireRole } = require("../middlewares/auth.middleware");

router.use(authenticate);

router.get("/", requireRole("admin"), listUsers);
router.post("/", requireRole("admin"), createUser);
router.put("/:id", requireRole("admin"), updateUser);
router.delete("/:id", requireRole("admin"), deleteUser);

module.exports = router;
