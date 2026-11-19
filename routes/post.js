const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const auth = require('../middleware/auth');

router.get('/', auth, postController.getAll);
router.post('/', auth, postController.create);
router.delete('/:id', auth, postController.delete);

module.exports = router;
