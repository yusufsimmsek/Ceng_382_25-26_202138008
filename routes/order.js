const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { requireLogin, requireRole } = require('../middleware/auth');

// user'a ozel route'lar
router.post('/orders/create', requireLogin, requireRole('user'), orderController.create);
router.get('/orders', requireLogin, requireRole('user'), orderController.myOrders);
router.get('/orders/:id/success', requireLogin, requireRole('user'), orderController.successPage);

// makbuz + sozlesme - user/caterer/admin (ownership kontrol controller icinde)
router.get('/orders/:id/receipt', requireLogin, orderController.downloadReceipt);
router.get('/orders/:id/agreement', requireLogin, orderController.downloadAgreement);

module.exports = router;
