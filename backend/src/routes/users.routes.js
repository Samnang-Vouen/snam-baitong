const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const { getUsers, postUser } = require('../controllers/users.controller');
const { ROLES } = require('../services/user.service');

router.use(authenticate);
router.get('/', authorize([ROLES.ADMIN]), getUsers);
router.post('/', authorize([ROLES.ADMIN]), postUser);

module.exports = router;
