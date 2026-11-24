const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/update-fcm', authMiddleware, authController.updateFcmToken);
router.post('/create-user', authMiddleware, requireAdmin, authController.createUser);
router.get('/fcm-status', authController.getFcmStatus);
router.post('/test-push', authController.sendTestPush);

module.exports = router;
