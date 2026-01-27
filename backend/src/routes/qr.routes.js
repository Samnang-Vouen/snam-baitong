const express = require('express');
const router = express.Router();
const { generateQr, getAggregatedByToken } = require('../controllers/qr.controller');

router.post('/generate', generateQr);
router.get('/scan/:token', getAggregatedByToken);

module.exports = router;
