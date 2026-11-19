const express = require('express');
const router = express.Router();
const societyController = require('../controllers/societyController');
const authMiddleware = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');

// Public route for login selection
router.get('/public', societyController.getPublicSocieties);

// Authenticated routes
router.get('/current', authMiddleware, societyController.getCurrentSociety);
router.put('/settings', authMiddleware, requireAdmin, societyController.updateSocietySettings);

module.exports = router;

