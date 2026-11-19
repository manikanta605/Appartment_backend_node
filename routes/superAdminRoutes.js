const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const authMiddleware = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/auth');

// All routes require Super Admin authentication
router.use(authMiddleware, requireSuperAdmin);

router.get('/societies', superAdminController.getAllSocieties);
router.post('/societies', superAdminController.createSociety);
router.put('/societies/:id', superAdminController.updateSociety);
router.get('/stats', superAdminController.getPlatformStats);

module.exports = router;

