const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');

router.get('/', authMiddleware, paymentController.getAllPayments);
router.post('/', authMiddleware, paymentController.createPayment);
router.put('/:id', authMiddleware, paymentController.updatePayment);
router.delete('/:id', authMiddleware, requireAdmin, paymentController.deletePayment);

// Admin dynamic dues generation
router.post('/generate-dues', authMiddleware, requireAdmin, paymentController.triggerDues);

// Razorpay Order & Payment Verification
router.post('/create-order', authMiddleware, paymentController.createOrder);
router.post('/verify-payment', authMiddleware, paymentController.verifyPayment);

module.exports = router;
