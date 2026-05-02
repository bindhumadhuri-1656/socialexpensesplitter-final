const express = require('express');
const router = express.Router();
const settlementController = require('../controllers/settlementController');
const auth = require('../middleware/auth');

router.post('/', auth, settlementController.createSettlement);
router.get('/group/:groupId', auth, settlementController.getGroupSettlements);

module.exports = router;
