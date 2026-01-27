const express = require('express');
const router = express.Router();
const { createPlant, getPlant } = require('../controllers/plants.controller');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const { ROLES } = require('../services/user.service');

// Admin can create plants; both roles can view
router.post('/', authenticate, authorize([ROLES.ADMIN]), createPlant);
router.get('/:id', authenticate, authorize([ROLES.ADMIN, ROLES.MINISTRY]), getPlant);

module.exports = router;
