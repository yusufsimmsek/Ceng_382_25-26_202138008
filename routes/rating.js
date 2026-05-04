const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { requireLogin, requireRole } = require('../middleware/auth');

router.use(requireLogin, requireRole('user'));

router.get('/orders/:id/rate', ratingController.rateForm);
router.post('/orders/:id/rate', ratingController.submitRating);

module.exports = router;
