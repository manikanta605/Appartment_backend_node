const express = require('express');
const router = express.Router();
const patrolController = require('../controllers/patrolController');
const authMiddleware = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');

// All patrol routes require authentication
router.use(authMiddleware);

// Get all checkpoints (for all users, guard scanner & admin)
router.get('/checkpoints', patrolController.getCheckpoints);

// Watchman / Guard records QR scan
router.post('/scan', patrolController.recordScan);

// All users (Residents, Guard, Admin) view patrol logs
router.get('/logs', patrolController.getLogs);

// Admin management of checkpoints
router.post('/checkpoints', requireAdmin, patrolController.createCheckpoint);
router.delete('/checkpoints/:id', requireAdmin, patrolController.deleteCheckpoint);

module.exports = router;
