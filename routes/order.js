const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { requireLogin, requireRole } = require('../middleware/auth');

router.use(requireLogin, requireRole('user'));

router.post('/orders/create', orderController.create);
router.get('/orders/:id/success', orderController.successPage);
router.get('/orders', orderController.myOrders);

module.exports = router;
