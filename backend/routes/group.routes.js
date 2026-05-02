const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const auth = require('../middleware/auth');

router.post('/', auth, groupController.createGroup);
router.get('/', auth, groupController.getGroups);
router.get('/:id', auth, groupController.getGroupById);
router.get('/:id/balances', auth, groupController.getGroupBalances);
router.put('/:id/members', auth, groupController.updateGroupMembers);

module.exports = router;
