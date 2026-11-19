const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, visitorController.getVisitors);
router.post('/', authMiddleware, visitorController.createVisitor);
router.patch('/:id/status', authMiddleware, visitorController.updateStatus);
router.post('/verify-pass', authMiddleware, visitorController.verifyPass);

module.exports = router;
