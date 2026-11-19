const express = require('express');
const router = express.Router();
const amenityController = require('../controllers/amenityController');
const auth = require('../middleware/auth');

// Amenities Routes (Admin primarily)
router.get('/', auth, amenityController.getAllAmenities);
router.post('/', auth, amenityController.createAmenity);
router.put('/:id', auth, amenityController.updateAmenity);
router.delete('/:id', auth, amenityController.deleteAmenity);

// Booking Routes (Members & Admin)
router.get('/bookings', auth, amenityController.getAllBookings);
router.post('/bookings', auth, amenityController.createBooking);
router.put('/bookings/:id/status', auth, amenityController.updateBookingStatus); // Admin approval

module.exports = router;
