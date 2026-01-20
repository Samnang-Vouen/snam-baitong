const express = require('express');
const router = express.Router();
const { createPlant, getPlant } = require('../controllers/plants.controller');

router.post('/', createPlant);
router.get('/:id', getPlant);

module.exports = router;
