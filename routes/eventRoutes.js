const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const auth = require('../middleware/auth');

router.get('/', auth, eventController.getAllEvents);
router.get('/:id/stats', auth, eventController.getEventStats);
router.get('/:id/participants', auth, eventController.getEventParticipants);
router.get('/:id/my-contribution', auth, eventController.getMyContribution);
router.post('/', auth, eventController.createEvent);
router.put('/:id/bulk-chandha', auth, eventController.bulkUpdateChandha);
router.put('/:id/chandha/:flat_no', auth, eventController.updateChandha);
router.put('/:id', auth, eventController.updateEvent);
router.delete('/:id', auth, eventController.deleteEvent);

module.exports = router;
