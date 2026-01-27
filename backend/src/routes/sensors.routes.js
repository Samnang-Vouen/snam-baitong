const express = require('express');
const router = express.Router();
const sensors = require('../controllers/sensors.controller');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const { ROLES } = require('../services/user.service');

router.get('/latest', authenticate, authorize([ROLES.ADMIN, ROLES.MINISTRY]), sensors.getLatest);

module.exports = router;
