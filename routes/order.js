const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { requireLogin, requireRole } = require('../middleware/auth');

router.use(requireLogin);

// user'a ozel route'lar
router.post('/orders/create', requireRole('user'), orderController.create);
router.get('/orders', requireRole('user'), orderController.myOrders);
router.get('/orders/:id/success', requireRole('user'), orderController.successPage);

// makbuz - user/caterer/admin (ownership kontrol controller icinde)
router.get('/orders/:id/receipt', orderController.downloadReceipt);

module.exports = router;
