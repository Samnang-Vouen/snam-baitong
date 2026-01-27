const express = require('express');
const router = express.Router();
const { postLogin, postLogout } = require('../controllers/auth.controller');
const authenticate = require('../middlewares/auth');

router.post('/login', postLogin);
router.post('/logout', authenticate, postLogout);

module.exports = router;
