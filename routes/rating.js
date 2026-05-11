const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { requireLogin, requireRole } = require('../middleware/auth');

router.get('/orders/:id/rate', requireLogin, requireRole('user'), ratingController.rateForm);
router.post('/orders/:id/rate', requireLogin, requireRole('user'), ratingController.submitRating);

module.exports = router;
