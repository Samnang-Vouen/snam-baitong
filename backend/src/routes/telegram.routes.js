const express = require('express');
const router = express.Router();
const telegram = require('../controllers/telegram.controller');

// Send a message: POST /api/telegram/send
// Body: { text: string, chatId?: string, parseMode?: 'Markdown'|'HTML', disableNotification?: boolean }
router.post('/send', telegram.send);

// Inspect recent updates: GET /api/telegram/updates?limit=5
router.get('/updates', telegram.updates);

// Send latest sensor data to a chat
router.post('/send-latest', telegram.sendLatest);

// Telegram webhook endpoint to handle /update command
router.post('/webhook', telegram.webhook);

module.exports = router;
