const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.get('/', auth, notificationController.getAll);
router.post('/', auth, notificationController.create);
router.patch('/:id/read', auth, notificationController.markRead);

module.exports = router;
