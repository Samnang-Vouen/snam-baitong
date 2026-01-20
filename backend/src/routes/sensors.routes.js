const express = require('express');
const router = express.Router();
const sensors = require('../controllers/sensors.controller');

router.get('/latest', sensors.getLatest);

module.exports = router;
