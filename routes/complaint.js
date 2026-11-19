const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const auth = require('../middleware/auth');

router.get('/', auth, complaintController.getAll);
router.post('/', auth, complaintController.create);
router.patch('/:id/status', auth, complaintController.updateStatus);

module.exports = router;
