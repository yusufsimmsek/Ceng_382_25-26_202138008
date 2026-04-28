const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { requireLogin, requireRole } = require('../middleware/auth');

// sadece user rolu sepete erisebilsin
router.use(requireLogin, requireRole('user'));

router.get('/', cartController.viewCart);
router.post('/add', cartController.addItem);
router.post('/update/:idx', cartController.updateItem);
router.post('/remove/:idx', cartController.removeItem);
router.post('/clear', cartController.clearCart);
router.post('/confirm-replace', cartController.confirmReplace);
router.post('/cancel-pending', cartController.cancelPending);

module.exports = router;
