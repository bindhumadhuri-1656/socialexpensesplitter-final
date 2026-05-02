const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/me', auth, authController.getUserProfile);
router.get('/', auth, userController.searchUsers);

module.exports = router;
